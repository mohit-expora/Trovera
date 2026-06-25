"use client";

import { type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useAuth();

  // No persisted session — wait for /auth/me to resolve before rendering
  if (isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Auth checked and failed — useAuth is handling the redirect to login
  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return <>{children}</>;
}
