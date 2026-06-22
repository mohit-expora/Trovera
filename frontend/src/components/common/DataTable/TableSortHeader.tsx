import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TableSortHeaderProps {
  label: string;
  field: string;
  currentSort: { field: string; order: "asc" | "desc" } | null;
  onSort: (field: string, order: "asc" | "desc") => void;
}

export function TableSortHeader({
  label,
  field,
  currentSort,
  onSort,
}: TableSortHeaderProps) {
  const isActive = currentSort?.field === field;
  const currentOrder = isActive ? currentSort!.order : null;

  const handleClick = () => {
    if (!isActive || currentOrder === "desc") {
      onSort(field, "asc");
    } else {
      onSort(field, "desc");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground transition-colors",
        isActive && "text-foreground"
      )}
    >
      {label}
      <span className="ml-1">
        {isActive ? (
          currentOrder === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        )}
      </span>
    </button>
  );
}
