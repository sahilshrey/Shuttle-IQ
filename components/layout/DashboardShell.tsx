"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isNavOpen} onNavigate={() => setIsNavOpen(false)} />
      <div
        className={`scrim${isNavOpen ? " is-open" : ""}`}
        onClick={() => setIsNavOpen(false)}
        aria-hidden="true"
      />
      <div className="main-column">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsNavOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isNavOpen}
          >
            <Menu size={20} />
          </button>
          <span className="topbar-title">
            Shuttle<span>IQ</span>
          </span>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
