import { Suspense } from "react";
import { VerifyEmailNotice } from "@/components/auth/VerifyEmailNotice";

// VerifyEmailNotice uses useSearchParams, so it must be wrapped in Suspense
// when rendered from a Server Component page.

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Email Verification</h1>
          <p className="text-muted-foreground text-sm">Trovera account activation</p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          }
        >
          <VerifyEmailNotice />
        </Suspense>
      </div>
    </div>
  );
}
