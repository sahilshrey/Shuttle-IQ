"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Crosshair } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";

type SidebarProps = {
  isOpen: boolean;
  onNavigate: () => void;
};

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`sidebar${isOpen ? " is-open" : ""}`} aria-label="Primary">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <Crosshair size={22} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-name">
            Shuttle<span>IQ</span>
          </div>
          <div className="brand-tag">AI Umpire and Analytics</div>
        </div>
      </div>

      <nav>
        <ul className="nav-list">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className="nav-link"
                  aria-current={isActive ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="row" style={{ gap: 8, marginBottom: 6 }}>
          <Activity size={14} />
          <span>Phase 1 foundation</span>
        </div>
        AI umpiring and analytics are planned and not yet active.
      </div>
    </aside>
  );
}
