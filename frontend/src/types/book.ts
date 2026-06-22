export interface BookCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  publisher?: string | null;
  published_year?: number | null;
  category_id?: string | null;
  category?: BookCategory | null;
  language: string;
  description?: string | null;
  cover_image_url?: string | null;
  total_quantity: number;
  available_quantity: number;
  shelf_location?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookFilter {
  search?: string;
  category_id?: string;
  language?: string;
  author?: string;
  available_only?: boolean;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
