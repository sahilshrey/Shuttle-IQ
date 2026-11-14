import { Camera, Crosshair, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { CameraStatus } from "@/lib/camera/camera-errors";

type SystemStatusPanelProps = {
  cameraStatus: CameraStatus;
  cameraLabel: string | null;
};

const CAMERA_BADGE: Record<CameraStatus, { variant: "live" | "warning" | "error" | "neutral"; text: string }> = {
  idle: { variant: "neutral", text: "Off" },
  requesting: { variant: "warning", text: "Requesting" },
  live: { variant: "live", text: "Connected" },
  denied: { variant: "error", text: "Blocked" },
  "not-found": { variant: "error", text: "Not found" },
  unsupported: { variant: "error", text: "Unsupported" },
  error: { variant: "error", text: "Error" },
};

export function SystemStatusPanel({ cameraStatus, cameraLabel }: SystemStatusPanelProps) {
  const badge = CAMERA_BADGE[cameraStatus];

  return (
    <section className="card stack" aria-labelledby="system-status-heading">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 id="system-status-heading" className="card-title">
            System status
          </h2>
          <p className="card-description">Readiness of the camera and the AI pipeline.</p>
        </div>
      </div>

      <ul className="status-list">
        <li className="status-item">
          <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}>
            <Camera size={18} aria-hidden="true" />
            <div>
              <div className="status-label">Camera</div>
              <div className="status-detail">{cameraLabel ?? "No camera selected"}</div>
            </div>
          </div>
          <StatusBadge variant={badge.variant}>{badge.text}</StatusBadge>
        </li>

        <li className="status-item">
          <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}>
            <Crosshair size={18} aria-hidden="true" />
            <div>
              <div className="status-label">Court calibration</div>
              <div className="status-detail">Align the camera with the court lines</div>
            </div>
          </div>
          <StatusBadge variant="planned">Planned</StatusBadge>
        </li>

        <li className="status-item">
          <div className="row" style={{ flexWrap: "nowrap", gap: 12 }}>
            <Sparkles size={18} aria-hidden="true" />
            <div>
              <div className="status-label">AI umpire detection</div>
              <div className="status-detail">Line and fault detection models</div>
            </div>
          </div>
          <StatusBadge variant="planned">Planned</StatusBadge>
        </li>
      </ul>

      <div className="notice notice-info">
        <Sparkles size={18} aria-hidden="true" />
        <span>
          AI detection and calibration are not active yet. The camera preview is live, but no calls are made
          from the video.
        </span>
      </div>
    </section>
  );
}
