import { Badge } from "@/components/ui/badge";
import type { Book } from "@/types/book";

interface BookStatusBadgeProps {
  book: Pick<Book, "available_quantity">;
}

export function BookStatusBadge({ book }: BookStatusBadgeProps) {
  const { available_quantity } = book;

  if (available_quantity === 0) {
    return (
      <Badge variant="destructive">Out of Stock</Badge>
    );
  }

  if (available_quantity <= 2) {
    return (
      <Badge variant="warning">Low Stock ({available_quantity})</Badge>
    );
  }

  return (
    <Badge variant="success">Available ({available_quantity})</Badge>
  );
}
