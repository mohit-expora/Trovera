import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorsService } from './errors.service';
import { PaginationDto, paginatedResponse } from '../common/dto/pagination.dto';

class ClientErrorDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;

  context?: any;
}

@ApiTags('errors')
@Controller('errors')
export class ErrorsController {
  constructor(private errorsService: ErrorsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('errors:read')
  async listErrors(@Query() pagination: PaginationDto) {
    const { errors, total } = await this.errorsService.findAll({
      page: pagination.page || 1,
      pageSize: pagination.page_size || 20,
    });
    return paginatedResponse(errors, total, pagination.page || 1, pagination.page_size || 20);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  @RequirePermissions('errors:resolve')
  async resolveError(@Param('id') id: string) {
    const err = await this.errorsService.resolve(id);
    return { success: true, data: err };
  }

  @Post('client')
  @HttpCode(HttpStatus.CREATED)
  async logClientError(
    @Body() dto: ClientErrorDto,
    @Req() req: Request,
    @CurrentUser() currentUser?: any,
  ) {
    const err = await this.errorsService.logClientError({
      message: dto.message,
      stack: dto.stack,
      context: dto.context,
      userId: currentUser?.sub,
      ip: req.ip,
      requestId: (req as any).requestId,
    });
    return { success: true, data: { id: err.id } };
  }
}
