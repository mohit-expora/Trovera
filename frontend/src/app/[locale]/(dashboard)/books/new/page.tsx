import { getTranslations } from "next-intl/server";
import { serverFetch } from "@/lib/auth-actions";
import type { BookCategory } from "@/types/book";
import { NewBookPageClient } from "./NewBookPageClient";

export default async function NewBookPage() {
  const t = await getTranslations("books");

  const categoriesData = await serverFetch<{ success: boolean; data: BookCategory[] }>(
    "/books/categories"
  );

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("addBook")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <NewBookPageClient categories={categoriesData?.data ?? []} />
    </div>
  );
}
