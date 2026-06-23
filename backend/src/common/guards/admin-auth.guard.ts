import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthenticationError } from '../exceptions/app.exception';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.session?.user) {
      throw new AuthenticationError('Authentication required');
    }
    request.user = request.session.user;
    return true;
  }
}
