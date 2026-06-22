import * as React from "react";
import { cn, formatDate } from "@/lib/utils";
import type { Transaction, TransactionStatus } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const statusConfig: Record<TransactionStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }> = {
  issued: { label: "Issued", variant: "secondary" },
  returned: { label: "Returned", variant: "success" },
  overdue: { label: "Overdue", variant: "destructive" },
  lost: { label: "Lost", variant: "warning" },
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No recent transactions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Book
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Member
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Issued
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Due
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const { label, variant } = statusConfig[tx.status] ?? {
                    label: tx.status,
                    variant: "outline" as const,
                  };

                  return (
                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-3">
                        <span className="font-medium text-foreground line-clamp-1 max-w-[180px]">
                          {tx.book?.title ?? tx.book_id}
                        </span>
                        {tx.book?.author && (
                          <span className="block text-xs text-muted-foreground">
                            {tx.book.author}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tx.member?.full_name ?? tx.member_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant}>{label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.issued_at)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 whitespace-nowrap",
                          tx.status === "overdue" ? "text-destructive font-medium" : "text-muted-foreground"
                        )}
                      >
                        {formatDate(tx.due_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
