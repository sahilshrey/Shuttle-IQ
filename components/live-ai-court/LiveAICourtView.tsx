"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  Crosshair,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Square,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCameraStream } from "@/lib/camera/useCameraStream";
import {
  isValidQuadrilateral,
  projectPoint,
  solveHomography,
  UNIT_COURT_CORNERS,
  type Homography,
  type Point2D,
} from "@/lib/calibration/homography";
import { AI_PROVIDER_STATUS } from "@/lib/ai/tracking";
import type { CameraStatus } from "@/lib/camera/camera-errors";

type ViewSize = { width: number; height: number };
type OverlayAdjustment = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  perspective: number;
  opacity: number;
};

const EMPTY_ADJUSTMENT: OverlayAdjustment = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  perspective: 0,
  opacity: 48,
};

const CALIBRATION_LABELS = [
  "Far-left corner",
  "Far-right corner",
  "Near-right corner",
  "Near-left corner",
];

const SINGLES_SIDE_OFFSET = (6.1 - 5.18) / (2 * 6.1);
const SHORT_SERVICE_OFFSET = 1.98 / 13.4;
const DOUBLES_LONG_SERVICE_OFFSET = 0.76 / 13.4;

const COURT_LINES: {
  id: string;
  from: Point2D;
  to: Point2D;
  format?: "singles" | "doubles";
}[] = [
  { id: "baseline-far", from: { x: 0, y: 0 }, to: { x: 0, y: 1 } },
  { id: "baseline-near", from: { x: 1, y: 0 }, to: { x: 1, y: 1 } },
  { id: "sideline-far", from: { x: 0, y: 0 }, to: { x: 1, y: 0 }, format: "doubles" },
  { id: "sideline-near", from: { x: 0, y: 1 }, to: { x: 1, y: 1 }, format: "doubles" },
  {
    id: "singles-sideline-far",
    from: { x: 0, y: SINGLES_SIDE_OFFSET },
    to: { x: 1, y: SINGLES_SIDE_OFFSET },
    format: "singles",
  },
  {
    id: "singles-sideline-near",
    from: { x: 0, y: 1 - SINGLES_SIDE_OFFSET },
    to: { x: 1, y: 1 - SINGLES_SIDE_OFFSET },
    format: "singles",
  },
  { id: "short-service-left", from: { x: 0.5 - SHORT_SERVICE_OFFSET, y: 0 }, to: { x: 0.5 - SHORT_SERVICE_OFFSET, y: 1 } },
  { id: "short-service-right", from: { x: 0.5 + SHORT_SERVICE_OFFSET, y: 0 }, to: { x: 0.5 + SHORT_SERVICE_OFFSET, y: 1 } },
  {
    id: "doubles-long-service-left",
    from: { x: DOUBLES_LONG_SERVICE_OFFSET, y: 0 },
    to: { x: DOUBLES_LONG_SERVICE_OFFSET, y: 1 },
    format: "doubles",
  },
  {
    id: "doubles-long-service-right",
    from: { x: 1 - DOUBLES_LONG_SERVICE_OFFSET, y: 0 },
    to: { x: 1 - DOUBLES_LONG_SERVICE_OFFSET, y: 1 },
    format: "doubles",
  },
  { id: "center-left", from: { x: 0, y: 0.5 }, to: { x: 0.5 - SHORT_SERVICE_OFFSET, y: 0.5 } },
  { id: "center-right", from: { x: 0.5 + SHORT_SERVICE_OFFSET, y: 0.5 }, to: { x: 1, y: 0.5 } },
  { id: "net", from: { x: 0.5, y: 0 }, to: { x: 0.5, y: 1 } },
];

const STATUS_LABELS: Record<CameraStatus, string> = {
  idle: "Camera off",
  requesting: "Requesting permission",
  live: "Camera live",
  denied: "Permission denied",
  "not-found": "Camera not found",
  unsupported: "Camera unavailable",
  error: "Camera error",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function adjustCorners(
  points: readonly Point2D[],
  size: ViewSize,
  adjustment: OverlayAdjustment,
): Point2D[] {
  if (size.width <= 0 || size.height <= 0) return [...points];

  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }),
    { x: 0, y: 0 },
  );
  const centerX = center.x * size.width;
  const centerY = center.y * size.height;
  const angle = (adjustment.rotation * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  return points.map((point) => {
    const localX = (point.x - center.x) * size.width * adjustment.scale;
    const localY = (point.y - center.y) * size.height * adjustment.scale;
    const rotatedX = centerX + localX * cos - localY * sin;
    const rotatedY = centerY + localX * sin + localY * cos;
    const perspectiveShift = ((rotatedY - centerY) * adjustment.perspective) / 100;
    return {
      x: (rotatedX + perspectiveShift + (adjustment.x / 100) * size.width) / size.width,
      y: (rotatedY + (adjustment.y / 100) * size.height) / size.height,
    };
  });
}

