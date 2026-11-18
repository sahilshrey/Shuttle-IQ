export type MatchFormat = "singles" | "doubles";

export type MatchFormatOption = {
  id: MatchFormat;
  title: string;
  description: string;
  playersPerSide: number;
};

export const MATCH_FORMATS: MatchFormatOption[] = [
  {
    id: "singles",
    title: "Singles",
    description: "One player per side",
    playersPerSide: 1,
  },
  {
    id: "doubles",
    title: "Doubles",
    description: "Two players per side",
    playersPerSide: 2,
  },
];

export type CourtEnvironmentId = "indoor-hall" | "outdoor" | "training-gym";

export type CourtEnvironmentOption = {
  id: CourtEnvironmentId;
  title: string;
  description: string;
};

export const COURT_ENVIRONMENTS: CourtEnvironmentOption[] = [
  {
    id: "indoor-hall",
    title: "Indoor hall",
    description: "Standard hall with overhead lighting",
  },
  {
    id: "outdoor",
    title: "Outdoor court",
    description: "Natural light, wind and changing conditions",
  },
  {
    id: "training-gym",
    title: "Training gym",
    description: "Multi-use sports hall or practice space",
  },
];

export const DEFAULT_MATCH_FORMAT: MatchFormat = "singles";
export const DEFAULT_COURT_ENVIRONMENT: CourtEnvironmentId = "indoor-hall";

export const COURT_DIMENSIONS = {
  lengthMeters: 13.40,
  doublesWidthMeters: 6.10,
  singlesWidthMeters: 5.18,
  shortServiceFromNetMeters: 1.98,
  doublesLongServiceInsideBoundaryMeters: 0.76,
  netHeightMeters: 1.524,
} as const;

export type MetricPoint = {
  x: number;
  y: number;
};

export type MetricRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type MetricCourtLine = {
  id: string;
  from: MetricPoint;
  to: MetricPoint;
  format?: MatchFormat;
};

export type MetricCourtGeometry = {
  corners: readonly MetricPoint[];
  lines: readonly MetricCourtLine[];
  netHeightMeters: number;
};

export function getCourtSinglesOffsetMeters(): number {
  return (COURT_DIMENSIONS.doublesWidthMeters - COURT_DIMENSIONS.singlesWidthMeters) / 2;
}

export function getCourtCorners(): readonly MetricPoint[] {
  return [
    { x: 0, y: 0 },
    { x: COURT_DIMENSIONS.lengthMeters, y: 0 },
    { x: COURT_DIMENSIONS.lengthMeters, y: COURT_DIMENSIONS.doublesWidthMeters },
    { x: 0, y: COURT_DIMENSIONS.doublesWidthMeters },
  ];
}

export function getCourtLines(format: MatchFormat): readonly MetricCourtLine[] {
  const { lengthMeters, doublesWidthMeters, shortServiceFromNetMeters, doublesLongServiceInsideBoundaryMeters } =
    COURT_DIMENSIONS;
  const singlesOffset = getCourtSinglesOffsetMeters();
  const singlesNearOffset = doublesWidthMeters - singlesOffset;
  const netX = lengthMeters / 2;
  const shortServiceLeft = netX - shortServiceFromNetMeters;
  const shortServiceRight = netX + shortServiceFromNetMeters;
  const centerY = doublesWidthMeters / 2;
  const doublesLongLeft = doublesLongServiceInsideBoundaryMeters;
  const doublesLongRight = lengthMeters - doublesLongServiceInsideBoundaryMeters;

  const lines: MetricCourtLine[] = [
    { id: "baseline-far", from: { x: 0, y: 0 }, to: { x: 0, y: doublesWidthMeters } },
    { id: "baseline-near", from: { x: lengthMeters, y: 0 }, to: { x: lengthMeters, y: doublesWidthMeters } },
    { id: "sideline-far", from: { x: 0, y: 0 }, to: { x: lengthMeters, y: 0 }, format: "doubles" },
    { id: "sideline-near", from: { x: 0, y: doublesWidthMeters }, to: { x: lengthMeters, y: doublesWidthMeters }, format: "doubles" },
    { id: "singles-sideline-far", from: { x: 0, y: singlesOffset }, to: { x: lengthMeters, y: singlesOffset }, format: "singles" },
    { id: "singles-sideline-near", from: { x: 0, y: singlesNearOffset }, to: { x: lengthMeters, y: singlesNearOffset }, format: "singles" },
    { id: "short-service-left", from: { x: shortServiceLeft, y: 0 }, to: { x: shortServiceLeft, y: doublesWidthMeters } },
    { id: "short-service-right", from: { x: shortServiceRight, y: 0 }, to: { x: shortServiceRight, y: doublesWidthMeters } },
    { id: "doubles-long-service-left", from: { x: doublesLongLeft, y: 0 }, to: { x: doublesLongLeft, y: doublesWidthMeters }, format: "doubles" },
    { id: "doubles-long-service-right", from: { x: doublesLongRight, y: 0 }, to: { x: doublesLongRight, y: doublesWidthMeters }, format: "doubles" },
    { id: "center-left", from: { x: 0, y: centerY }, to: { x: shortServiceLeft, y: centerY } },
    { id: "center-right", from: { x: shortServiceRight, y: centerY }, to: { x: lengthMeters, y: centerY } },
    { id: "net", from: { x: netX, y: 0 }, to: { x: netX, y: doublesWidthMeters } },
  ];
  return lines.filter((line) => !line.format || line.format === format);
}

export function getCourtGeometry(format: MatchFormat): MetricCourtGeometry {
  return {
    corners: getCourtCorners(),
    lines: getCourtLines(format),
    netHeightMeters: COURT_DIMENSIONS.netHeightMeters,
  };
}

export function metricToRenderPoint(
  point: MetricPoint,
  rect: MetricRect,
): MetricPoint {
  if (![point.x, point.y, rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
      rect.width <= 0 ||
      rect.height <= 0) {
    return { x: rect.left, y: rect.top };
  }

  const scale = Math.min(
    rect.width / COURT_DIMENSIONS.lengthMeters,
    rect.height / COURT_DIMENSIONS.doublesWidthMeters,
  );
  const renderedWidth = COURT_DIMENSIONS.lengthMeters * scale;
  const renderedHeight = COURT_DIMENSIONS.doublesWidthMeters * scale;
  const leftInset = rect.left + (rect.width - renderedWidth) / 2;
  const topInset = rect.top + (rect.height - renderedHeight) / 2;

  return {
    x: leftInset + point.x * scale,
    y: topInset + point.y * scale,
  };
}
