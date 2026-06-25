import type { ReactNode } from "react";
import { Label } from "@trovera/ui";
import { cn } from "@/lib/utils";

interface FormFieldWrapperProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

export function FormFieldWrapper({
  label,
  error,
  required,
  description,
  children,
  className,
  htmlFor,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(error && "text-destructive")}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>

      {children}

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
