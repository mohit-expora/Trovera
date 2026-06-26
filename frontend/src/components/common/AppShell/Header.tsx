"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { mutate } from "swr";
import { useTranslations } from "next-intl";
import { Menu, Sun, Moon, Monitor, LogOut, User, ChevronDown, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { LOCALES } from "@/config/theme";
import { Button } from "@trovera/ui";
import { Avatar, AvatarImage, AvatarFallback } from "@trovera/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@trovera/ui";
import { api } from "@/lib/api";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  books: "Books",
  transactions: "Transactions",
  members: "Members",
  fines: "Fines",
  roles: "Roles & Permissions",
  settings: "Settings",
};

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  // Skip locale prefix
  const section = segments[1] ?? segments[0] ?? "";
  return SECTION_LABELS[section] ?? section.charAt(0).toUpperCase() + section.slice(1);
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const icons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const current = (theme as "light" | "dark" | "system") ?? "system";
  const next: Record<string, "light" | "dark" | "system"> = {
    light: "dark",
    dark: "system",
    system: "light",
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next[current])}
      className="h-9 w-9"
      aria-label="Toggle theme"
    >
      {icons[current]}
    </Button>
  );
}

function LocaleSwitcher() {
  const { locale, setLocale } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    setLocale(newLocale as "en" | "hi" | "es" | "fr");
    // Replace the locale segment in the URL
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2.5">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium uppercase">{locale}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(LOCALES).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={cn(code === locale && "bg-accent text-accent-foreground")}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserMenuProps {
  onLogout: () => void;
}

function UserMenu({ onLogout }: UserMenuProps) {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    librarian: "Librarian",
    member: "Member",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 rounded-lg">
          <Avatar className="h-7 w-7">
            {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
            <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-[120px] truncate">
            {user.full_name}
          </span>
          <ChevronDown className="hidden sm:block h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">{user.full_name}</span>
          <span className="text-xs font-normal text-muted-foreground truncate">{user.email}</span>
          <span className="text-xs font-normal text-muted-foreground capitalize">
            {roleLabels[user.role] ?? user.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="#profile" className="cursor-pointer">
            <User className="h-4 w-4" />
            Profile
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleSidebar } = useUIStore();
  const { logout: storeLogout } = useAuthStore();
  const pageTitle = getPageTitle(pathname);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors — always clear the local state
    } finally {
      // Clear all SWR cached data so the next login starts fresh
      await mutate(() => true, undefined, { revalidate: false });
      storeLogout();
      const segments = pathname.split("/").filter(Boolean);
      const locale = segments[0] ?? "en";
      router.push(`/${locale}/login`);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-primary/15 bg-background/70 backdrop-blur-xl px-4 gap-3 shadow-sm shadow-primary/8">
      {/* Hamburger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="h-9 w-9 shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate text-foreground">{pageTitle}</h1>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
        <UserMenu onLogout={handleLogout} />
      </div>
    </header>
  );
}
