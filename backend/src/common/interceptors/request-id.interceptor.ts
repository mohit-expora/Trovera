import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

// Attaches a request ID to every request and response.
// Forwards X-Request-ID from the client if present (useful for tracing across services);
// otherwise generates a new UUID. The ID is also attached to error responses by AllExceptionsFilter.
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const requestId = (request.headers['x-request-id'] as string) || uuidv4();
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);
    return next.handle();
  }
}
