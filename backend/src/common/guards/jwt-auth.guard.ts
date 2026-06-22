import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticationError } from '../exceptions/app.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw new AuthenticationError(info?.message || 'Authentication required');
    }
    return user;
  }
}
