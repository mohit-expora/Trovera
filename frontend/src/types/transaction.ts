import type { Book } from "./book";
import type { User } from "./user";

export type TransactionStatus = "issued" | "returned" | "overdue" | "lost";
export type FineStatus = "pending" | "paid" | "waived";

export interface Transaction {
  id: number;
  book_id: number;
  member_id: number;
  issued_by?: number | null;
  returned_to?: number | null;
  status: TransactionStatus;
  issued_at: string;
  due_date: string;
  returned_at?: string | null;
  notes?: string | null;
  created_at: string;
  book?: Book | null;
  member?: User | null;
}

export interface Fine {
  id: number;
  transaction_id: number;
  member_id: number;
  amount: number;
  per_day_rate: number;
  days_overdue: number;
  status: FineStatus;
  paid_at?: string | null;
  waived_at?: string | null;
  waive_reason?: string | null;
  created_at: string;
  member?: User | null;
}
