import { Lock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function PlannedFeaturePage({
  eyebrow,
  title,
  subtitle,
  items,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: { title: string; description: string }[];
  icon: typeof Lock;
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        actions={<StatusBadge variant="planned">Planned</StatusBadge>}
      />
      <section className="grid-2">
        {items.map((item) => (
          <div key={item.title} className="card">
            <div className="icon-tile" style={{ marginBottom: 16 }}>
              <Icon size={20} />
            </div>
            <h2 className="card-title">{item.title}</h2>
            <p className="card-description" style={{ marginTop: 8 }}>
              {item.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
