import type { RefObject } from "react";
import { Camera, CameraOff, Circle as CircleAlert, LoaderCircle, Play, RefreshCw, Square } from "lucide-react";
import type { CameraDevice } from "@/lib/camera/useCameraStream";
import type { CameraStatus } from "@/lib/camera/camera-errors";
import { StatusBadge } from "@/components/ui/StatusBadge";

type CameraPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  devices: CameraDevice[];
  selectedDeviceId: string;
  onStart: () => void;
  onStop: () => void;
  onSelectDevice: (deviceId: string) => void;
};

const OVERLAY_COPY: Record<Exclude<CameraStatus, "live">, { title: string; body: string }> = {
  idle: {
    title: "Camera is off",
    body: "Start the camera to preview the court. Your browser will ask for permission first.",
  },
  requesting: {
    title: "Waiting for permission",
    body: "Choose Allow in the browser prompt to start the preview.",
  },
  denied: {
    title: "Camera access blocked",
    body: "Allow camera access in your browser settings, then try again.",
  },
  "not-found": {
    title: "No camera found",
    body: "Connect a camera to this device, then refresh the list.",
  },
  unsupported: {
    title: "Camera not supported",
    body: "Open ShuttleIQ in a current browser over HTTPS to use the camera.",
  },
  error: {
    title: "Camera unavailable",
    body: "Something went wrong while starting the camera.",
  },
};

export function CameraPanel({
  videoRef,
  status,
  errorMessage,
  devices,
  selectedDeviceId,
  onStart,
  onStop,
  onSelectDevice,
}: CameraPanelProps) {
  const isLive = status === "live";
  const isBusy = status === "requesting";
  const overlay = isLive ? null : OVERLAY_COPY[status];
  const isErrorState = status === "denied" || status === "not-found" || status === "error" || status === "unsupported";

  return (
    <section className="card stack" aria-labelledby="camera-preview-heading">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 id="camera-preview-heading" className="card-title">
            Live camera preview
          </h2>
          <p className="card-description">Frame the full court before starting a match.</p>
        </div>
        {isLive ? <StatusBadge variant="live">Live</StatusBadge> : null}
      </div>

      <div className="camera-frame">
        <video
          ref={videoRef}
          className={`camera-video${isLive ? "" : " is-hidden"}`}
          autoPlay
          muted
          playsInline
          aria-label="Live camera preview of the court"
        />

        {isLive ? (
          <div className="camera-corners" aria-hidden="true" />
        ) : (
          <div className="camera-overlay">
            <div className="camera-overlay-content" role="status" aria-live="polite">
              <div className={`camera-overlay-icon${isErrorState ? " is-error" : ""}${isBusy ? " is-spinning" : ""}`}>
                {isBusy ? (
                  <LoaderCircle size={28} />
                ) : isErrorState ? (
                  <CircleAlert size={28} />
                ) : status === "idle" ? (
                  <CameraOff size={28} />
                ) : (
                  <Camera size={28} />
                )}
              </div>
              <div>
                <div className="card-title">{overlay?.title}</div>
                <p className="card-description" style={{ marginTop: 6 }}>
                  {errorMessage ?? overlay?.body}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="camera-controls">
        <div className="field">
          <label className="field-label" htmlFor="camera-select">
            Camera
          </label>
          <select
            id="camera-select"
            className="select"
            value={selectedDeviceId}
            onChange={(event) => onSelectDevice(event.target.value)}
            disabled={devices.length === 0}
          >
            {devices.length === 0 ? <option value="">No cameras detected yet</option> : null}
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        </div>

        {isLive ? (
          <button type="button" className="btn btn-secondary" onClick={onStop}>
            <Square size={16} />
            Stop camera
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onStart} disabled={isBusy}>
            {status === "idle" ? <Play size={18} /> : <RefreshCw size={18} />}
            {status === "idle" ? "Start camera" : "Try again"}
          </button>
        )}
      </div>
    </section>
  );
}
