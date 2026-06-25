import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthenticationError } from '../exceptions/app.exception';

// Checks that a valid session exists (user is logged in).
// Copies session.user → req.user so that PermissionsGuard and @AdminUser()
// can read the user without knowing about the session layer.
@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.session?.user) {
      throw new AuthenticationError('Authentication required');
    }

    // Bridge session → req.user so downstream guards and decorators work unchanged
    request.user = request.session.user;
    return true;
  }
}
