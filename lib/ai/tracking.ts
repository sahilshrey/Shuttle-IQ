import type { Point2D } from "@/lib/calibration/homography";

export type AIConnectionStatus = "connected" | "not-connected";

export type DetectionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PlayerDetection = {
  trackId: string;
  confidence: number;
  bounds: DetectionBox;
  position: Point2D;
  timestamp: number;
};

export type PlayerTrackingResult = {
  detections: PlayerDetection[];
  trails: Record<string, readonly Point2D[]>;
};

export type ShuttleDetection = {
  confidence: number;
  position: Point2D;
  timestamp: number;
};

export type ShuttleTrackingResult = {
  detection: ShuttleDetection | null;
  missedFrames: number;
};

export interface PlayerTrackingProvider {
  readonly status: AIConnectionStatus;
  detect(
    frame: HTMLVideoElement,
    timestamp: number,
  ): Promise<PlayerTrackingResult>;
}

export interface ShuttleTrackingProvider {
  readonly status: AIConnectionStatus;
  detect(
    frame: HTMLVideoElement,
    timestamp: number,
  ): Promise<ShuttleTrackingResult>;
}

export type UmpireDecisionState = "IN" | "OUT" | "UNCERTAIN";

export type UmpireEvidence = {
  calibrationId: string | null;
  landing: ShuttleDetection | null;
  calibrated: boolean;
};

export type UmpireDecision = {
  state: UmpireDecisionState;
  reason: string;
  evidence: UmpireEvidence | null;
};

export interface UmpireProvider {
  readonly status: AIConnectionStatus;
  decide(evidence: UmpireEvidence): Promise<UmpireDecision>;
}

export const AI_PROVIDER_STATUS = "NOT CONNECTED" as const;
