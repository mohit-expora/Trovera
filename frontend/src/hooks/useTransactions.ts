import useSWR, { type KeyedMutator } from "swr";
import type { Transaction, Fine, TransactionStatus, FineStatus } from "@/types/transaction";
import type { PaginatedResponse, PaginatedMeta, ApiSuccess } from "@/types/api";
import { api } from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────

function buildQuery(filters: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

// ── Transactions ───────────────────────────────────────────────────────────

interface TransactionFilters {
  page?: number;
  page_size?: number;
  status?: TransactionStatus;
  member_id?: number;
  book_id?: number;
}

export function useTransactions(
  filters?: TransactionFilters,
  fallbackData?: PaginatedResponse<Transaction>
): {
  transactions: Transaction[];
  meta: PaginatedMeta | null;
  isLoading: boolean;
  error: unknown;
  mutate: KeyedMutator<PaginatedResponse<Transaction>>;
} {
  const qs = buildQuery({ page: 1, page_size: 20, ...filters });
  const key = `/transactions${qs}`;

  const { data, isLoading, error, mutate } = useSWR<PaginatedResponse<Transaction>>(key, {
    fallbackData,
  });

  return {
    transactions: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useTransaction(id: number): {
  transaction: Transaction | null;
  isLoading: boolean;
  error: unknown;
  mutate: KeyedMutator<ApiSuccess<Transaction>>;
} {
  const { data, isLoading, error, mutate } = useSWR<ApiSuccess<Transaction>>(
    id ? `/transactions/${id}` : null
  );

  return {
    transaction: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}

interface IssueBookData {
  book_id: number;
  member_id: number;
  due_date: string;
  notes?: string;
}

export function useTransactionMutations(): {
  issueBook: (data: IssueBookData) => Promise<Transaction>;
  returnBook: (id: number, data?: { notes?: string }) => Promise<Transaction>;
  markLost: (id: number) => Promise<Transaction>;
} {
  const issueBook = async (data: IssueBookData): Promise<Transaction> => {
    const res = await api.post<ApiSuccess<Transaction>>("/transactions/issue", data);
    return res.data;
  };

  const returnBook = async (id: number, data?: { notes?: string }): Promise<Transaction> => {
    const res = await api.patch<ApiSuccess<Transaction>>(`/transactions/${id}/return`, data ?? {});
    return res.data;
  };

  const markLost = async (id: number): Promise<Transaction> => {
    const res = await api.patch<ApiSuccess<Transaction>>(`/transactions/${id}/lost`, {});
    return res.data;
  };

  return { issueBook, returnBook, markLost };
}

// ── Fines ──────────────────────────────────────────────────────────────────

interface FineFilters {
  page?: number;
  page_size?: number;
  status?: FineStatus;
  member_id?: number;
}

export function useFines(
  filters?: FineFilters,
  fallbackData?: PaginatedResponse<Fine>
): {
  fines: Fine[];
  meta: PaginatedMeta | null;
  isLoading: boolean;
  error: unknown;
  mutate: KeyedMutator<PaginatedResponse<Fine>>;
} {
  const qs = buildQuery({ page: 1, page_size: 20, ...filters });
  const key = `/fines${qs}`;

  const { data, isLoading, error, mutate } = useSWR<PaginatedResponse<Fine>>(key, {
    fallbackData,
  });

  return {
    fines: data?.data ?? [],
    meta: data?.meta ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useFineMutations(): {
  payFine: (id: number) => Promise<Fine>;
  waiveFine: (id: number, reason: string) => Promise<Fine>;
} {
  const payFine = async (id: number): Promise<Fine> => {
    const res = await api.patch<ApiSuccess<Fine>>(`/fines/${id}/pay`, {});
    return res.data;
  };

  const waiveFine = async (id: number, reason: string): Promise<Fine> => {
    const res = await api.patch<ApiSuccess<Fine>>(`/fines/${id}/waive`, { waive_reason: reason });
    return res.data;
  };

  return { payFine, waiveFine };
}
