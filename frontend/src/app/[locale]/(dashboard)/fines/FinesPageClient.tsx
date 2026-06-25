"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PermissionGate } from "@/components/common/PermissionGate";
import { FinesBadge } from "@/components/transactions/FinesBadge";
import { TablePagination } from "@/components/common/DataTable/TablePagination";
import { Button } from "@trovera/ui";
import { Input } from "@trovera/ui";
import { Label } from "@trovera/ui";
import { Skeleton } from "@trovera/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@trovera/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@trovera/ui";
import { useFines, useFineMutations } from "@/hooks/useTransactions";
import { formatDate } from "@/lib/utils";
import type { Fine, FineStatus } from "@/types/transaction";
import type { PaginatedResponse } from "@/types/api";

interface FinesPageClientProps {
  initialData: PaginatedResponse<Fine> | null;
}

// ── Waive Dialog ───────────────────────────────────────────────────────────

function WaiveDialog({
  fineId,
  open,
  onClose,
  onSuccess,
}: {
  fineId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { waiveFine } = useFineMutations();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await waiveFine(fineId, reason.trim());
      toast.success("Fine waived successfully.");
      onSuccess();
      setReason("");
      onClose();
    } catch {
      toast.error("Failed to waive fine.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Waive Fine</DialogTitle>
          <DialogDescription>Provide a reason for waiving this fine.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="waive-reason">Reason</Label>
            <textarea
              id="waive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Special circumstances, first-time offender..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason("");
              onClose();
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !reason.trim()}>
            {submitting ? "Waiving..." : "Waive Fine"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Client ────────────────────────────────────────────────────────────

export function FinesPageClient({ initialData }: FinesPageClientProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<FineStatus | "all">("all");
  const [memberSearch, setMemberSearch] = useState("");
  const [waiveFineId, setWaiveFineId] = useState<string | null>(null);

  const { fines, meta, isLoading, mutate } = useFines(
    {
      page,
      page_size: 20,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    page === 1 && statusFilter === "all" ? initialData ?? undefined : undefined
  );

  const { payFine } = useFineMutations();

  const filteredFines: Fine[] = memberSearch.trim()
    ? fines.filter(
        (f) =>
          f.member?.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
          f.member?.email?.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : fines;

  async function handlePayFine(id: string) {
    try {
      await payFine(id);
      toast.success("Fine marked as paid.");
      mutate();
    } catch {
      toast.error("Failed to mark fine as paid.");
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
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
            setStatusFilter(v as FineStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : filteredFines.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
          No fines found.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Days Overdue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Paid / Waived</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFines.map((fine) => (
                <tr key={fine.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {fine.member?.full_name ?? (
                      <span className="text-muted-foreground italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {fine.transaction_id.slice(0, 8)}…
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">₹{fine.amount.toFixed(2)}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      (₹{fine.per_day_rate}/day)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fine.days_overdue} day{fine.days_overdue !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <FinesBadge amount={fine.amount} status={fine.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {fine.paid_at
                      ? formatDate(fine.paid_at)
                      : fine.waived_at
                      ? formatDate(fine.waived_at)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {fine.status === "pending" ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <PermissionGate permission="fines:pay:cta">
                          <Button
                            size="sm"
                            variant="success"
                            className="h-7 px-2 text-xs"
                            onClick={() => handlePayFine(fine.id)}
                          >
                            Mark Paid
                          </Button>
                        </PermissionGate>
                        <PermissionGate permission="fines:waive:cta">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setWaiveFineId(fine.id)}
                          >
                            Waive
                          </Button>
                        </PermissionGate>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      {/* Waive Dialog */}
      {waiveFineId && (
        <WaiveDialog
          fineId={waiveFineId}
          open={!!waiveFineId}
          onClose={() => setWaiveFineId(null)}
          onSuccess={() => {
            mutate();
            setWaiveFineId(null);
          }}
        />
      )}
    </div>
  );
}
