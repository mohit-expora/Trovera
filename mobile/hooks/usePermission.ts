import { useAuthStore } from "@/store/authStore";

export function usePermission(permission: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export function useRole() {
  return useAuthStore((s) => s.user?.role ?? null);
}
