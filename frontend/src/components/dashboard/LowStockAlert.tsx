import * as React from "react";
import Image from "next/image";
import { BookOpen, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/book";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LowStockAlertProps {
  books: Book[];
}

export function LowStockAlert({ books }: LowStockAlertProps) {
  const lowStockBooks = books.filter((b) => b.available_quantity <= 2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <CardTitle className="text-base font-semibold">Low Stock Alert</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {lowStockBooks.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            All books are well-stocked
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {lowStockBooks.map((book) => {
              const isOutOfStock = book.available_quantity === 0;

              return (
                <li key={book.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/20 transition-colors">
                  {/* Cover image or placeholder */}
                  <div className="h-12 w-9 shrink-0 overflow-hidden rounded-sm bg-muted flex items-center justify-center">
                    {book.cover_image_url ? (
                      <Image
                        src={book.cover_image_url}
                        alt={book.title}
                        width={36}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Book info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                  </div>

                  {/* Stock badge */}
                  <Badge
                    variant={isOutOfStock ? "destructive" : "warning"}
                    className="shrink-0 tabular-nums"
                  >
                    {isOutOfStock
                      ? "Out of stock"
                      : `${book.available_quantity}/${book.total_quantity}`}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
