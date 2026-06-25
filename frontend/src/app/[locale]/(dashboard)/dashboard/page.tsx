import * as React from "react";
import { getTranslations } from "next-intl/server";
import { BookOpen, Users, ArrowLeftRight, AlertCircle } from "lucide-react";
import { serverFetch } from "@/lib/auth-actions";
import type { PaginatedResponse } from "@/types/api";
import type { Book } from "@/types/book";
import type { Transaction } from "@/types/transaction";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  // Parallel data fetching
  const [booksData, transactionsData, allBooksData, membersData, openTxData, finesData] =
    await Promise.all([
      serverFetch<PaginatedResponse<Book>>("/books?page=1&page_size=1"),
      serverFetch<PaginatedResponse<Transaction>>("/transactions?page=1&page_size=5"),
      serverFetch<PaginatedResponse<Book>>("/books?available_only=false&page=1&page_size=10"),
      serverFetch<PaginatedResponse<{ id: number }>>("/users?role=member&page=1&page_size=1"),
      serverFetch<PaginatedResponse<Transaction>>("/transactions?status=issued&page=1&page_size=1"),
      serverFetch<PaginatedResponse<{ id: number }>>("/fines?status=pending&page=1&page_size=1"),
    ]);

  const totalBooks = booksData?.meta.total ?? 0;
  const activeMembers = membersData?.meta.total ?? 0;
  const openTransactions = openTxData?.meta.total ?? 0;
  const pendingFines = finesData?.meta.total ?? 0;
  const recentTransactions: Transaction[] = transactionsData?.data ?? [];
  const allBooks: Book[] = allBooksData?.data ?? [];

  return (
    <div className="flex flex-col gap-fluid">
      {/* Stats row */}
      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title={t("stats.totalBooks")}
            value={totalBooks.toLocaleString()}
            icon={BookOpen}
            description="In your collection"
            gradient="purple"
          />
          <StatsCard
            title={t("stats.activeMembers")}
            value={activeMembers.toLocaleString()}
            icon={Users}
            description="Registered members"
            gradient="blue"
          />
          <StatsCard
            title="Open Transactions"
            value={openTransactions.toLocaleString()}
            icon={ArrowLeftRight}
            description="Books currently issued"
            gradient="pink"
          />
          <StatsCard
            title={t("stats.pendingFines")}
            value={pendingFines.toLocaleString()}
            icon={AlertCircle}
            description="Fines awaiting payment"
            gradient="success"
          />
        </div>
      </section>

      {/* Main content grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTransactions transactions={recentTransactions} />
        </div>
        <div>
          <LowStockAlert books={allBooks} />
        </div>
      </section>
    </div>
  );
}
