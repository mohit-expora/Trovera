import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Wraps every successful response in { success: true, data: ... }.
// Paginated endpoints return { success, data, total, page, ... } via paginatedResponse()
// which already has `success` — the pass-through check avoids double-wrapping.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data === undefined || data === null) return data;
        // Already wrapped (paginatedResponse, or controller returned {success, ...}) — pass through
        if (typeof data === 'object' && 'success' in data) return data;
        return { success: true, data };
      }),
    );
  }
}
