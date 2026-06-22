"use client";

import { SearchInput } from "@/components/common/Forms/SearchInput";
import { TableFilters } from "@/components/common/DataTable/TableFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BookCategory, BookFilter } from "@/types/book";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

const DEFAULT_FILTERS: BookFilter = {
  search: "",
  category_id: "",
  language: "",
  available_only: false,
};

interface BookFiltersProps {
  filters: BookFilter;
  categories: BookCategory[];
  onChange: (filters: BookFilter) => void;
  className?: string;
}

export function BookFilters({
  filters,
  categories,
  onChange,
  className,
}: BookFiltersProps) {
  const update = (partial: Partial<BookFilter>) =>
    onChange({ ...filters, ...partial });

  const handleReset = () => onChange(DEFAULT_FILTERS);

  return (
    <TableFilters onReset={handleReset}>
      {/* Search */}
      <div className={cn("min-w-[200px] flex-1", className)}>
        <SearchInput
          value={filters.search ?? ""}
          onChange={(v) => update({ search: v })}
          placeholder="Search by title, author..."
          debounceMs={300}
        />
      </div>

      {/* Category */}
      <Select
        value={filters.category_id ?? ""}
        onValueChange={(v) => update({ category_id: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Language */}
      <Select
        value={filters.language ?? ""}
        onValueChange={(v) => update({ language: v === "all" ? "" : v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Languages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Languages</SelectItem>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Available only toggle */}
      <label className="flex cursor-pointer items-center gap-2 text-sm select-none">
        <input
          type="checkbox"
          checked={filters.available_only ?? false}
          onChange={(e) => update({ available_only: e.target.checked })}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        Available only
      </label>
    </TableFilters>
  );
}
