import { Check } from "lucide-react";
import {
  COURT_ENVIRONMENTS,
  MATCH_FORMATS,
  type CourtEnvironmentId,
  type MatchFormat,
} from "@/lib/court-config";
import { StatusBadge } from "@/components/ui/StatusBadge";

type CourtSetupPanelProps = {
  matchFormat: MatchFormat;
  environment: CourtEnvironmentId;
  onMatchFormatChange: (format: MatchFormat) => void;
  onEnvironmentChange: (environment: CourtEnvironmentId) => void;
};

export function CourtSetupPanel({
  matchFormat,
  environment,
  onMatchFormatChange,
  onEnvironmentChange,
}: CourtSetupPanelProps) {
  return (
    <section className="card stack" aria-labelledby="court-setup-heading">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 id="court-setup-heading" className="card-title">
            Court setup
          </h2>
          <p className="card-description">Describe the match before you start recording.</p>
        </div>
      </div>

      <div>
        <span className="field-label" id="match-format-label">
          Match format
        </span>
        <div className="option-grid" role="radiogroup" aria-labelledby="match-format-label">
          {MATCH_FORMATS.map((format) => {
            const isSelected = format.id === matchFormat;
            return (
              <button
                key={format.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className="option"
                onClick={() => onMatchFormatChange(format.id)}
              >
                <span className="option-title">{format.title}</span>
                <span className="option-description">{format.description}</span>
                {isSelected ? (
                  <span className="option-meta row" style={{ color: "var(--primary-300)" }}>
                    <Check size={14} aria-hidden="true" />
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Selected</span>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="field-label" id="environment-label">
          Court environment
        </span>
        <div className="option-grid" role="radiogroup" aria-labelledby="environment-label">
          {COURT_ENVIRONMENTS.map((option) => {
            const isSelected = option.id === environment;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className="option"
                onClick={() => onEnvironmentChange(option.id)}
              >
                <span className="option-title">{option.title}</span>
                <span className="option-description">{option.description}</span>
              </button>
            );
          })}
          <div className="option" aria-disabled="true" style={{ cursor: "not-allowed", opacity: 0.6 }}>
            <span className="option-title">Auto-detect</span>
            <span className="option-description">Detect the venue from the camera feed</span>
            <span className="option-meta">
              <StatusBadge variant="planned">Planned</StatusBadge>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
