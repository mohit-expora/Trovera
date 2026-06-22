export interface PaginatedMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginatedMeta;
}

export interface ApiSuccess<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
  request_id?: string;
}
