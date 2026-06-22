export type TransactionStatus = "issued" | "returned" | "overdue" | "lost";
export type FineStatus = "pending" | "paid" | "waived";

export interface Transaction {
  id: string;
  book_id: string;
  member_id: string;
  issued_by?: string | null;
  returned_to?: string | null;
  status: TransactionStatus;
  issued_at: string;
  due_date: string;
  returned_at?: string | null;
  notes?: string | null;
  book?: {
    title: string;
    author: string;
    cover_image_url?: string | null;
  };
  member?: {
    full_name: string;
    email: string;
  };
}

export interface Fine {
  id: string;
  transaction_id: string;
  member_id: string;
  amount: number;
  per_day_rate: number;
  days_overdue: number;
  status: FineStatus;
  paid_at?: string | null;
  waive_reason?: string | null;
  transaction?: {
    due_date: string;
    book?: { title: string; cover_image_url?: string | null } | null;
  } | null;
}
