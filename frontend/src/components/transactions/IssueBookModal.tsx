"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useTransactionMutations } from "@/hooks/useTransactions";
import type { Transaction } from "@/types/transaction";
import type { Book } from "@/types/book";
import type { User } from "@/types/user";
import type { PaginatedResponse } from "@/types/api";
import { cn } from "@/lib/utils";

interface IssueBookModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (transaction: Transaction) => void;
  preselectedBookId?: string;
  preselectedMemberId?: string;
}

interface FieldError {
  book_id?: string;
  member_id?: string;
  due_date?: string;
}

export function IssueBookModal({
  open,
  onClose,
  onSuccess,
  preselectedBookId,
  preselectedMemberId,
}: IssueBookModalProps) {
  const { issueBook } = useTransactionMutations();

  // Book search state
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Member search state
  const [memberQuery, setMemberQuery] = useState("");
  const [memberResults, setMemberResults] = useState<User[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // Due date & notes
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notes, setNotes] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  const bookDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memberDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchBooks = useCallback((q: string) => {
    if (bookDebounceRef.current) clearTimeout(bookDebounceRef.current);
    if (!q.trim()) { setBookResults([]); return; }
    bookDebounceRef.current = setTimeout(async () => {
      setBookLoading(true);
      try {
        const res = await api.get<PaginatedResponse<Book>>("/books", { search: q, page_size: 8 });
        setBookResults(res.data ?? []);
      } catch {
        setBookResults([]);
      } finally {
        setBookLoading(false);
      }
    }, 300);
  }, []);

  const searchMembers = useCallback((q: string) => {
    if (memberDebounceRef.current) clearTimeout(memberDebounceRef.current);
    if (!q.trim()) { setMemberResults([]); return; }
    memberDebounceRef.current = setTimeout(async () => {
      setMemberLoading(true);
      try {
        const res = await api.get<PaginatedResponse<User>>("/users", { search: q, role: "member", page_size: 8 });
        setMemberResults(res.data ?? []);
      } catch {
        setMemberResults([]);
      } finally {
        setMemberLoading(false);
      }
    }, 300);
  }, []);

  function validate(): boolean {
    const errs: FieldError = {};
    if (!selectedBook && !preselectedBookId) errs.book_id = "Please select a book.";
    if (!selectedMember && !preselectedMemberId) errs.member_id = "Please select a member.";
    if (!dueDate) errs.due_date = "Please select a due date.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const tx = await issueBook({
        book_id: selectedBook?.id ?? preselectedBookId!,
        member_id: selectedMember?.id ?? preselectedMemberId!,
        due_date: dueDate!.toISOString().slice(0, 10),
        notes: notes.trim() || undefined,
      });
      toast.success("Book issued successfully.");
      onSuccess(tx);
      handleClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? "Failed to issue book.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setBookQuery("");
    setBookResults([]);
    setSelectedBook(null);
    setMemberQuery("");
    setMemberResults([]);
    setSelectedMember(null);
    setDueDate(undefined);
    setShowCalendar(false);
    setNotes("");
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Issue Book</DialogTitle>
          <DialogDescription>Search for a book and member, then set a due date.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Book Search */}
          {!preselectedBookId && (
            <div className="space-y-1.5">
              <Label htmlFor="book-search">Book</Label>
              {selectedBook ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/50">
                  <span className="font-medium">{selectedBook.title}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground ml-2"
                    onClick={() => { setSelectedBook(null); setBookQuery(""); }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="book-search"
                    placeholder="Search by title, author, ISBN..."
                    value={bookQuery}
                    onChange={(e) => {
                      setBookQuery(e.target.value);
                      searchBooks(e.target.value);
                    }}
                    className={cn(errors.book_id && "border-destructive")}
                  />
                  {bookLoading && (
                    <div className="absolute top-full left-0 z-10 w-full mt-1 rounded-md border bg-background shadow-md p-2 space-y-1">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  )}
                  {!bookLoading && bookResults.length > 0 && (
                    <ul className="absolute top-full left-0 z-10 w-full mt-1 rounded-md border bg-background shadow-md py-1 max-h-48 overflow-y-auto">
                      {bookResults.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                            onClick={() => {
                              setSelectedBook(b);
                              setBookResults([]);
                              setBookQuery("");
                              setErrors((e) => ({ ...e, book_id: undefined }));
                            }}
                          >
                            <span className="font-medium">{b.title}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{b.author}</span>
                            <span className={cn("ml-2 text-xs", b.available_quantity > 0 ? "text-green-600" : "text-destructive")}>
                              ({b.available_quantity} available)
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {errors.book_id && <p className="text-xs text-destructive">{errors.book_id}</p>}
            </div>
          )}

          {/* Member Search */}
          {!preselectedMemberId && (
            <div className="space-y-1.5">
              <Label htmlFor="member-search">Member</Label>
              {selectedMember ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm bg-muted/50">
                  <span className="font-medium">{selectedMember.full_name}</span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground ml-2"
                    onClick={() => { setSelectedMember(null); setMemberQuery(""); }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id="member-search"
                    placeholder="Search member by name or email..."
                    value={memberQuery}
                    onChange={(e) => {
                      setMemberQuery(e.target.value);
                      searchMembers(e.target.value);
                    }}
                    className={cn(errors.member_id && "border-destructive")}
                  />
                  {memberLoading && (
                    <div className="absolute top-full left-0 z-10 w-full mt-1 rounded-md border bg-background shadow-md p-2 space-y-1">
                      {[1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  )}
                  {!memberLoading && memberResults.length > 0 && (
                    <ul className="absolute top-full left-0 z-10 w-full mt-1 rounded-md border bg-background shadow-md py-1 max-h-48 overflow-y-auto">
                      {memberResults.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                            onClick={() => {
                              setSelectedMember(m);
                              setMemberResults([]);
                              setMemberQuery("");
                              setErrors((e) => ({ ...e, member_id: undefined }));
                            }}
                          >
                            <span className="font-medium">{m.full_name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{m.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {errors.member_id && <p className="text-xs text-destructive">{errors.member_id}</p>}
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <button
              type="button"
              onClick={() => setShowCalendar((v) => !v)}
              className={cn(
                "flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-left",
                !dueDate && "text-muted-foreground",
                errors.due_date && "border-destructive"
              )}
            >
              {dueDate ? dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Pick a due date"}
            </button>
            {showCalendar && (
              <div className="rounded-md border bg-background shadow-md p-2 w-fit">
                <DayPicker
                  mode="single"
                  selected={dueDate}
                  onSelect={(d) => {
                    setDueDate(d);
                    setShowCalendar(false);
                    setErrors((e) => ({ ...e, due_date: undefined }));
                  }}
                  disabled={{ before: new Date() }}
                />
              </div>
            )}
            {errors.due_date && <p className="text-xs text-destructive">{errors.due_date}</p>}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Issuing..." : "Issue Book"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
