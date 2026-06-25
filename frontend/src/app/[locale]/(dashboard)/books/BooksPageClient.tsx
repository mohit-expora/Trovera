"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LayoutGrid, List, Plus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@trovera/ui";
import { Badge } from "@trovera/ui";
import { DataTable } from "@/components/common/DataTable/DataTable";
import { TablePagination } from "@/components/common/DataTable/TablePagination";
import { TableSortHeader } from "@/components/common/DataTable/TableSortHeader";
import { PermissionGate } from "@/components/common/PermissionGate";
import { BookCard } from "@/components/books/BookCard";
import { BookFilters } from "@/components/books/BookFilters";
import { BookStatusBadge } from "@/components/books/BookStatusBadge";
import { useBooks } from "@/hooks/useBooks";
import { cn } from "@/lib/utils";
import type { Book, BookCategory, BookFilter } from "@/types/book";
import type { PaginatedResponse } from "@/types/api";

type ViewMode = "grid" | "table";

interface BooksPageClientProps {
  initialBooks: PaginatedResponse<Book> | null;
  initialCategories: BookCategory[];
}

export function BooksPageClient({
  initialBooks,
  initialCategories,
}: BooksPageClientProps) {
  const t = useTranslations("books");
  const router = useRouter();
  const locale = useLocale();

  const [filters, setFilters] = useState<BookFilter>({});
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<{ field: string; order: "asc" | "desc" } | null>(
    null
  );

  const { books, meta, isLoading, error } = useBooks(
    {
      ...filters,
      ...(sort ? { sort_by: sort.field, sort_order: sort.order } : {}),
      page,
      page_size: 20,
    },
    initialBooks ?? undefined
  );

  const handleFilterChange = (newFilters: BookFilter) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSort = (field: string, order: "asc" | "desc") => {
    setSort({ field, order });
    setPage(1);
  };

  // Table columns
  const columns: ColumnDef<Book>[] = [
    {
      id: "title",
      header: () => (
        <TableSortHeader
          label="Title"
          field="title"
          currentSort={sort}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => (
        <button
          className="text-left font-medium hover:text-primary transition-colors"
          onClick={() => router.push(`/${locale}/books/${row.original.id}`)}
        >
          {row.original.title}
        </button>
      ),
    },
    {
      accessorKey: "author",
      header: () => (
        <TableSortHeader
          label="Author"
          field="author"
          currentSort={sort}
          onSort={handleSort}
        />
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) =>
        row.original.category ? (
          <Badge variant="secondary">{row.original.category.name}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <span className="uppercase text-xs font-medium">{row.original.language}</span>
      ),
    },
    {
      id: "availability",
      header: "Availability",
      cell: ({ row }) => <BookStatusBadge book={row.original} />,
    },
    {
      id: "quantity",
      header: () => (
        <TableSortHeader
          label="Total"
          field="total_quantity"
          currentSort={sort}
          onSort={handleSort}
        />
      ),
      cell: ({ row }) => row.original.total_quantity,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <BookFilters
          filters={filters}
          categories={initialCategories}
          onChange={handleFilterChange}
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle */}
          <div className="flex rounded-md border overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-none h-9 w-9",
                viewMode === "grid" && "bg-muted"
              )}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-none h-9 w-9",
                viewMode === "table" && "bg-muted"
              )}
              onClick={() => setViewMode("table")}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add book CTA */}
          <PermissionGate permission="books:create:cta">
            <Button onClick={() => router.push(`/${locale}/books/new`)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("addBook")}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl border bg-muted aspect-[3/5]"
                />
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-destructive py-12">{error}</p>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg font-medium">{t("noBooks")}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("noBooksDescription")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </>
      ) : (
        <DataTable
          columns={columns}
          data={books}
          isLoading={isLoading}
          error={error}
          emptyMessage={t("noBooks")}
        />
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
    </div>
  );
}
