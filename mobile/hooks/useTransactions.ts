import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Fine, Transaction } from "@/types/transaction";

export function useTransactions(params: Record<string, unknown> = {}) {
  return useInfiniteQuery({
    queryKey: ["transactions", params],
    queryFn: async ({ pageParam = 1 }) => {
      return api.getPaginated<Transaction>("/transactions", {
        ...params,
        page: pageParam,
        page_size: 20,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) => {
      if (lastPageParam < last.meta.total_pages) return lastPageParam + 1;
      return undefined;
    },
  });
}

export function useFines(params: Record<string, unknown> = {}) {
  return useInfiniteQuery({
    queryKey: ["fines", params],
    queryFn: async ({ pageParam = 1 }) => {
      return api.getPaginated<Fine>("/fines", {
        ...params,
        page: pageParam,
        page_size: 20,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last, _, lastPageParam) => {
      if (lastPageParam < last.meta.total_pages) return lastPageParam + 1;
      return undefined;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [books, transactions, fines] = await Promise.all([
        api.getPaginated("/books", { page: 1, page_size: 1 }),
        api.getPaginated("/transactions", { page: 1, page_size: 1, status: "issued" }),
        api.getPaginated("/fines", { page: 1, page_size: 1, status: "pending" }),
      ]);
      return {
        totalBooks: books.meta.total,
        issuedBooks: transactions.meta.total,
        pendingFines: fines.meta.total,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
