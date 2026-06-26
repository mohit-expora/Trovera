"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/config/navigation";
import { useUIStore } from "@/store/uiStore";
import { PermissionGate } from "@/components/common/PermissionGate";
import { ScrollArea } from "@trovera/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@trovera/ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@trovera/ui";

interface SidebarNavItemProps {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isCollapsed: boolean;
  label: string;
}

function SidebarNavItem({ href, icon: Icon, isActive, isCollapsed, label }: SidebarNavItemProps) {
  const item = (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150",
        isActive
          ? "bg-gradient-to-r from-primary/30 to-secondary/15 text-primary font-semibold shadow-sm"
          : "font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground",
        isCollapsed && "justify-center px-0"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      {!isCollapsed && <span className="truncate">{label}</span>}
      {/* Active indicator dot */}
      {isActive && !isCollapsed && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
      )}
    </Link>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return item;
}

interface SidebarContentProps {
  isCollapsed: boolean;
  onLinkClick?: () => void;
}

function SidebarContent({ isCollapsed, onLinkClick }: SidebarContentProps) {
  const pathname = usePathname();
  const t = useTranslations();

  function getLabel(labelKey: string): string {
    const parts = labelKey.split(".");
    if (parts.length === 2) return t(`${parts[0]}.${parts[1]}`);
    return labelKey;
  }

  function isActive(href: string): boolean {
    const segments = pathname.split("/").filter(Boolean);
    const pathWithoutLocale = "/" + segments.slice(1).join("/");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/");
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-border/60 px-4",
            isCollapsed ? "justify-center px-0" : "gap-3"
          )}
        >
          {/* Gradient icon */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/40 to-secondary/25 shadow-sm">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">Trovera</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Library</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1 py-4">
          <nav
            className={cn(
              "flex flex-col gap-0.5",
              isCollapsed ? "items-center px-2" : "px-3"
            )}
            onClick={onLinkClick}
          >
            {navItems.map((item) => {
              const navItem = (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  labelKey={item.labelKey}
                  icon={item.icon}
                  isActive={isActive(item.href)}
                  isCollapsed={isCollapsed}
                  label={getLabel(item.labelKey)}
                />
              );

              if (item.permission) {
                return (
                  <PermissionGate key={item.href} permission={item.permission}>
                    {navItem}
                  </PermissionGate>
                );
              }

              return navItem;
            })}
          </nav>
        </ScrollArea>

        {/* Bottom accent line */}
        {!isCollapsed && (
          <div className="mx-3 mb-4 h-0.5 rounded-full bg-gradient-to-r from-primary/30 via-secondary/20 to-accent/30" />
        )}
      </div>
    </TooltipProvider>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[260px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <SidebarContent isCollapsed={false} onLinkClick={onClose} />
      </SheetContent>
    </Sheet>
  );
}

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isMobile) {
    return <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />;
  }

  return (
    <aside
      className={cn(
        "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col",
        "border-r border-primary/15",
        "bg-gradient-to-b from-primary/12 via-card/95 to-card backdrop-blur-xl",
        "transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-[260px]" : "w-[72px]"
      )}
    >
      <SidebarContent isCollapsed={!sidebarOpen} />
    </aside>
  );
}
