import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLES_KEY } from '../decorators/permissions.decorator';
import { AuthorizationError, AuthenticationError } from '../exceptions/app.exception';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions && !requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new AuthenticationError('Authentication required');

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      throw new AuthorizationError('You do not have the required role for this action');
    }

    if (requiredPermissions) {
      const userPermissions: string[] = user.permissions || [];
      const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));
      if (missing.length > 0) {
        throw new AuthorizationError(`Permission '${missing[0]}' is required for this action`);
      }
    }

    return true;
  }
}
