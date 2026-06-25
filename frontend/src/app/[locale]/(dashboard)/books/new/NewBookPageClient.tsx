"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Card, CardContent } from "@trovera/ui";
import { BookForm } from "@/components/books/BookForm";
import { PermissionGate } from "@/components/common/PermissionGate";
import type { Book, BookCategory } from "@/types/book";

interface NewBookPageClientProps {
  categories: BookCategory[];
}

export function NewBookPageClient({ categories }: NewBookPageClientProps) {
  const router = useRouter();
  const locale = useLocale();

  const handleSuccess = (book: Book) => {
    router.push(`/${locale}/books/${book.id}`);
  };

  return (
    <PermissionGate
      permission="books:create"
      fallback={
        <div className="py-12 text-center text-muted-foreground">
          You do not have permission to create books.
        </div>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <BookForm categories={categories} onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </PermissionGate>
  );
}
