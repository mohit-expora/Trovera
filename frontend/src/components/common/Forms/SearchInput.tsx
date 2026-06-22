"use client";

import { useRef, useEffect, type ChangeEvent } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(newValue), debounceMs);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