function quadrilateralArea(points: readonly Point2D[]) {
  return Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
}

function CameraMessage({ status, errorMessage }: { status: CameraStatus; errorMessage: string | null }) {
  const copy =
    status === "idle"
      ? "Start the rear camera to view the court and begin calibration."
      : status === "requesting"
        ? "Allow camera access in the browser prompt."
        : errorMessage ?? "The camera could not be started. Check browser permission and try again.";
  return (
    <div className="live-ai-camera-message" role="status" aria-live="polite">
      {status === "requesting" ? <Camera size={24} className="is-spinning" /> : <AlertTriangle size={24} />}
      <strong>{STATUS_LABELS[status]}</strong>
      <span>{copy}</span>
    </div>
  );
}

function ProjectedCourt({
  matrix,
  size,
  singles,
  opacity,
}: {
  matrix: Homography;
  size: ViewSize;
  singles: boolean;
  opacity: number;
}) {
  const screenPoint = (point: Point2D) => {
    const projected = projectPoint(matrix, point);
    if (!projected) return null;
    return { x: projected.x * size.width, y: projected.y * size.height };
  };
  const corners = UNIT_COURT_CORNERS.map(screenPoint);
  if (corners.some((point) => point === null)) return null;
  const polygon = corners.map((point) => `${point!.x},${point!.y}`).join(" ");

  return (
    <g opacity={opacity / 100} pointerEvents="none">
      <polygon points={polygon} fill="#10b981" fillOpacity=".08" stroke="#d8fbe7" strokeOpacity=".62" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {COURT_LINES.map(({ id, from, to, format }) => {
        const start = screenPoint(from);
        const end = screenPoint(to);
        if (!start || !end) return null;
        const isNet = id === "net";
        const isInactiveFormat = format && ((format === "singles") !== singles);
        return (
          <line
            key={id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={isNet ? "#f8fff9" : "#c8ffe0"}
            strokeWidth={isNet ? 4 : 2}
            strokeOpacity={isInactiveFormat ? ".3" : isNet ? ".95" : ".84"}
            strokeDasharray={id.includes("doubles-long-service") && !singles ? "7 5" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </g>
  );
}

export function LiveAICourtView() {
  const camera = useCameraStream();
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewSize, setViewSize] = useState<ViewSize>({ width: 0, height: 0 });
  const [videoResolution, setVideoResolution] = useState<ViewSize | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [matchFormat, setMatchFormat] = useState<"singles" | "doubles">("singles");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Point2D[]>([]);
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [hasVisibleMarkings, setHasVisibleMarkings] = useState(false);
  const [adjustment, setAdjustment] = useState(EMPTY_ADJUSTMENT);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(([entry]) => {
      setViewSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIsPaused(false);
    setVideoResolution(null);
    setCalibrationPoints([]);
    setIsCalibrating(false);
    setCalibrationError(null);
    setHasVisibleMarkings(false);
    setAdjustment(EMPTY_ADJUSTMENT);
  }, [camera.selectedDeviceId]);

  const adjustedPoints = useMemo(
    () => adjustCorners(calibrationPoints, viewSize, adjustment),
    [calibrationPoints, viewSize, adjustment],
  );
  const homography = useMemo(
    () =>
      adjustedPoints.length === 4 && isValidQuadrilateral(adjustedPoints)
        ? solveHomography(UNIT_COURT_CORNERS, adjustedPoints)
        : null,
    [adjustedPoints],
  );
  const isCalibrated = calibrationPoints.length === 4 && homography !== null;
  const pointArea = quadrilateralArea(calibrationPoints);
  const geometryQuality =
    !isCalibrated
      ? "Not calibrated"
      : !hasVisibleMarkings
        ? "Unverified"
        : pointArea >= 0.12
          ? "Good"
          : pointArea >= 0.035
            ? "Fair"
            : "Low";

  function beginCalibration() {
    if (camera.status !== "live") return;
    setCalibrationPoints([]);
    setCalibrationError(null);
    setHasVisibleMarkings(false);
    setIsCalibrating(true);
  }

  function addCalibrationPoint(event: React.PointerEvent<SVGSVGElement>) {
    if (!isCalibrating || !viewSize.width || !viewSize.height) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
      y: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    };
    const nextPoints = [...calibrationPoints, point];

    if (nextPoints.length === 4) {
      if (!isValidQuadrilateral(nextPoints) || !solveHomography(UNIT_COURT_CORNERS, nextPoints)) {
        setCalibrationError("Those points do not form a usable four-corner court shape. Mark them again in order.");
        setCalibrationPoints([]);
        return;
      }
      setIsCalibrating(false);
      setCalibrationError(null);
    }

    setCalibrationPoints(nextPoints);
  }

  function resetCalibration() {
    setCalibrationPoints([]);
    setIsCalibrating(false);
    setCalibrationError(null);
    setHasVisibleMarkings(false);
    setAdjustment(EMPTY_ADJUSTMENT);
  }

  async function togglePause() {
    const video = camera.videoRef.current;
    if (!video) return;

    if (isPaused) {
      try {
        await video.play();
        setIsPaused(false);
        setPlaybackError(null);
      } catch {
        setPlaybackError("Video playback could not resume. Stop the camera and start it again.");
      }
    } else {
      video.pause();
      setIsPaused(true);
      setPlaybackError(null);
    }
  }

  function stopCamera() {
    camera.stop();
    setIsPaused(false);
    setPlaybackError(null);
  }

  function onCameraChange(deviceId: string) {
    setIsPaused(false);
    setCalibrationPoints([]);
    setIsCalibrating(false);
    camera.selectDevice(deviceId);
  }

  const isLive = camera.status === "live";
  const actualWidth = videoResolution?.width ?? camera.streamInfo?.width ?? null;
  const actualHeight = videoResolution?.height ?? camera.streamInfo?.height ?? null;
  const frameRate = camera.streamInfo?.frameRate;

  return (
    <div className="page live-ai-page">
      <PageHeader
        eyebrow="Live AI Court · Phase 1"
        title="Fixed side-view court"
        subtitle="Use a stationary Android tablet rear camera. The video stays independent from the adjustable court overlay."
      />

      <div className="live-ai-camera-config">
        <Camera size={17} />
        <span><strong>Side view</strong> · Fixed tripod or stationary mount · Camera remains still during play</span>
        <span className="badge badge-neutral">Rear camera preferred</span>
      </div>

      <section className="live-ai-view-card card" aria-label="Live camera and court overlay">
        <div className="live-ai-view-header">
          <div>
            <h2 className="card-title">Live camera</h2>
            <p className="card-description">Camera preview and projected lines are rendered separately.</p>
          </div>
          <div className={`live-ai-camera-state${isLive ? " is-live" : ""}`} role="status">
            <span className="dot" />
            {isPaused ? "Preview paused" : STATUS_LABELS[camera.status]}
          </div>
        </div>

        <div className="live-ai-stage" ref={stageRef}>
          <video
            ref={camera.videoRef}
            className={`live-ai-video${isLive ? "" : " is-hidden"}`}
            autoPlay
            muted
            playsInline
            aria-label="Live side-view badminton court camera"
            onLoadedMetadata={(event) =>
              setVideoResolution({
                width: event.currentTarget.videoWidth,
                height: event.currentTarget.videoHeight,
              })
            }
          />
          {isLive && isCalibrated && homography ? (
            <svg
              className="live-ai-overlay"
              viewBox={`0 0 ${viewSize.width} ${viewSize.height}`}
              preserveAspectRatio="none"
              aria-label="Calibrated digital badminton court overlay"
              role="img"
            >
              <ProjectedCourt
                matrix={homography}
                size={viewSize}
                singles={matchFormat === "singles"}
                opacity={adjustment.opacity}
              />
            </svg>
          ) : null}
          {isLive && isCalibrating ? (
            <svg
              className="live-ai-calibration-layer"
              viewBox={`0 0 ${viewSize.width} ${viewSize.height}`}
              preserveAspectRatio="none"
              onPointerDown={addCalibrationPoint}
              role="application"
              aria-label="Tap the four visible court corners in order to calibrate the overlay"
            >
              <rect width={viewSize.width} height={viewSize.height} fill="transparent" />
              {calibrationPoints.map((point, index) => (
                <g key={`calibration-point-${index}`} pointerEvents="none">
                  <circle cx={point.x * viewSize.width} cy={point.y * viewSize.height} r="12" fill="#34d399" fillOpacity=".24" />
                  <circle cx={point.x * viewSize.width} cy={point.y * viewSize.height} r="5" fill="#eafff3" stroke="#10b981" strokeWidth="2" />
                  <text x={point.x * viewSize.width + 12} y={point.y * viewSize.height - 10} fill="#ffffff" fontSize="13" paintOrder="stroke" stroke="#05110c" strokeWidth="3">
                    {index + 1}
                  </text>
                </g>
              ))}
            </svg>
          ) : null}
          {!isLive ? <CameraMessage status={camera.status} errorMessage={camera.errorMessage} /> : null}
          {isPaused && isLive ? <span className="live-ai-paused-label">PREVIEW PAUSED</span> : null}
        </div>

        <div className="live-ai-camera-controls">
          <div className="field live-ai-camera-select">
            <label className="field-label" htmlFor="live-ai-camera-select">Camera device</label>
            <select
              id="live-ai-camera-select"
              className="select"
              value={camera.selectedDeviceId}
              onChange={(event) => onCameraChange(event.target.value)}
              disabled={camera.devices.length === 0 || camera.status === "requesting"}
            >
              {camera.devices.length === 0 ? <option value="">No cameras detected</option> : null}
              {camera.devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
              ))}
            </select>
          </div>
          <div className="live-ai-video-stats" aria-label="Video stream details">
            <span><strong>Resolution</strong>{actualWidth && actualHeight ? `${actualWidth} × ${actualHeight}` : "—"}</span>
            <span><strong>Frame rate</strong>{frameRate ? `${frameRate.toFixed(1)} fps` : "Unavailable"}</span>
          </div>
          <div className="live-ai-camera-buttons">
            {isLive ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => void togglePause()}>
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
                <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                  <Square size={15} /> Stop
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setIsPaused(false);
                  void camera.start();
                }}
                disabled={camera.status === "requesting"}
              >
                <Play size={16} /> {camera.status === "idle" ? "Start camera" : "Try camera again"}
              </button>
            )}
          </div>
          {playbackError ? <p className="live-ai-playback-error" role="alert">{playbackError}</p> : null}
        </div>
      </section>

      <div className="live-ai-workspace">
        <section className="card live-ai-overlay-card" aria-labelledby="overlay-heading">
          <div className="card-header">
            <div>
              <h2 className="card-title" id="overlay-heading">Virtual court overlay</h2>
              <p className="card-description">Transparent regulation court lines; adjust without moving the camera.</p>
            </div>
            <span className="badge badge-neutral">{matchFormat === "singles" ? "Singles" : "Doubles"}</span>
          </div>

          <div className="live-ai-format-switch" role="group" aria-label="Overlay match format">
            {(["singles", "doubles"] as const).map((format) => (
              <button
                type="button"
                key={format}
                className={`virtual-segment${matchFormat === format ? " is-active" : ""}`}
                aria-pressed={matchFormat === format}
                onClick={() => setMatchFormat(format)}
              >
                {format === "singles" ? "Singles · 13.4 × 5.18 m" : "Doubles · 13.4 × 6.10 m"}
              </button>
            ))}
          </div>

          <div className="live-ai-calibration-status">
            <div className={`live-ai-quality quality-${geometryQuality.toLowerCase().replace(" ", "-")}`}>
              <Crosshair size={17} />
              <span><strong>{geometryQuality}</strong><small>Calibration geometry</small></span>
            </div>
            <p>
              {isCalibrated
                ? "Four-point projection ready. Visual fit only; physical court accuracy is not verified."
                : "Mark four visible court reference corners to project the overlay."}
            </p>
          </div>

          {isCalibrating ? (
            <div className="live-ai-instruction" role="status" aria-live="polite">
              <Target size={18} />
              <span>
                {calibrationPoints.length < 4
                  ? `Tap ${CALIBRATION_LABELS[calibrationPoints.length]} (${calibrationPoints.length + 1} of 4).`
                  : "Four points marked."}
                {" "}Place points clockwise around the visible court.
              </span>
            </div>
          ) : null}
          {calibrationError ? <p className="live-ai-calibration-error" role="alert">{calibrationError}</p> : null}

          <div className="live-ai-calibration-actions">
            <button type="button" className="btn btn-primary" onClick={beginCalibration} disabled={!isLive}>
              <Crosshair size={16} /> {isCalibrated ? "Recalibrate" : "Mark 4 court points"}
            </button>
            {isCalibrating ? (
              <button type="button" className="btn btn-secondary" onClick={() => setIsCalibrating(false)}>
                Cancel
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={resetCalibration} disabled={!calibrationPoints.length}>
              <RotateCcw size={15} /> Reset calibration
            </button>
          </div>

          <label className="live-ai-markings-check">
            <input
              type="checkbox"
              checked={hasVisibleMarkings}
              onChange={(event) => setHasVisibleMarkings(event.target.checked)}
              disabled={!isCalibrated}
            />
            <span>I can see court reference markings in the camera image</span>
          </label>
          <p className="live-ai-hint">
            Quality describes point geometry only. If court markings are absent or obscured, the overlay is unverified.
          </p>

          <div className="live-ai-adjustments">
            <h3>Adjust overlay</h3>
            <p>These controls affect only the digital overlay, never the camera feed.</p>
            <label className="live-ai-range">
              <span>Overlay opacity <output>{adjustment.opacity}%</output></span>
              <input type="range" min="10" max="90" value={adjustment.opacity} onChange={(event) => setAdjustment((value) => ({ ...value, opacity: Number(event.target.value) }))} aria-label="Overlay opacity" />
            </label>
            <label className="live-ai-range">
              <span>Move horizontally <output>{adjustment.x}%</output></span>
              <input type="range" min="-40" max="40" value={adjustment.x} onChange={(event) => setAdjustment((value) => ({ ...value, x: Number(event.target.value) }))} aria-label="Move overlay horizontally" disabled={!isCalibrated} />
            </label>
            <label className="live-ai-range">
              <span>Move vertically <output>{adjustment.y}%</output></span>
              <input type="range" min="-40" max="40" value={adjustment.y} onChange={(event) => setAdjustment((value) => ({ ...value, y: Number(event.target.value) }))} aria-label="Move overlay vertically" disabled={!isCalibrated} />
            </label>
            <label className="live-ai-range">
              <span>Resize <output>{adjustment.scale.toFixed(2)}×</output></span>
              <input type="range" min="0.5" max="1.5" step="0.05" value={adjustment.scale} onChange={(event) => setAdjustment((value) => ({ ...value, scale: Number(event.target.value) }))} aria-label="Resize overlay" disabled={!isCalibrated} />
            </label>
            <label className="live-ai-range">
              <span>Rotate <output>{adjustment.rotation}°</output></span>
              <input type="range" min="-35" max="35" value={adjustment.rotation} onChange={(event) => setAdjustment((value) => ({ ...value, rotation: Number(event.target.value) }))} aria-label="Rotate overlay" disabled={!isCalibrated} />
            </label>
            <label className="live-ai-range">
              <span>Perspective <output>{adjustment.perspective}</output></span>
              <input type="range" min="-30" max="30" value={adjustment.perspective} onChange={(event) => setAdjustment((value) => ({ ...value, perspective: Number(event.target.value) }))} aria-label="Adjust overlay perspective" disabled={!isCalibrated} />
            </label>
            <button type="button" className="btn btn-ghost live-ai-adjust-reset" onClick={() => setAdjustment((value) => ({ ...EMPTY_ADJUSTMENT, opacity: value.opacity }))}>
              <RotateCcw size={15} /> Reset overlay adjustments
            </button>
          </div>
        </section>

        <aside className="live-ai-pipeline" aria-label="AI tracking status">
          <section className="card live-ai-pipeline-card">
            <div className="live-ai-pipeline-title">
              <h2 className="card-title">Player tracking</h2>
              <span className="badge badge-neutral">{AI_PROVIDER_STATUS}</span>
            </div>
            <p className="card-description">Detection and tracking provider interface prepared; no model connected.</p>
            <div className="live-ai-pipeline-note"><ShieldAlert size={16} /> No player detections or trails are being generated.</div>
            <small>Future results carry track IDs, confidence, positions and movement trails.</small>
          </section>

          <section className="card live-ai-pipeline-card">
            <div className="live-ai-pipeline-title">
              <h2 className="card-title">Shuttlecock tracking</h2>
              <span className="badge badge-neutral">{AI_PROVIDER_STATUS}</span>
            </div>
            <p className="card-description">Separate shuttle detector and short-gap tracking interface prepared.</p>
            <div className="live-ai-pipeline-note"><ShieldAlert size={16} /> No shuttle detections or confidence scores are available.</div>
            <small>Missed detections remain missing; no shuttle path is synthesized.</small>
          </section>

          <section className="card live-ai-pipeline-card">
            <div className="live-ai-pipeline-title">
              <h2 className="card-title">AI umpire</h2>
              <span className="badge badge-neutral">{AI_PROVIDER_STATUS}</span>
            </div>
            <div className="live-ai-decision-states" aria-label="Available decision states">
              <span>IN</span><span>OUT</span><span>UNCERTAIN</span>
            </div>
            <p className="card-description">No official decisions are issued. A future call requires calibration and reliable detected landing evidence.</p>
            <div className="live-ai-prerequisite">
              <Check size={15} /> Four-point calibration
              <span>+</span>
              <Target size={15} /> Confident landing
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
