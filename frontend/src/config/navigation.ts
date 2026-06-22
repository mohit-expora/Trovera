import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Users,
  AlertCircle,
  ShieldCheck,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "navigation.dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/books",
    labelKey: "navigation.books",
    icon: BookOpen,
    permission: "page:books:view",
  },
  {
    href: "/transactions",
    labelKey: "navigation.transactions",
    icon: ArrowLeftRight,
    permission: "page:transactions:view",
  },
  {
    href: "/members",
    labelKey: "navigation.members",
    icon: Users,
    permission: "page:members:view",
  },
  {
    href: "/fines",
    labelKey: "navigation.fines",
    icon: AlertCircle,
    permission: "page:fines:view",
  },
  {
    href: "/roles",
    labelKey: "navigation.roles",
    icon: ShieldCheck,
    permission: "page:roles:view",
  },
  {
    href: "/settings",
    labelKey: "navigation.settings",
    icon: Settings,
  },
];
