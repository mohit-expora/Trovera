"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, BookOpen, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { BookForm } from "@/components/books/BookForm";
import { PermissionGate } from "@/components/common/PermissionGate";
import { useBook, useBookMutations } from "@/hooks/useBooks";
import { formatDate } from "@/lib/utils";
import type { Book, BookCategory } from "@/types/book";

interface BookDetailClientProps {
  initialBook: Book;
  categories: BookCategory[];
}

export function BookDetailClient({ initialBook, categories }: BookDetailClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("books");

  const { book } = useBook(initialBook.id, initialBook);
  const displayBook = book ?? initialBook;

  const { deleteBook } = useBookMutations();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteBook(displayBook.id);
      toast.success("Book deleted successfully");
      router.push(`/${locale}/books`);
    } catch {
      toast.error("Failed to delete book. Please try again.");
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleEditSuccess = (updated: Book) => {
    setEditOpen(false);
    toast.success("Book updated successfully");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-1.5"
        onClick={() => router.push(`/${locale}/books`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Books
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cover + meta sidebar */}
        <div className="flex flex-col gap-4">
          {/* Cover image */}
          <div className="aspect-[3/4] w-full overflow-hidden rounded-xl border bg-muted">
            {displayBook.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayBook.cover_image_url}
                alt={`Cover of ${displayBook.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BookOpen className="h-20 w-20 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Quick stats */}
          <Card>
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <BookStatusBadge book={displayBook} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total copies</span>
                <span className="text-sm font-medium">{displayBook.total_quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="text-sm font-medium">{displayBook.available_quantity}</span>
              </div>
              {displayBook.language && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Language</span>
                    <span className="text-sm font-medium uppercase">
                      {displayBook.language}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main details */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-tight">{displayBook.title}</h1>
              <p className="mt-1 text-lg text-muted-foreground">{displayBook.author}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {displayBook.category && (
                  <Badge variant="secondary">{displayBook.category.name}</Badge>
                )}
                {displayBook.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <PermissionGate permission="books:edit:cta">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit2 className="h-4 w-4 mr-1.5" />
                  {t("editBook")}
                </Button>
              </PermissionGate>
              <PermissionGate permission="books:delete:cta">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {t("deleteBook")}
                </Button>
              </PermissionGate>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {displayBook.description && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Description
              </h2>
              <p className="text-sm leading-relaxed">{displayBook.description}</p>
            </div>
          )}

          {/* Publication details */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Publication Details
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {displayBook.isbn && (
                <>
                  <dt className="text-muted-foreground">ISBN</dt>
                  <dd className="font-medium">{displayBook.isbn}</dd>
                </>
              )}
              {displayBook.publisher && (
                <>
                  <dt className="text-muted-foreground">Publisher</dt>
                  <dd className="font-medium">{displayBook.publisher}</dd>
                </>
              )}
              {displayBook.published_year && (
                <>
                  <dt className="text-muted-foreground">Year</dt>
                  <dd className="font-medium">{displayBook.published_year}</dd>
                </>
              )}
              {displayBook.shelf_location && (
                <>
                  <dt className="text-muted-foreground">Shelf Location</dt>
                  <dd className="font-medium">{displayBook.shelf_location}</dd>
                </>
              )}
              <dt className="text-muted-foreground">Added</dt>
              <dd className="font-medium">{formatDate(displayBook.created_at)}</dd>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{formatDate(displayBook.updated_at)}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("editBook")}</DialogTitle>
            <DialogDescription>
              Update the details for &ldquo;{displayBook.title}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <BookForm
            initialData={displayBook}
            categories={categories}
            onSuccess={handleEditSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete.title")}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{displayBook.title}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : t("delete.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
