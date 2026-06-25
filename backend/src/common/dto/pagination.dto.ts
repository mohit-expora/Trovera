import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Standard page-based pagination DTO. Prisma queries use the computed offset/limit getters
// rather than page/page_size directly to avoid repeating the arithmetic everywhere.
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  get offset() {
    return ((this.page || 1) - 1) * (this.page_size || 20);
  }

  get limit() {
    return this.page_size || 20;
  }
}

// Builds the paginated envelope expected by the frontend.
// Pass this object directly from a controller — TransformInterceptor detects `success` and skips re-wrapping.
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return {
    success: true,
    data: items,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize),
  };
}
