import { ChartBar as BarChart3 } from "lucide-react";
import { PlannedFeaturePage } from "@/components/ui/PlannedFeaturePage";

export default function AnalyticsPage() {
  return (
    <PlannedFeaturePage
      eyebrow="Insights"
      title="Analytics"
      subtitle="Performance insights built from match data. These views are not yet connected to real match data."
      icon={BarChart3}
      items={[
        {
          title: "Rally statistics",
          description: "Rally length, winners, and error breakdowns once matches are recorded.",
        },
        {
          title: "Court coverage heatmaps",
          description: "Where players spend their time on court, drawn from tracked movement.",
        },
        {
          title: "Performance trends",
          description: "Compare form across sessions for each player or pair.",
        },
      ]}
    />
  );
}
