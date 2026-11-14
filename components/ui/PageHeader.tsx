import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 8 }}>
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="page-title">{title}</h1>
        </div>
        {actions}
      </div>
      {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
    </header>
  );
}
