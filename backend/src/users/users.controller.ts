import {
  Controller, Get, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions, RequireRoles } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserRoleDto, UpdateUserActivateDto } from './dto/user.dto';
import { PaginationDto, paginatedResponse } from '../common/dto/pagination.dto';
import { AuthorizationError } from '../common/exceptions/app.exception';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @RequirePermissions('users:read')
  async listUsers(
    @Query() pagination: PaginationDto,
    @Query('role') role?: UserRole,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
  ) {
    const { users, total } = await this.usersService.findAll({
      page: pagination.page || 1,
      pageSize: pagination.page_size || 20,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
    return paginatedResponse(users, total, pagination.page || 1, pagination.page_size || 20);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  async getUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    if (currentUser.role === UserRole.member && currentUser.sub !== id) {
      throw new AuthorizationError('You can only access your own profile');
    }
    return { success: true, data: await this.usersService.findById(id) };
  }

  @Patch(':id')
  @RequirePermissions('users:update')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() currentUser: any) {
    if (currentUser.role === UserRole.member && currentUser.sub !== id) {
      throw new AuthorizationError('You can only update your own profile');
    }
    return { success: true, data: await this.usersService.update(id, dto) };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireRoles(UserRole.super_admin)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.softDelete(id);
  }

  @Patch(':id/role')
  @RequireRoles(UserRole.super_admin)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return { success: true, data: await this.usersService.updateRole(id, dto) };
  }

  @Patch(':id/activate')
  @RequireRoles(UserRole.super_admin)
  async activateUser(@Param('id') id: string, @Body() dto: UpdateUserActivateDto) {
    return { success: true, data: await this.usersService.updateActivate(id, dto) };
  }

  @Get(':id/transactions')
  @RequirePermissions('transactions:read')
  async getUserTransactions(@Param('id') id: string, @Query() pagination: PaginationDto, @CurrentUser() currentUser: any) {
    if (currentUser.role === UserRole.member && currentUser.sub !== id) {
      throw new AuthorizationError('You can only view your own transactions');
    }
    const page = pagination.page || 1;
    const pageSize = pagination.page_size || 20;
    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { member_id: id },
        include: { book: true, member: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.transaction.count({ where: { member_id: id } }),
    ]);
    return paginatedResponse(transactions, total, page, pageSize);
  }

  @Get(':id/fines')
  @RequirePermissions('fines:read')
  async getUserFines(@Param('id') id: string, @Query() pagination: PaginationDto, @CurrentUser() currentUser: any) {
    if (currentUser.role === UserRole.member && currentUser.sub !== id) {
      throw new AuthorizationError('You can only view your own fines');
    }
    const page = pagination.page || 1;
    const pageSize = pagination.page_size || 20;
    const [fines, total] = await this.prisma.$transaction([
      this.prisma.fine.findMany({
        where: { member_id: id },
        include: { transaction: { include: { book: true } } },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.fine.count({ where: { member_id: id } }),
    ]);
    return paginatedResponse(fines, total, page, pageSize);
  }
}
