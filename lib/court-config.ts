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
