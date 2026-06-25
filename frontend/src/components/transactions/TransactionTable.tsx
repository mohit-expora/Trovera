"use client";

import { Badge } from "@trovera/ui";
import { Button } from "@trovera/ui";
import { Skeleton } from "@trovera/ui";
import { PermissionGate } from "@/components/common/PermissionGate";
import { formatDate } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types/transaction";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  showMember?: boolean;
  showBook?: boolean;
  onReturn?: (transaction: Transaction) => void;
  onMarkLost?: (id: string) => void;
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const map: Record<TransactionStatus, { label: string; className: string }> = {
    issued: {
      label: "Issued",
      className:
        "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    returned: {
      label: "Returned",
      className:
        "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    },
    overdue: {
      label: "Overdue",
      className:
        "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    },
    lost: {
      label: "Lost",
      className:
        "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    },
  };

  const { label, className } = map[status] ?? map.issued;
  return <Badge className={`text-xs ${className}`}>{label}</Badge>;
}

export function TransactionTable({
  transactions,
  isLoading = false,
  showMember = true,
  showBook = true,
  onReturn,
  onMarkLost,
}: TransactionTableProps) {
  const showActions = !!(onReturn || onMarkLost);

  if (isLoading) {
    return (
      <div className="w-full space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr className="border-b text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {showBook && <th className="px-4 py-3">Book</th>}
            {showMember && <th className="px-4 py-3">Member</th>}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Issued</th>
            <th className="px-4 py-3">Due Date</th>
            <th className="px-4 py-3">Returned</th>
            {showActions && <th className="px-4 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
              {showBook && (
                <td className="px-4 py-3 font-medium">
                  {tx.book?.title ?? (
                    <span className="text-muted-foreground italic">Unknown book</span>
                  )}
                </td>
              )}
              {showMember && (
                <td className="px-4 py-3">
                  {tx.member?.full_name ?? (
                    <span className="text-muted-foreground italic">Unknown member</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                <StatusBadge status={tx.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(tx.issued_at)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(tx.due_date)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {tx.returned_at ? formatDate(tx.returned_at) : "—"}
              </td>
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(tx.status === "issued" || tx.status === "overdue") && onReturn && (
                      <PermissionGate permission="transactions:return:cta">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => onReturn(tx)}
                        >
                          Return
                        </Button>
                      </PermissionGate>
                    )}
                    {(tx.status === "issued" || tx.status === "overdue") && onMarkLost && (
                      <PermissionGate permission="transactions:return:cta">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground"
                          onClick={() => onMarkLost(tx.id)}
                        >
                          Lost
                        </Button>
                      </PermissionGate>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
