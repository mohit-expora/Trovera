"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";
import { useAuthStore } from "@/store/authStore";

// Short display labels for mobile (max ~8 chars)
const SHORT_LABELS: Record<string, string> = {
  dashboard: "Home",
  books: "Books",
  transactions: "Txns",
  members: "Members",
  fines: "Fines",
  roles: "Roles",
  settings: "Settings",
};

function getShortLabel(labelKey: string): string {
  const key = labelKey.split(".").pop() ?? labelKey;
  return SHORT_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  function hasPermission(permission?: string): boolean {
    if (!permission) return true;
    if (!user) return false;
    return user.permissions.includes(permission);
  }

  function isActive(href: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    const pathWithoutLocale = "/" + segments.slice(1).join("/");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/");
  }

  // Take first 5 permitted nav items
  const visibleItems = navItems.filter((item) => hasPermission(item.permission)).slice(0, 5);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden h-16 items-stretch border-t bg-background/95 backdrop-blur-md">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const segments = pathname.split("/").filter(Boolean);
        const locale = segments[0] ?? "en";
        const href = `/${locale}${item.href}`;

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                active ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="leading-none">{getShortLabel(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
