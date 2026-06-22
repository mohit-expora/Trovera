"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFieldWrapper } from "@/components/common/Forms/FormField";
import { ImageUpload } from "@/components/common/Forms/ImageUpload";
import { PermissionGate } from "@/components/common/PermissionGate";
import { useBookMutations } from "@/hooks/useBooks";
import type { Book, BookCategory } from "@/types/book";

// ── Zod schema ─────────────────────────────────────────────────────────────────
const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().optional(),
  publisher: z.string().optional(),
  published_year: z
    .union([z.number().int().min(1000).max(2100), z.nan()])
    .optional()
    .transform((v) => (v === undefined || Number.isNaN(v) ? undefined : v)),
  category_id: z.string().optional(),
  language: z.string().optional(),
  description: z.string().optional(),
  shelf_location: z.string().optional(),
  tags: z.string().optional(), // comma-separated; split on submit
  total_quantity: z
    .number({ invalid_type_error: "Quantity must be a number" })
    .int()
    .min(1, "Quantity must be at least 1"),
});

type BookFormValues = z.infer<typeof bookSchema>;

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

interface BookFormProps {
  initialData?: Book;
  categories: BookCategory[];
  onSuccess: (book: Book) => void;
}

export function BookForm({ initialData, categories, onSuccess }: BookFormProps) {
  const isEdit = Boolean(initialData);
  const { createBook, updateBook, uploadCoverImage } = useBookMutations();

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      author: initialData?.author ?? "",
      isbn: initialData?.isbn ?? "",
      publisher: initialData?.publisher ?? "",
      published_year: initialData?.published_year ?? undefined,
      category_id: initialData?.category_id ?? "",
      language: initialData?.language ?? "",
      description: initialData?.description ?? "",
      shelf_location: initialData?.shelf_location ?? "",
      tags: initialData?.tags?.join(", ") ?? "",
      total_quantity: initialData?.total_quantity ?? 1,
    },
  });

  const selectedCategory = watch("category_id");
  const selectedLanguage = watch("language");

  const onSubmit = async (values: BookFormValues) => {
    try {
      const payload: Partial<Book> = {
        title: values.title,
        author: values.author,
        isbn: values.isbn || undefined,
        publisher: values.publisher || undefined,
        published_year: values.published_year ?? undefined,
        category_id: values.category_id || undefined,
        language: values.language || "en",
        description: values.description || undefined,
        shelf_location: values.shelf_location || undefined,
        tags: values.tags
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        total_quantity: values.total_quantity,
      };

      let book: Book;
      if (isEdit && initialData) {
        book = await updateBook(initialData.id, payload);
      } else {
        book = await createBook(payload);
      }

      // Upload cover image if a new file was selected
      if (coverFile) {
        setIsUploading(true);
        try {
          const { cover_image_url } = await uploadCoverImage(book.id, coverFile);
          book = { ...book, cover_image_url };
        } finally {
          setIsUploading(false);
        }
      }

      toast.success(isEdit ? "Book updated successfully" : "Book created successfully");
      onSuccess(book);
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Cover image */}
      <FormFieldWrapper label="Cover Image" htmlFor="cover_image">
        <ImageUpload
          value={initialData?.cover_image_url}
          onChange={setCoverFile}
          isUploading={isUploading}
        />
      </FormFieldWrapper>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Title */}
        <FormFieldWrapper
          label="Title"
          required
          error={errors.title?.message}
          htmlFor="title"
        >
          <Input id="title" {...register("title")} placeholder="Book title" />
        </FormFieldWrapper>

        {/* Author */}
        <FormFieldWrapper
          label="Author"
          required
          error={errors.author?.message}
          htmlFor="author"
        >
          <Input id="author" {...register("author")} placeholder="Author name" />
        </FormFieldWrapper>

        {/* ISBN */}
        <FormFieldWrapper label="ISBN" error={errors.isbn?.message} htmlFor="isbn">
          <Input id="isbn" {...register("isbn")} placeholder="978-..." />
        </FormFieldWrapper>

        {/* Publisher */}
        <FormFieldWrapper
          label="Publisher"
          error={errors.publisher?.message}
          htmlFor="publisher"
        >
          <Input id="publisher" {...register("publisher")} placeholder="Publisher name" />
        </FormFieldWrapper>

        {/* Published Year */}
        <FormFieldWrapper
          label="Published Year"
          error={errors.published_year?.message}
          htmlFor="published_year"
        >
          <Input
            id="published_year"
            type="number"
            {...register("published_year", { valueAsNumber: true })}
            placeholder="2024"
          />
        </FormFieldWrapper>

        {/* Category */}
        <FormFieldWrapper
          label="Category"
          error={errors.category_id?.message}
          htmlFor="category_id"
        >
          <Select
            value={selectedCategory ?? ""}
            onValueChange={(v) => setValue("category_id", v === "none" ? "" : v)}
          >
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldWrapper>

        {/* Language */}
        <FormFieldWrapper
          label="Language"
          error={errors.language?.message}
          htmlFor="language"
        >
          <Select
            value={selectedLanguage ?? ""}
            onValueChange={(v) => setValue("language", v)}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormFieldWrapper>

        {/* Total Quantity */}
        <FormFieldWrapper
          label="Total Quantity"
          required
          error={errors.total_quantity?.message}
          htmlFor="total_quantity"
        >
          <Input
            id="total_quantity"
            type="number"
            min={1}
            {...register("total_quantity", { valueAsNumber: true })}
            placeholder="1"
          />
        </FormFieldWrapper>
      </div>

      {/* Shelf Location — gated permission */}
      <PermissionGate permission="books:shelf_location:field">
        <FormFieldWrapper
          label="Shelf Location"
          error={errors.shelf_location?.message}
          htmlFor="shelf_location"
        >
          <Input
            id="shelf_location"
            {...register("shelf_location")}
            placeholder="e.g. A-12"
          />
        </FormFieldWrapper>
      </PermissionGate>

      {/* Tags */}
      <FormFieldWrapper
        label="Tags"
        description="Comma-separated list of tags"
        error={errors.tags?.message}
        htmlFor="tags"
      >
        <Input
          id="tags"
          {...register("tags")}
          placeholder="fiction, classic, recommended"
        />
      </FormFieldWrapper>

      {/* Description */}
      <FormFieldWrapper
        label="Description"
        error={errors.description?.message}
        htmlFor="description"
      >
        <textarea
          id="description"
          {...register("description")}
          rows={4}
          placeholder="Brief description of the book..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
      </FormFieldWrapper>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="min-w-[120px]"
        >
          {(isSubmitting || isUploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEdit ? "Update Book" : "Create Book"}
        </Button>
      </div>
    </form>
  );
}
