import type { ReactNode } from "react";

type BadgeVariant = "live" | "planned" | "warning" | "error" | "neutral";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  live: "badge-live",
  planned: "badge-planned",
  warning: "badge-warning",
  error: "badge-error",
  neutral: "badge-neutral",
};

export function StatusBadge({
  variant,
  children,
}: {
  variant: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span className={`badge ${VARIANT_CLASS[variant]}`}>
      <span className="dot" aria-hidden="true" />
      {children}
    </span>
  );
}
