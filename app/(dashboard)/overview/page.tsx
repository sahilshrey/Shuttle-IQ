import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Crosshair,
  Gauge,
  Grid2x2,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PLATFORM_FEATURES } from "@/lib/features";

const QUICK_STEPS = [
  {
    icon: Grid2x2,
    title: "Choose your format",
    description: "Pick singles or doubles and describe the court environment.",
  },
  {
    icon: Camera,
    title: "Connect a camera",
    description: "Allow browser camera access and select the camera covering the court.",
  },
  {
    icon: Gauge,
    title: "Calibrate the court",
    description: "Calibration will align the camera with the court lines. Planned for a later phase.",
  },
];

export default function OverviewPage() {
  const liveCount = PLATFORM_FEATURES.filter((feature) => feature.status === "live").length;

  return (
    <div className="page">
      <section className="hero">
        <span className="eyebrow">Welcome back</span>
        <h1 className="hero-title">
          Shuttle<span>IQ</span> brings AI umpiring to every court.
        </h1>
        <p className="hero-copy">
          Set up your court, connect a camera, and prepare for AI-assisted match officiating and
          analytics. Camera preview is live today; AI detection is still in development.
        </p>
        <div className="row" style={{ marginTop: 8 }}>
          <Link href="/live-court" className="btn btn-primary">
            Open Live Court
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="grid-3" aria-label="Summary">
        <div className="card">
          <div className="icon-tile">
            <Camera size={20} />
          </div>
          <div className="stat-value" style={{ marginTop: 16 }}>
            {liveCount} of {PLATFORM_FEATURES.length}
          </div>
          <div className="stat-label">Foundation features active</div>
        </div>
        <div className="card">
          <div className="icon-tile">
            <Crosshair size={20} />
          </div>
          <div className="stat-value" style={{ marginTop: 16 }}>
            0
          </div>
          <div className="stat-label">Calibrated courts</div>
        </div>
        <div className="card">
          <div className="icon-tile">
            <Sparkles size={20} />
          </div>
          <div className="stat-value" style={{ marginTop: 16 }}>
            Planned
          </div>
          <div className="stat-label">AI umpire model status</div>
        </div>
      </section>

      <section className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Getting started</h2>
              <p className="card-description">The path from setup to a monitored match.</p>
            </div>
          </div>
          <div className="stack">
            {QUICK_STEPS.map(({ icon: Icon, title, description }, index) => (
              <div key={title} className="status-item">
                <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
                  <div className="icon-tile" style={{ width: 36, height: 36 }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="status-label">
                      {index + 1}. {title}
                    </div>
                    <div className="status-detail">{description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Platform modules</h2>
              <p className="card-description">What is working now and what is coming next.</p>
            </div>
          </div>
          <ul className="feature-list">
            {PLATFORM_FEATURES.map((feature) => (
              <li key={feature.id}>
                <span>{feature.title}</span>
                <StatusBadge variant={feature.status === "live" ? "live" : "planned"}>
                  {feature.status === "live" ? "Live" : "Planned"}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
