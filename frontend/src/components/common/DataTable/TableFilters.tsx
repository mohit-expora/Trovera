import type { ReactNode } from "react";
import { Button } from "@trovera/ui";
import { RotateCcw } from "lucide-react";

interface TableFiltersProps {
  onReset: () => void;
  children: ReactNode;
}

export function TableFilters({ onReset, children }: TableFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3 py-3">
      {children}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="shrink-0 gap-1.5"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Reset
      </Button>
    </div>
  );
}
