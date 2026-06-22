import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Book, BookCategory, BookFilter } from "@/types/book";

export function useBooks(filters: BookFilter = {}) {
  return useInfiniteQuery({
    queryKey: ["books", filters],
    queryFn: async ({ pageParam = 1 }) => {
      return api.getPaginated<Book>("/books", {
        ...filters,
        page: pageParam,
        page_size: filters.page_size ?? 20,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) => {
      if (lastPageParam < last.meta.total_pages) return lastPageParam + 1;
      return undefined;
    },
  });
}

export function useBook(id: string) {
  return useQuery({
    queryKey: ["book", id],
    queryFn: () => api.get<Book>(`/books/${id}`),
    enabled: !!id,
  });
}

export function useBookCategories() {
  return useQuery({
    queryKey: ["book-categories"],
    queryFn: () => api.get<BookCategory[]>("/books/categories"),
    staleTime: 60 * 60 * 1000,
  });
}
