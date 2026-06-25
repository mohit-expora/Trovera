"use client";

import { useState } from "react";
import { toast } from "sonner";
import { differenceInDays, isPast } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@trovera/ui";
import { Button } from "@trovera/ui";
import { Label } from "@trovera/ui";
import { Badge } from "@trovera/ui";
import { Separator } from "@trovera/ui";
import { useTransactionMutations } from "@/hooks/useTransactions";
import { formatDate } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";

interface ReturnBookModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction;
  onSuccess: (transaction: Transaction) => void;
}

const FINE_RATE_PER_DAY = 2; // ₹2 per day

export function ReturnBookModal({
  open,
  onClose,
  transaction,
  onSuccess,
}: ReturnBookModalProps) {
  const { returnBook } = useTransactionMutations();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dueDate = new Date(transaction.due_date);
  const isOverdue = isPast(dueDate) && !transaction.returned_at;
  const daysOverdue = isOverdue ? Math.max(0, differenceInDays(new Date(), dueDate)) : 0;
  const estimatedFine = daysOverdue * FINE_RATE_PER_DAY;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const tx = await returnBook(transaction.id, { notes: notes.trim() || undefined });
      toast.success("Book returned successfully.");
      onSuccess(tx);
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? "Failed to return book.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setNotes("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Return Book</DialogTitle>
          <DialogDescription>Confirm the return of this book.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Transaction Summary */}
          <div className="rounded-md border bg-muted/30 px-4 py-3 space-y-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground">Book</span>
              <span className="font-medium text-right">
                {transaction.book?.title ?? "Unknown Book"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Member</span>
              <span>{transaction.member?.full_name ?? "Unknown Member"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Issued On</span>
              <span>{formatDate(transaction.issued_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Due Date</span>
              <span className={isOverdue ? "text-destructive font-medium" : ""}>
                {formatDate(transaction.due_date)}
              </span>
            </div>
          </div>

          {/* Overdue Fine Preview */}
          {isOverdue && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-destructive">Overdue Fine Preview</span>
                <Badge variant="destructive" className="text-xs">
                  {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                ₹{FINE_RATE_PER_DAY}/day × {daysOverdue} days ={" "}
                <span className="font-semibold text-destructive">₹{estimatedFine.toFixed(2)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Actual fine will be calculated by the system upon return.
              </p>
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="return-notes">Notes (optional)</Label>
            <textarea
              id="return-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about the book condition, etc."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Processing..." : "Confirm Return"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
