import { serverFetch } from "@/lib/auth-actions";
import type { PaginatedResponse } from "@/types/api";
import type { Fine } from "@/types/transaction";
import { FinesPageClient } from "./FinesPageClient";

export default async function FinesPage() {
  const initialData = await serverFetch<PaginatedResponse<Fine>>(
    "/fines?page=1&page_size=20"
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fines</h1>
        <p className="text-muted-foreground text-sm">
          View and manage overdue fines.
        </p>
      </div>
      <FinesPageClient initialData={initialData} />
    </div>
  );
}
