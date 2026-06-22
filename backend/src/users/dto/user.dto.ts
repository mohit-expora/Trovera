import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional() @IsString() full_name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() avatar_url?: string;
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole) role: UserRole;
}

export class UpdateUserActivateDto {
  @IsBoolean() is_active: boolean;
}
