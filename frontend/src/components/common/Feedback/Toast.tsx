/**
 * Trovera toast utilities.
 *
 * Usage in root layout (server component):
 *   import { TroveraToaster } from "@/components/common/Feedback/Toast";
 *   // inside JSX:
 *   <TroveraToaster />
 *
 * Usage in client components / hooks:
 *   import { toast } from "@/components/common/Feedback/Toast";
 *   toast.success("Book saved!");
 */

export { Toaster, toast } from "sonner";

// Re-export a pre-configured Toaster variant for the app root.
// This is a thin wrapper so the root layout stays clean.
import { Toaster as SonnerToaster } from "sonner";

export function TroveraToaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast: "font-sans text-sm",
        },
      }}
    />
  );
}
