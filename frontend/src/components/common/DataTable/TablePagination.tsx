import { Button } from "@trovera/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginatedMeta } from "@/types/api";

interface TablePaginationProps {
  meta: PaginatedMeta;
  onPageChange: (page: number) => void;
}

export function TablePagination({ meta, onPageChange }: TablePaginationProps) {
  const { page, page_size, total, total_pages, has_prev, has_next } = meta;

  const from = total === 0 ? 0 : (page - 1) * page_size + 1;
  const to = Math.min(page * page_size, total);

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${from}–${to} of ${total} results`}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!has_prev}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>

        <span className="text-sm font-medium px-2">
          Page {page} of {total_pages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!has_next}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  );
}
