import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

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
