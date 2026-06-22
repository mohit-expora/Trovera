import type { ReactNode } from "react";
import { AppShell } from "@/components/common/AppShell/AppShell";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
