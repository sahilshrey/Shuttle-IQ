import { Settings } from "lucide-react";
import { PlannedFeaturePage } from "@/components/ui/PlannedFeaturePage";

export default function SettingsPage() {
  return (
    <PlannedFeaturePage
      eyebrow="Preferences"
      title="Settings"
      subtitle="Account and app preferences. Options will appear here as they are built."
      icon={Settings}
      items={[
        {
          title: "Default camera",
          description: "Remember the camera you use most for court setup.",
        },
        {
          title: "Display and units",
          description: "Theme, measurement units, and how scores are shown.",
        },
        {
          title: "Account",
          description: "Profile details and sign-in options.",
        },
      ]}
    />
  );
}
