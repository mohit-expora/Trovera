import { UserRole } from '@prisma/client';

// Static permission map — no DB storage. Permissions are embedded in the session at login
// and re-read from this map when a role changes (see UsersService.updateRole).
//
// Permission naming conventions:
//   page:<name>:view       — controls whether a sidebar nav item is visible in the UI
//   <resource>:<action>    — guards an API endpoint (checked by PermissionsGuard)
//   <resource>:<action>:cta / :field / :section  — UI-only hints (hide/show buttons & fields)
export const ROLE_PERMISSIONS: Record<UserRole, Set<string>> = {
  [UserRole.super_admin]: new Set([
    'page:books:view', 'page:transactions:view', 'page:members:view',
    'page:fines:view', 'page:roles:view', 'page:settings:view', 'page:errors:view',
    'books:create', 'books:read', 'books:update', 'books:delete', 'books:image:upload',
    'books:create:cta', 'books:edit:cta', 'books:delete:cta', 'books:shelf_location:field',
    'categories:create', 'categories:read',
    'transactions:issue', 'transactions:return', 'transactions:list', 'transactions:read',
    'transactions:lost', 'transactions:issue:cta', 'transactions:return:cta', 'transactions:lost:cta',
    'fines:read', 'fines:pay', 'fines:waive', 'fines:list',
    'fines:pay:cta', 'fines:waive:cta', 'fines:waive:section',
    'users:create', 'users:read', 'users:update', 'users:delete',
    'users:role:update', 'users:activate', 'users:role:field', 'users:phone:field',
    'roles:read', 'roles:permission:update',
    'audit_logs:read', 'errors:read', 'errors:resolve',
  ]),
  [UserRole.librarian]: new Set([
    'page:books:view', 'page:transactions:view', 'page:members:view',
    'page:fines:view', 'page:settings:view',
    'books:create', 'books:read', 'books:update', 'books:image:upload',
    'books:create:cta', 'books:edit:cta', 'books:shelf_location:field',
    'categories:create', 'categories:read',
    'transactions:issue', 'transactions:return', 'transactions:list', 'transactions:read',
    'transactions:lost', 'transactions:issue:cta', 'transactions:return:cta', 'transactions:lost:cta',
    'fines:read', 'fines:pay', 'fines:list',
    'fines:pay:cta',
    'users:read', 'users:phone:field',
  ]),
  [UserRole.member]: new Set([
    'page:books:view', 'page:settings:view',
    'books:read', 'categories:read',
    'transactions:read',
    'fines:read',
  ]),
};
