"use client";

import { useEffect, useState } from "react";
import {
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ZoomIn,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

type MatchFormat = "singles" | "doubles";
type ViewPreset = "overhead" | "broadcast" | "sideline";

type DemoGame = {
  score: [number, number];
  rallies: number;
  shots: number;
  rallyShots: number;
  rallyTarget: number;
  shotIndex: number;
  lastCall: string;
  isPlaying: boolean;
  isFinished: boolean;
};

const INITIAL_GAME: DemoGame = {
  score: [0, 0],
  rallies: 0,
  shots: 0,
  rallyShots: 0,
  rallyTarget: 7,
  shotIndex: 0,
  lastCall: "Demo ready — start a simulated rally.",
  isPlaying: false,
  isFinished: false,
};

const VIEW_PRESETS: { id: ViewPreset; label: string; tilt: number }[] = [
  { id: "overhead", label: "Overhead", tilt: 0 },
  { id: "broadcast", label: "Broadcast", tilt: 24 },
  { id: "sideline", label: "Sideline", tilt: 46 },
];

const SHUTTLE_PATH = [
  { x: 286, y: 120 },
  { x: 344, y: 92 },
  { x: 400, y: 112 },
  { x: 354, y: 164 },
  { x: 292, y: 188 },
  { x: 248, y: 142 },
  { x: 320, y: 112 },
  { x: 382, y: 186 },
];

function isGameWon(score: number, opponentScore: number) {
  return (score >= 21 && score - opponentScore >= 2) || score === 30;
}

export function VirtualCourtView() {
  const [matchFormat, setMatchFormat] = useState<MatchFormat>("singles");
  const [viewPreset, setViewPreset] = useState<ViewPreset>("broadcast");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [game, setGame] = useState<DemoGame>(INITIAL_GAME);

  useEffect(() => {
    if (!game.isPlaying) return;

    const timer = window.setInterval(() => {
      setGame((current) => {
        if (!current.isPlaying) return current;

        const shotIndex = current.shotIndex + 1;
        const shots = current.rallyShots + 1;
        if (shots < current.rallyTarget) {
          return {
            ...current,
            shots: current.shots + 1,
            rallyShots: shots,
            shotIndex,
            lastCall: ["Clear", "Drop shot", "Drive", "Lift", "Smash"][shotIndex % 5] + " — simulated",
          };
        }

        const pointWinner = Math.random() < 0.5 ? 0 : 1;
        const score: [number, number] = [...current.score];
        score[pointWinner] += 1;
        const isFinished = isGameWon(score[pointWinner], score[1 - pointWinner]);

        return {
          ...current,
          score,
          rallies: current.rallies + 1,
          shots: current.shots + 1,
          rallyShots: 0,
          rallyTarget: 5 + Math.floor(Math.random() * 6),
          shotIndex,
          lastCall: isFinished
            ? `Side ${pointWinner + 1} wins the simulated game.`
            : `Point to Side ${pointWinner + 1} — simulated`,
          isPlaying: !isFinished,
          isFinished,
        };
      });
    }, 850);

    return () => window.clearInterval(timer);
  }, [game.isPlaying]);

  const tilt = VIEW_PRESETS.find((preset) => preset.id === viewPreset)?.tilt ?? 24;
  const shuttle = SHUTTLE_PATH[game.shotIndex % SHUTTLE_PATH.length];
  const playerShift = game.shotIndex % 3;
  const singlesActive = matchFormat === "singles";
  const firstPlayer = { x: [128, 150, 112][playerShift], y: [102, 122, 82][playerShift] };
  const secondPlayer = { x: [512, 490, 528][playerShift], y: [198, 178, 218][playerShift] };
  const firstPlayers = singlesActive
    ? [firstPlayer]
    : [firstPlayer, { x: [174, 190, 160][playerShift], y: [196, 180, 214][playerShift] }];
  const secondPlayers = singlesActive
    ? [secondPlayer]
    : [secondPlayer, { x: [466, 450, 480][playerShift], y: [104, 120, 86][playerShift] }];

  function toggleGame() {
    setGame((current) => {
      if (current.isFinished) return current;
      return {
        ...current,
        isPlaying: !current.isPlaying,
        lastCall: current.isPlaying ? "Demo paused." : "Simulated rally in progress.",
      };
    });
  }

  function resetGame() {
    setGame(INITIAL_GAME);
  }

  return (
    <div className="page virtual-court-page">
      <PageHeader
        eyebrow="Virtual Court"
        title="Explore the court"
        subtitle="A digital court for exploring badminton geometry and running a simulated demo match."
      />

      <div className="virtual-notice" role="note">
        <span className="virtual-notice-dot" aria-hidden="true" />
        <span>
          <strong>Simulation only.</strong> Court markers, shuttle movement, shots and scores are
          generated for this demo. They are not camera-tracked or real match data.
        </span>
      </div>

      <section className="virtual-court-card card" aria-label="Interactive badminton court">
        <div className="virtual-court-toolbar">
          <div className="virtual-toolbar-group">
            <span className="virtual-control-label">Format</span>
            <div className="virtual-segmented" role="group" aria-label="Court format">
              {(["singles", "doubles"] as const).map((format) => (
                <button
                  type="button"
                  key={format}
                  className={`virtual-segment${matchFormat === format ? " is-active" : ""}`}
                  aria-pressed={matchFormat === format}
                  onClick={() => setMatchFormat(format)}
                >
                  {format === "singles" ? "Singles" : "Doubles"}
                </button>
              ))}
            </div>
          </div>
          <span className="virtual-dimensions">
            {matchFormat === "singles" ? "13.4 × 5.18 m" : "13.4 × 6.10 m"}
            <span>Official court dimensions</span>
          </span>
        </div>

        <div className="virtual-stage">
          <div
            className="virtual-court-plane"
            style={{
              transform: `rotateX(${tilt}deg) rotateY(${rotation}deg) scale(${zoom})`,
            }}
          >
            <svg
              className="virtual-court-svg"
              viewBox="0 0 640 300"
              role="img"
              aria-labelledby="court-title court-description"
            >
              <title id="court-title">
                {`${matchFormat === "singles" ? "Singles" : "Doubles"} badminton court`}
              </title>
              <desc id="court-description">
                Digital top-down badminton court with sidelines, baselines, service lines, net,
                virtual player markers and a simulated shuttlecock.
              </desc>
              <defs>
                <linearGradient id="court-surface" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0d503a" />
                  <stop offset="52%" stopColor="#08704c" />
                  <stop offset="100%" stopColor="#06442f" />
                </linearGradient>
                <pattern id="court-grain" width="12" height="12" patternUnits="userSpaceOnUse">
                  <path d="M0 0h12M0 6h12" stroke="#c6ffe0" strokeOpacity=".025" />
                </pattern>
                <filter id="court-shadow" x="-10%" y="-15%" width="120%" height="140%">
                  <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000" floodOpacity=".42" />
                </filter>
              </defs>
              <rect x="14" y="6" width="612" height="288" rx="8" fill="#06130e" opacity=".58" />
              <g filter="url(#court-shadow)">
                <rect x="20" y="13" width="600" height="274" rx="3" fill="url(#court-surface)" />
                <rect x="20" y="13" width="600" height="274" rx="3" fill="url(#court-grain)" />
              </g>
              <g
                fill="none"
                stroke="#d8fbe7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="20" y="13" width="600" height="274" />
                <line x1="20" y1="34" x2="620" y2="34" strokeOpacity={singlesActive ? "1" : ".42"} />
                <line x1="20" y1="266" x2="620" y2="266" strokeOpacity={singlesActive ? "1" : ".42"} />
                <line x1="20" y1="13" x2="20" y2="287" />
                <line x1="620" y1="13" x2="620" y2="287" />
                <line x1="231" y1="13" x2="231" y2="287" />
                <line x1="409" y1="13" x2="409" y2="287" />
                <line x1="54" y1="13" x2="54" y2="287" strokeDasharray="5 5" strokeOpacity={singlesActive ? ".28" : "1"} />
                <line x1="586" y1="13" x2="586" y2="287" strokeDasharray="5 5" strokeOpacity={singlesActive ? ".28" : "1"} />
                <line x1="20" y1="150" x2="231" y2="150" />
                <line x1="409" y1="150" x2="620" y2="150" />
              </g>
              <g>
                <line x1="320" y1="11" x2="320" y2="289" stroke="#e9fff2" strokeWidth="5" opacity=".22" />
                <line x1="320" y1="11" x2="320" y2="289" stroke="#f1fff7" strokeWidth="2.5" />
                <rect x="315" y="9" width="10" height="6" rx="2" fill="#d5f8e3" />
                <rect x="315" y="285" width="10" height="6" rx="2" fill="#d5f8e3" />
                <path d="M314 24h12M314 32h12M314 40h12M314 48h12M314 56h12M314 64h12M314 72h12M314 80h12M314 88h12M314 96h12M314 104h12M314 112h12M314 120h12M314 128h12M314 136h12M314 144h12M314 152h12M314 160h12M314 168h12M314 176h12M314 184h12M314 192h12M314 200h12M314 208h12M314 216h12M314 224h12M314 232h12M314 240h12M314 248h12M314 256h12M314 264h12M314 272h12" stroke="#d8fbe7" strokeOpacity=".28" strokeWidth="1" />
              </g>
              {firstPlayers.map((player, index) => (
                <g key={`side-a-${index}`}>
                  <circle cx={player.x} cy={player.y} r="18" fill="#4dd8a0" opacity=".18" />
                  <circle cx={player.x} cy={player.y} r="10" fill="#35d99a" stroke="#eafff3" strokeWidth="2" />
                  <text x={player.x} y={player.y + 4} textAnchor="middle" fill="#062417" fontSize="9" fontWeight="800">
                    {singlesActive ? "A" : `A${index + 1}`}
                  </text>
                </g>
              ))}
              {secondPlayers.map((player, index) => (
                <g key={`side-b-${index}`}>
                  <circle cx={player.x} cy={player.y} r="18" fill="#67c9f4" opacity=".18" />
                  <circle cx={player.x} cy={player.y} r="10" fill="#67c9f4" stroke="#effaff" strokeWidth="2" />
                  <text x={player.x} y={player.y + 4} textAnchor="middle" fill="#08202a" fontSize="9" fontWeight="800">
                    {singlesActive ? "B" : `B${index + 1}`}
                  </text>
                </g>
              ))}
              <g transform={`translate(${shuttle.x} ${shuttle.y})`}>
                <circle r="12" fill="#eaff93" opacity=".2" />
                <path d="M-5 -3 0 7 5 -3 0 -7Z" fill="#f3ffb0" stroke="#ffffff" strokeWidth="1.5" />
                <circle r="2" fill="#ffffff" />
              </g>
            </svg>
          </div>
          <div className="virtual-court-legend" aria-label="Court marker legend">
            <span><i className="legend-dot legend-player-a" /> Side A</span>
            <span><i className="legend-dot legend-player-b" /> Side B</span>
            <span><i className="legend-dot legend-shuttle" /> Simulated shuttle</span>
          </div>
        </div>

        <div className="virtual-view-controls">
          <div className="virtual-toolbar-group">
            <span className="virtual-control-label">Perspective</span>
            <div className="virtual-segmented" role="group" aria-label="Court viewing perspective">
              {VIEW_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`virtual-segment${viewPreset === preset.id ? " is-active" : ""}`}
                  aria-pressed={viewPreset === preset.id}
                  onClick={() => setViewPreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <label className="virtual-slider-control">
            <span><RotateCw size={15} /> Rotate</span>
            <input
              type="range"
              min="-55"
              max="55"
              value={rotation}
              onChange={(event) => setRotation(Number(event.target.value))}
              aria-label="Rotate the court"
            />
          </label>
          <label className="virtual-slider-control virtual-zoom-control">
            <span><ZoomIn size={15} /> Zoom</span>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              aria-label="Zoom the court"
            />
          </label>
          <button
            type="button"
            className="btn btn-secondary virtual-reset-view"
            onClick={() => {
              setRotation(0);
              setZoom(1);
              setViewPreset("broadcast");
            }}
          >
            <Maximize2 size={16} /> Reset view
          </button>
        </div>
      </section>

      <section className="virtual-demo-card card" aria-labelledby="demo-match-title">
        <div className="virtual-demo-header">
          <div>
            <div className="row virtual-demo-heading">
              <h2 className="card-title" id="demo-match-title">Demo Match</h2>
              <span className="badge badge-warning"><span className="dot" /> SIMULATED</span>
            </div>
            <p className="card-description">Automated rallies and scoring — not connected to a live match.</p>
          </div>
          <div className={`virtual-demo-status${game.isPlaying ? " is-playing" : ""}`} aria-live="polite">
            <span className="dot" />
            {game.isPlaying
              ? "Rally in progress"
              : game.isFinished
                ? "Demo complete"
                : game.shots === 0
                  ? "Demo ready"
                  : "Demo paused"}
          </div>
        </div>

        <div className="virtual-demo-content">
          <div className="virtual-scoreboard" aria-label="Simulated scoreboard">
            <div className="virtual-score-side">
              <span className="virtual-side-label"><i className="legend-dot legend-player-a" /> SIDE A</span>
              <strong>{game.score[0]}</strong>
            </div>
            <div className="virtual-score-divider">:</div>
            <div className="virtual-score-side">
              <span className="virtual-side-label"><i className="legend-dot legend-player-b" /> SIDE B</span>
              <strong>{game.score[1]}</strong>
            </div>
          </div>
          <div className="virtual-match-stats">
            <div><strong>{game.rallies}</strong><span>Rallies</span></div>
            <div><strong>{game.shots}</strong><span>Shots</span></div>
            <div className="virtual-last-call" aria-live="polite"><strong>{game.lastCall}</strong><span>Latest event · simulated</span></div>
          </div>
          <div className="virtual-demo-actions">
            <button type="button" className="btn btn-primary" onClick={toggleGame} disabled={game.isFinished}>
              {game.isPlaying ? <Pause size={17} /> : <Play size={17} />}
              {game.isPlaying ? "Pause demo" : "Start demo match"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={resetGame}>
              <RotateCcw size={16} /> Reset match
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
