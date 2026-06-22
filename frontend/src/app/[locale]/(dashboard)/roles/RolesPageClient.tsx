"use client";

import { useState } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/types/api";
import type { UserRole } from "@/types/user";

// ── Types ──────────────────────────────────────────────────────────────────

interface RolePermission {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
}

interface RoleData {
  role: UserRole;
  permissions: RolePermission[];
}

// ── Canonical permissions list ─────────────────────────────────────────────

const ALL_PERMISSIONS: RolePermission[] = [
  // Page level
  { id: "page:books:view", code: "page:books:view", name: "Books Page", category: "page-level" },
  { id: "page:transactions:view", code: "page:transactions:view", name: "Transactions Page", category: "page-level" },
  { id: "page:members:view", code: "page:members:view", name: "Members Page", category: "page-level" },
  { id: "page:fines:view", code: "page:fines:view", name: "Fines Page", category: "page-level" },
  { id: "page:roles:view", code: "page:roles:view", name: "Roles Page", category: "page-level" },
  { id: "page:settings:view", code: "page:settings:view", name: "Settings Page", category: "page-level" },
  // API level — Books
  { id: "books:create", code: "books:create", name: "Create Books", category: "api-level" },
  { id: "books:read", code: "books:read", name: "Read Books", category: "api-level" },
  { id: "books:update", code: "books:update", name: "Update Books", category: "api-level" },
  { id: "books:delete", code: "books:delete", name: "Delete Books", category: "api-level" },
  // API level — Transactions
  { id: "transactions:issue", code: "transactions:issue", name: "Issue Transactions", category: "api-level" },
  { id: "transactions:return", code: "transactions:return", name: "Return Transactions", category: "api-level" },
  { id: "transactions:list", code: "transactions:list", name: "List Transactions", category: "api-level" },
  { id: "transactions:read", code: "transactions:read", name: "Read Transactions", category: "api-level" },
  // API level — Fines
  { id: "fines:pay", code: "fines:pay", name: "Pay Fines", category: "api-level" },
  { id: "fines:waive", code: "fines:waive", name: "Waive Fines", category: "api-level" },
  // UI level — Books
  { id: "books:create:cta", code: "books:create:cta", name: "Create Book Button", category: "ui-level" },
  { id: "books:edit:cta", code: "books:edit:cta", name: "Edit Book Button", category: "ui-level" },
  { id: "books:delete:cta", code: "books:delete:cta", name: "Delete Book Button", category: "ui-level" },
  { id: "books:shelf_location:field", code: "books:shelf_location:field", name: "Shelf Location Field", category: "ui-level" },
  // UI level — Transactions
  { id: "transactions:issue:cta", code: "transactions:issue:cta", name: "Issue Book Button", category: "ui-level" },
  { id: "transactions:return:cta", code: "transactions:return:cta", name: "Return Book Button", category: "ui-level" },
  // UI level — Fines
  { id: "fines:pay:cta", code: "fines:pay:cta", name: "Pay Fine Button", category: "ui-level" },
  { id: "fines:waive:cta", code: "fines:waive:cta", name: "Waive Fine Button", category: "ui-level" },
  // UI level — Users
  { id: "users:role:field", code: "users:role:field", name: "Role Field", category: "ui-level" },
  { id: "users:phone:field", code: "users:phone:field", name: "Phone Field", category: "ui-level" },
];

const CATEGORY_LABELS: Record<string, string> = {
  "page-level": "Page Access",
  "api-level": "API Permissions",
  "ui-level": "UI Controls",
};

const CATEGORY_ORDER = ["page-level", "api-level", "ui-level"];

// ── Role Panel ─────────────────────────────────────────────────────────────

function RolePanel({
  role,
  roleData,
  isLoading,
  toggling,
  onToggle,
}: {
  role: UserRole;
  roleData: RoleData | null;
  isLoading: boolean;
  toggling: string | null;
  onToggle: (code: string, enabled: boolean) => Promise<void>;
}) {
  const isSuperAdmin = role === "super_admin";
  const assignedCodes = new Set(roleData?.permissions.map((p) => p.code) ?? []);

  const grouped = CATEGORY_ORDER.reduce<Record<string, RolePermission[]>>((acc, cat) => {
    acc[cat] = ALL_PERMISSIONS.filter((p) => p.category === cat);
    return acc;
  }, {});

  const roleLabels: Record<UserRole, string> = {
    super_admin: "Super Admin",
    librarian: "Librarian",
    member: "Member",
  };

  const roleDescriptions: Record<UserRole, string> = {
    super_admin: "Full access to all features. Permissions cannot be modified.",
    librarian: "Manages books, transactions, and fines.",
    member: "Basic library member with read-only access.",
  };

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">{roleLabels[role]}</CardTitle>
          {isSuperAdmin && (
            <Badge variant="secondary" className="text-xs">
              Read-only
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{roleDescriptions[role]}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          CATEGORY_ORDER.map((category, idx) => (
            <div key={category} className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              {grouped[category].map((perm) => {
                const enabled = isSuperAdmin ? true : assignedCodes.has(perm.code);
                const isToggling = toggling === `${role}:${perm.code}`;
                return (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors"
                  >
                    <span className="text-sm">{perm.name}</span>
                    <Switch
                      checked={enabled}
                      disabled={isSuperAdmin || isToggling}
                      onCheckedChange={(checked) => onToggle(perm.code, checked)}
                      aria-label={`Toggle ${perm.name} for ${role}`}
                    />
                  </div>
                );
              })}
              {idx < CATEGORY_ORDER.length - 1 && <Separator className="mt-3" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Client ────────────────────────────────────────────────────────────

const ROLES: UserRole[] = ["super_admin", "librarian", "member"];

export function RolesPageClient() {
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: superAdminData, isLoading: saLoading } = useSWR<ApiSuccess<RoleData>>(
    "/roles/super_admin/permissions"
  );
  const { data: librarianData, isLoading: libLoading } = useSWR<ApiSuccess<RoleData>>(
    "/roles/librarian/permissions"
  );
  const { data: memberData, isLoading: memLoading } = useSWR<ApiSuccess<RoleData>>(
    "/roles/member/permissions"
  );

  const dataMap: Record<UserRole, { data: RoleData | null; isLoading: boolean }> = {
    super_admin: { data: superAdminData?.data ?? null, isLoading: saLoading },
    librarian: { data: librarianData?.data ?? null, isLoading: libLoading },
    member: { data: memberData?.data ?? null, isLoading: memLoading },
  };

  async function handleToggle(role: UserRole, code: string, enabled: boolean) {
    const key = `${role}:${code}`;
    if (toggling) return;
    setToggling(key);
    try {
      if (enabled) {
        await api.post(`/roles/${role}/permissions`, { permission_code: code });
      } else {
        await api.delete(`/roles/${role}/permissions/${encodeURIComponent(code)}`);
      }
      await globalMutate(`/roles/${role}/permissions`);
      toast.success(`Permission ${enabled ? "granted" : "revoked"}.`);
    } catch {
      toast.error("Failed to update permission.");
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {ROLES.map((role) => (
        <RolePanel
          key={role}
          role={role}
          roleData={dataMap[role].data}
          isLoading={dataMap[role].isLoading}
          toggling={toggling}
          onToggle={(code, enabled) => handleToggle(role, code, enabled)}
        />
      ))}
    </div>
  );
}
