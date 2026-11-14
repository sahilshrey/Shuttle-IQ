import type { LucideIcon } from "lucide-react";
import { ChartBar as BarChart3, Factory as History, LayoutDashboard, Radio, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/live-court", label: "Live Court", icon: Radio },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/match-history", label: "Match History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];
