import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ROLE_PERMISSIONS } from './permissions.config';

class UpdatePermissionDto {
  @IsString() permission: string;
  @IsBoolean() granted: boolean;
}

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  @Get()
  @RequirePermissions('roles:read')
  listRoles() {
    return {
      success: true,
      data: Object.values(UserRole).map((role) => ({
        role,
        permissions: Array.from(ROLE_PERMISSIONS[role] || []),
      })),
    };
  }

  @Get(':role/permissions')
  @RequirePermissions('roles:read')
  getRolePermissions(@Param('role') role: UserRole) {
    return { success: true, data: { role, permissions: Array.from(ROLE_PERMISSIONS[role] || []) } };
  }

  @Patch(':role/permissions')
  @RequirePermissions('roles:permission:update')
  updateRolePermissions(@Param('role') role: UserRole, @Body() dto: UpdatePermissionDto) {
    return { success: true, data: { role, permission: dto.permission, granted: dto.granted } };
  }
}
