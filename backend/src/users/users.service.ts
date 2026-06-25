import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { NotFoundError } from '../common/exceptions/app.exception';
import { UpdateUserDto, UpdateUserRoleDto, UpdateUserActivateDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(params: {
    page: number;
    pageSize: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }) {
    const where: any = { deleted_at: null };
    if (params.role) where.role = params.role;
    if (params.isActive !== undefined) where.is_active = params.isActive;
    if (params.search) {
      where.OR = [
        { full_name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findById(id: number) {
    const user = await this.prisma.user.findFirst({ where: { id, deleted_at: null } });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async updateRole(id: number, dto: UpdateUserRoleDto) {
    await this.findById(id);
    const user = await this.prisma.user.update({ where: { id }, data: { role: dto.role } });
    // Invalidate the cached permissions for this user so the next request re-reads from ROLE_PERMISSIONS
    await this.cache.delete(`permissions:${id}`);
    return user;
  }

  async updateActivate(id: number, dto: UpdateUserActivateDto) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { is_active: dto.is_active } });
  }

  // Soft delete — sets deleted_at so the record is retained for transaction history
  async softDelete(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.user.update({ where: { id }, data: { deleted_at: new Date() } });
  }
}
