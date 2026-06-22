import { serverFetch } from "@/lib/auth-actions";
import type { PaginatedResponse } from "@/types/api";
import type { User } from "@/types/user";
import { MembersPageClient } from "./MembersPageClient";

export default async function MembersPage() {
  const initialData = await serverFetch<PaginatedResponse<User>>(
    "/users?page=1&page_size=20"
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          Manage library members and their roles.
        </p>
      </div>
      <MembersPageClient initialData={initialData} />
    </div>
  );
}
