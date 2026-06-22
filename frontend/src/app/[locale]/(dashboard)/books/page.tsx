import { getTranslations } from "next-intl/server";
import { serverFetch } from "@/lib/auth-actions";
import type { PaginatedResponse } from "@/types/api";
import type { Book, BookCategory, BookFilter } from "@/types/book";
import { BooksPageClient } from "./BooksPageClient";

export default async function BooksPage() {
  const t = await getTranslations("books");

  const [booksData, categoriesData] = await Promise.all([
    serverFetch<PaginatedResponse<Book>>("/books?page=1&page_size=20"),
    serverFetch<{ success: boolean; data: BookCategory[] }>("/books/categories"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <BooksPageClient
        initialBooks={booksData}
        initialCategories={categoriesData?.data ?? []}
      />
    </div>
  );
}
