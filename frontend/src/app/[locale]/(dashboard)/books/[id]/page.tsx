import { serverFetch } from "@/lib/auth-actions";
import type { ApiSuccess } from "@/types/api";
import type { Book, BookCategory } from "@/types/book";
import { BookDetailClient } from "./BookDetailClient";

interface BookPageProps {
  params: { id: string; locale: string };
}

export default async function BookPage({ params }: BookPageProps) {
  const [bookResult, categoriesResult] = await Promise.all([
    serverFetch<ApiSuccess<Book>>(`/books/${params.id}`),
    serverFetch<ApiSuccess<BookCategory[]>>("/books/categories"),
  ]);

  const book = bookResult?.data ?? null;

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-xl font-semibold">Book not found</h2>
        <p className="text-muted-foreground mt-1">
          The book you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <BookDetailClient
      initialBook={book}
      categories={categoriesResult?.data ?? []}
    />
  );
}
