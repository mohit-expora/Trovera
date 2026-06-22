"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/common/PermissionGate";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { IssueBookModal } from "@/components/transactions/IssueBookModal";
import { ReturnBookModal } from "@/components/transactions/ReturnBookModal";
import { TablePagination } from "@/components/common/DataTable/TablePagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions, useTransactionMutations } from "@/hooks/useTransactions";
import type { Transaction, TransactionStatus } from "@/types/transaction";
import type { PaginatedResponse } from "@/types/api";
import { BookOpen } from "lucide-react";

interface TransactionsPageClientProps {
  initialData: PaginatedResponse<Transaction> | null;
}

export function TransactionsPageClient({ initialData }: TransactionsPageClientProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [returnTransaction, setReturnTransaction] = useState<Transaction | null>(null);

  const { transactions, meta, isLoading, mutate } = useTransactions(
    {
      page,
      page_size: 20,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    page === 1 && statusFilter === "all" ? initialData ?? undefined : undefined
  );

  const { markLost } = useTransactionMutations();

  const filteredTransactions = memberSearch.trim()
    ? transactions.filter(
        (tx) =>
          tx.member?.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
          tx.member?.email?.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : transactions;

  async function handleMarkLost(id: string) {
    try {
      await markLost(id);
      toast.success("Transaction marked as lost.");
      mutate();
    } catch {
      toast.error("Failed to mark as lost.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by member name..."
            value={memberSearch}
            onChange={(e) => {
              setMemberSearch(e.target.value);
              setPage(1);
            }}
            className="w-56"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as TransactionStatus | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PermissionGate permission="transactions:issue:cta">
          <Button onClick={() => setIssueModalOpen(true)} size="sm" className="gap-1.5">
            <BookOpen className="h-4 w-4" />
            Issue Book
          </Button>
        </PermissionGate>
      </div>

      {/* Table */}
      <TransactionTable
        transactions={filteredTransactions}
        isLoading={isLoading}
        showBook
        showMember
        onReturn={setReturnTransaction}
        onMarkLost={handleMarkLost}
      />

      {/* Pagination */}
      {meta && (
        <TablePagination
          meta={meta}
          onPageChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      )}

      {/* Issue Book Modal */}
      <IssueBookModal
        open={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onSuccess={() => {
          mutate();
          setIssueModalOpen(false);
        }}
      />

      {/* Return Book Modal */}
      {returnTransaction && (
        <ReturnBookModal
          open={!!returnTransaction}
          onClose={() => setReturnTransaction(null)}
          transaction={returnTransaction}
          onSuccess={() => {
            mutate();
            setReturnTransaction(null);
          }}
        />
      )}
    </div>
  );
}
