"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@trovera/ui";
import { Input } from "@trovera/ui";
import { Label } from "@trovera/ui";
import { Card, CardContent } from "@trovera/ui";
import { api } from "@/lib/api";

type VerifyState = "idle" | "verifying" | "verified" | "error";
type ResendState = "idle" | "sending" | "sent";

export function VerifyEmailNotice() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [verifyState, setVerifyState] = useState<VerifyState>(token ? "verifying" : "idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [resendState, setResendState] = useState<ResendState>("idle");

  // Auto-verify on mount when token is present
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const verify = async () => {
      try {
        await api.post("/auth/verify-email", { token });
        if (!cancelled) setVerifyState("verified");
      } catch (err: unknown) {
        if (cancelled) return;
        const error = err as { response?: { data?: { error?: { message?: string } } } };
        const message =
          error?.response?.data?.error?.message ??
          "Verification failed. The link may have expired.";
        setVerifyError(message);
        setVerifyState("error");
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    setResendState("sending");
    try {
      await api.post("/auth/resend-verification", { email });
      setResendState("sent");
      toast.success("Verification email sent! Check your inbox.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const message =
        error?.response?.data?.error?.message ?? "Failed to resend. Please try again.";
      toast.error(message);
      setResendState("idle");
    }
  };

  // ── Token verification states ──────────────────────────────────────────────
  if (token && verifyState === "verifying") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Verifying your email…</p>
              <p className="text-sm text-muted-foreground">Please wait a moment.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (token && verifyState === "verified") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Email verified!</p>
              <p className="text-sm text-muted-foreground">
                Your account is active. You can now sign in.
              </p>
            </div>
            <a
              href="/en/login"
              className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Go to login
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (token && verifyState === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <XCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Verification failed</p>
              <p className="text-sm text-muted-foreground">
                {verifyError ?? "The link may have expired or already been used."}
              </p>
            </div>

            {/* Resend section */}
            <ResendSection
              email={email}
              onEmailChange={setEmail}
              resendState={resendState}
              onResend={handleResend}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Default: post-registration notice ─────────────────────────────────────
  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Verify your email</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a verification link to your inbox. Click the link to activate your
              account.
            </p>
          </div>

          <ResendSection
            email={email}
            onEmailChange={setEmail}
            resendState={resendState}
            onResend={handleResend}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Resend sub-component ───────────────────────────────────────────────────
interface ResendSectionProps {
  email: string;
  onEmailChange: (v: string) => void;
  resendState: ResendState;
  onResend: () => void;
}

function ResendSection({ email, onEmailChange, resendState, onResend }: ResendSectionProps) {
  if (resendState === "sent") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        Verification email sent — check your inbox.
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <p className="text-xs text-muted-foreground">Didn&apos;t receive an email?</p>
      <div className="space-y-2 text-left">
        <Label htmlFor="resend-email">Your email address</Label>
        <Input
          id="resend-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={resendState === "sending"}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onResend}
        disabled={resendState === "sending"}
      >
        {resendState === "sending" ? (
          <>
            <Loader2 className="animate-spin" />
            Sending…
          </>
        ) : (
          "Resend verification email"
        )}
      </Button>
    </div>
  );
}
