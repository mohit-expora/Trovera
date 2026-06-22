"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="relative min-h-screen bg-background isolate">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main area — offset by sidebar width on desktop */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          // On lg+ shift content right according to sidebar state
          "lg:pl-[260px]",
          !sidebarOpen && "lg:pl-[72px]",
          // On mobile no left padding
          "pl-0"
        )}
      >
        <Header />

        {/* Page content */}
        <main className="flex-1 p-fluid pb-20 md:pb-fluid">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
