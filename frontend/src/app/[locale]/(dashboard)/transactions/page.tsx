import { serverFetch } from "@/lib/auth-actions";
import type { PaginatedResponse } from "@/types/api";
import type { Transaction } from "@/types/transaction";
import { TransactionsPageClient } from "./TransactionsPageClient";

export default async function TransactionsPage() {
  const initialData = await serverFetch<PaginatedResponse<Transaction>>(
    "/transactions?page=1&page_size=20"
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground text-sm">
          Manage book issuances and returns.
        </p>
      </div>
      <TransactionsPageClient initialData={initialData} />
    </div>
  );
}
