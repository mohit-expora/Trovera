"use client";

import useSWR, { type KeyedMutator } from "swr";
import { api } from "@/lib/api";
import { swrFetcher } from "@/lib/swr-config";
import { useBookStore } from "@/store/bookStore";
import type { Book, BookCategory, BookFilter } from "@/types/book";
import type { ApiSuccess, PaginatedMeta, PaginatedResponse } from "@/types/api";

// ── Build query string from filters ───────────────────────────────────────────
function buildBookParams(
  filters: BookFilter & { page?: number; page_size?: number }
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  if (filters.search) params.search = filters.search;
  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.language) params.language = filters.language;
  if (filters.author) params.author = filters.author;
  if (filters.available_only) params.available_only = true;
  if (filters.sort_by) params.sort_by = filters.sort_by;
  if (filters.sort_order) params.sort_order = filters.sort_order;
  params.page = filters.page ?? 1;
  params.page_size = filters.page_size ?? 20;
  return params;
}

// ── useBooks ──────────────────────────────────────────────────────────────────
export function useBooks(
  filters: BookFilter & { page?: number; page_size?: number } = {},
  fallbackData?: PaginatedResponse<Book>
) {
  const { pendingDeletes, optimisticBooks } = useBookStore();

  const params = buildBookParams(filters);
  const swrKey = ["/books", params] as const;

  const {
    data,
    isLoading,
    error,
    mutate,
  } = useSWR<PaginatedResponse<Book>>(
    swrKey,
    ([url, p]) => api.get<PaginatedResponse<Book>>(url, p as Record<string, unknown>),
    { fallbackData }
  );

  // Apply optimistic state on top of server data
  const rawBooks = data?.data ?? [];
  const books: Book[] = rawBooks
    .filter((b) => !pendingDeletes.has(b.id))
    .map((b) => {
      const optimistic = optimisticBooks.get(b.id);
      return optimistic ? { ...b, ...optimistic } : b;
    });

  const meta: PaginatedMeta | undefined = data?.meta;

  return { books, meta, isLoading, error: error?.message ?? null, mutate };
}

// ── useBook ───────────────────────────────────────────────────────────────────
export function useBook(id: number, fallbackData?: Book) {
  const { optimisticBooks } = useBookStore();

  const { data, isLoading, error, mutate } = useSWR<ApiSuccess<Book>>(
    id ? `/books/${id}` : null,
    swrFetcher,
    { fallbackData: fallbackData ? { success: true, data: fallbackData } : undefined }
  );

  const serverBook = data?.data ?? null;
  const optimistic = id ? optimisticBooks.get(id) : undefined;
  const book = serverBook
    ? optimistic
      ? { ...serverBook, ...optimistic }
      : serverBook
    : null;

  return {
    book,
    isLoading,
    error: error?.message ?? null,
    mutate,
  };
}

// ── useBookCategories ─────────────────────────────────────────────────────────
export function useBookCategories() {
  const { data, isLoading } = useSWR<{ success: boolean; data: BookCategory[] }>(
    "/books/categories",
    swrFetcher
  );

  return {
    categories: data?.data ?? [],
    isLoading,
  };
}

// ── useBookMutations ──────────────────────────────────────────────────────────
export function useBookMutations(mutateList?: KeyedMutator<PaginatedResponse<Book>>) {
  const { optimisticDelete, revertOptimistic, clearOptimistic } = useBookStore();

  async function createBook(bookData: Partial<Book>): Promise<Book> {
    const res = await api.post<ApiSuccess<Book>>("/books", bookData);
    await mutateList?.();
    return res.data;
  }

  async function updateBook(id: number, bookData: Partial<Book>): Promise<Book> {
    const res = await api.patch<ApiSuccess<Book>>(`/books/${id}`, bookData);
    await mutateList?.();
    return res.data;
  }

  async function deleteBook(id: number): Promise<void> {
    optimisticDelete(id);
    try {
      await api.delete(`/books/${id}`);
      await mutateList?.();
      clearOptimistic();
    } catch (err) {
      revertOptimistic(id);
      throw err;
    }
  }

  async function uploadCoverImage(
    id: number,
    file: File
  ): Promise<{ cover_image_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.upload<ApiSuccess<{ cover_image_url: string }>>(
      `/books/${id}/cover`,
      formData
    );
    return res.data;
  }

  return { createBook, updateBook, deleteBook, uploadCoverImage };
}
