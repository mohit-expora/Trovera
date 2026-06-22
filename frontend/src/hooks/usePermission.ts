"use client";

import { useAuthStore } from "@/store/authStore";

export function usePermission(permission: string): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function usePermissions(permissions: string[]): Record<string, boolean> {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return Object.fromEntries(permissions.map((p) => [p, false]));
  }
  return Object.fromEntries(permissions.map((p) => [p, user.permissions.includes(p)]));
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}
