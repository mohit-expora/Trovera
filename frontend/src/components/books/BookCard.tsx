"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@trovera/ui";
import { Badge } from "@trovera/ui";
import { BookStatusBadge } from "./BookStatusBadge";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/book";

interface BookCardProps {
  book: Book;
  className?: string;
}

export function BookCard({ book, className }: BookCardProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleClick = () => {
    router.push(`/${locale}/books/${book.id}`);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      aria-label={`View details for ${book.title}`}
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-xl bg-muted">
        {book.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_image_url}
            alt={`Cover of ${book.title}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-16 w-16 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>

        {/* Category + Status badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {book.category && (
            <Badge variant="secondary" className="text-xs">
              {book.category.name}
            </Badge>
          )}
          <BookStatusBadge book={book} />
        </div>
      </CardContent>
    </Card>
  );
}
