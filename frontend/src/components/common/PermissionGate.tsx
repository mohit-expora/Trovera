"use client";

import { type ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";

interface PermissionGateProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const hasPermission = usePermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}
