export type FeatureStatus = "live" | "planned";

export type PlatformFeature = {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
};

export const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: "camera-preview",
    title: "Live camera preview",
    description: "Court camera feed in the browser with permission handling and device selection.",
    status: "live",
  },
  {
    id: "court-setup",
    title: "Court and match setup",
    description: "Singles or doubles format and court environment selection.",
    status: "live",
  },
  {
    id: "live-ai-calibration",
    title: "Live AI Court camera and calibration",
    description: "Fixed-camera preview, adjustable transparent court overlay, and four-point visual calibration.",
    status: "live",
  },
  {
    id: "virtual-court",
    title: "Virtual court and demo match",
    description: "Interactive, dimensioned court rendering with simulated rally scoring.",
    status: "live",
  },
  {
    id: "court-detection",
    title: "Automatic court detection",
    description: "Recognises court lines and boundaries from the camera feed.",
    status: "planned",
  },
  {
    id: "umpire-calls",
    title: "AI umpire calls",
    description: "Line, fault, and service decisions produced by computer vision.",
    status: "planned",
  },
  {
    id: "player-tracking",
    title: "Player and shuttle tracking",
    description: "Movement and shuttle path tracking during rallies.",
    status: "planned",
  },
  {
    id: "analytics",
    title: "Match analytics",
    description: "Rally statistics, heatmaps, and performance trends.",
    status: "planned",
  },
];
