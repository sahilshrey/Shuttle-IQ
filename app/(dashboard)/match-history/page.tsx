import { Factory as History } from "lucide-react";
import { PlannedFeaturePage } from "@/components/ui/PlannedFeaturePage";

export default function MatchHistoryPage() {
  return (
    <PlannedFeaturePage
      eyebrow="Archive"
      title="Match History"
      subtitle="Every recorded match with its scores, calls, and video highlights. Saving matches is planned for a later phase."
      icon={History}
      items={[
        {
          title: "Saved matches",
          description: "A list of past singles and doubles matches with dates and final scores.",
        },
        {
          title: "Call review",
          description: "Replay disputed umpire calls with the associated camera footage.",
        },
      ]}
    />
  );
}
