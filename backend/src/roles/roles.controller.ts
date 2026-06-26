import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsBoolean } from 'class-validator';
import { AdminAuthGuard } from '../common/guards/admin-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ROLE_PERMISSIONS } from './permissions.config';

class UpdatePermissionDto {
  @IsString() permission: string;
  @IsBoolean() granted: boolean;
}

// Roles and their permissions are read-only from this controller — they come from the
// static ROLE_PERMISSIONS map, not from DB. updateRolePermissions is a stub; persist
// to DB and reload the map if dynamic per-role customisation is ever needed.
@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard, PermissionsGuard)
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
    const perms = ROLE_PERMISSIONS[role];
    if (perms) {
      if (dto.granted) {
        perms.add(dto.permission);
      } else {
        perms.delete(dto.permission);
      }
    }
    return { success: true, data: { role, permissions: Array.from(ROLE_PERMISSIONS[role] || []) } };
  }
}
