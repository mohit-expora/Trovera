"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@trovera/ui";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  isUploading?: boolean;
  className?: string;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  isUploading = false,
  className,
  label = "Cover Image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const displaySrc = preview ?? value ?? null;

  const handleFile = useCallback(
    (file: File | null) => {
      setSizeError(null);

      if (!file) {
        setPreview(null);
        onChange(null);
        return;
      }

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setSizeError("Only JPG, PNG, and WebP images are accepted.");
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setSizeError("Image must be smaller than 5 MB.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onChange(file);
    },
    [onChange]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
    // Reset input so selecting the same file triggers onChange again
    e.target.value = "";
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSizeError(null);
    onChange(null);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {displaySrc ? (
        <div className="relative w-full max-w-xs rounded-md overflow-hidden border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt={label}
            className="h-48 w-full object-cover"
          />
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7"
              onClick={handleClear}
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload image"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-40 w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input bg-muted/30 transition-colors",
            isDragging && "border-primary bg-primary/5",
            "hover:border-primary/60 hover:bg-muted/50"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="rounded-full bg-muted p-2">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Upload className="h-3.5 w-3.5" />
                  Drag &amp; drop or click to upload
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  JPG, PNG, WebP — max 5 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleInputChange}
      />

      {sizeError && (
        <p className="text-xs text-destructive" role="alert">
          {sizeError}
        </p>
      )}
    </div>
  );
}
