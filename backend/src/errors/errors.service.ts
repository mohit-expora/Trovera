import { Injectable } from '@nestjs/common';
import { ErrorSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundError } from '../common/exceptions/app.exception';

@Injectable()
export class ErrorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { page: number; pageSize: number }) {
    const [errors, total] = await this.prisma.$transaction([
      this.prisma.errorLog.findMany({
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.errorLog.count(),
    ]);
    return { errors, total };
  }

  async resolve(id: string) {
    const err = await this.prisma.errorLog.findUnique({ where: { id } });
    if (!err) throw new NotFoundError('Error log not found');
    return this.prisma.errorLog.update({ where: { id }, data: { resolved: true } });
  }

  async logClientError(data: {
    message: string; stack?: string; context?: any;
    userId?: string; ip?: string; requestId?: string;
  }) {
    return this.prisma.errorLog.create({
      data: {
        message: data.message,
        stack_trace: data.stack,
        context: data.context,
        user_id: data.userId,
        ip_address: data.ip,
        request_id: data.requestId,
        severity: ErrorSeverity.low,
        error_code: 'CLIENT_ERROR',
      },
    });
  }
}
