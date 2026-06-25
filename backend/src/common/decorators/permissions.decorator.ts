import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
// @RequirePermissions('books:create', 'books:delete') — fine-grained action-level gate.
// Permission strings are matched against user.permissions embedded in the session.
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const ROLES_KEY = 'roles';
// @RequireRoles('admin', 'librarian') — coarser role-level gate.
// Use when an entire controller/route section belongs to a specific role tier.
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
