export interface BookCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  category_id?: number | null;
  category?: BookCategory | null;
  language: string;
  description?: string | null;
  cover_image_url?: string | null;
  total_quantity: number;
  available_quantity: number;
  shelf_location?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BookFilter {
  search?: string;
  category_id?: number;
  language?: string;
  author?: string;
  available_only?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
