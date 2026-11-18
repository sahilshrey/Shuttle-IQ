import {
  isValidOrderedCourt,
  isValidQuadrilateral,
  solveHomography,
  type Point2D,
} from "./homography.ts";
import { getCourtCorners } from "../court-config.ts";

export type CourtDetectionResult =
  | { detected: true; corners: readonly Point2D[]; confidence: number }
  | { detected: false; corners: []; confidence: number; reason: string };

type Line = { rho: number; theta: number; strength: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function orderCourtCorners(points: readonly Point2D[]): Point2D[] | null {
  if (points.length !== 4) return null;

  const center = points.reduce(
    (sum, point) => ({ x: sum.x + point.x / 4, y: sum.y + point.y / 4 }),
    { x: 0, y: 0 },
  );
  const ordered = [...points].sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });
  if (!isValidOrderedCourt(ordered)) return null;

  const topLeft = ordered.reduce((best, point) => point.x + point.y < best.x + best.y ? point : best);
  const topRight = ordered.reduce((best, point) => point.x - point.y > best.x - best.y ? point : best);
  const bottomRight = ordered.reduce((best, point) => point.x + point.y > best.x + best.y ? point : best);
  const bottomLeft = ordered.reduce((best, point) => point.y - point.x > best.y - best.x ? point : best);
  const result = [topLeft, topRight, bottomRight, bottomLeft];

  return isValidOrderedCourt(result) && isValidQuadrilateral(result) ? result : null;
}

function lineIntersection(a: Line, b: Line): Point2D | null {
  const cosA = Math.cos(a.theta);
  const sinA = Math.sin(a.theta);
  const cosB = Math.cos(b.theta);
  const sinB = Math.sin(b.theta);
  const determinant = cosA * sinB - cosB * sinA;
  if (Math.abs(determinant) < 0.001) return null;

  const x = (a.rho * sinB - b.rho * sinA) / determinant;
  const y = (cosA * b.rho - cosB * a.rho) / determinant;
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function polygonArea(points: readonly Point2D[]) {
  return Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
}

function perimeterEdgeSupport(
  points: readonly Point2D[],
  edgeMask: Uint8Array,
  width: number,
  height: number,
) {
  let supported = 0;
  let tested = 0;

  for (let side = 0; side < 4; side += 1) {
    const start = points[side];
    const end = points[(side + 1) % 4];
    for (let step = 0; step <= 24; step += 1) {
      const fraction = step / 24;
      const x = Math.round(start.x * width + (end.x - start.x) * width * fraction);
      const y = Math.round(start.y * height + (end.y - start.y) * height * fraction);
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      tested += 1;
      if (edgeMask[y * width + x]) supported += 1;
    }
  }

  return tested > 0 ? supported / tested : 0;
}

export function detectCourtCornersFromImageData(
  image: ImageData,
  widthHint = image.width,
  heightHint = image.height,
): CourtDetectionResult {
  const sourceWidth = image.width;
  const sourceHeight = image.height;
  const maxWidth = 360;
  const scale = Math.min(1, maxWidth / sourceWidth);
  const width = Math.max(120, Math.round(sourceWidth * scale));
  const height = Math.max(120, Math.round(sourceHeight * scale));
  if (widthHint <= 0 || heightHint <= 0) {
    return { detected: false, corners: [], confidence: 0, reason: "Invalid frame dimensions." };
  }

  const gray = new Float32Array(width * height);
  const sx = sourceWidth / width;
  const sy = sourceHeight / height;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.min(sourceWidth - 1, Math.floor(x * sx));
      const sourceY = Math.min(sourceHeight - 1, Math.floor(y * sy));
      const index = (sourceY * sourceWidth + sourceX) * 4;
      gray[y * width + x] =
        0.299 * image.data[index] +
        0.587 * image.data[index + 1] +
        0.114 * image.data[index + 2];
    }
  }

  const sobel = new Float32Array(width * height);
  const edgeMask = new Uint8Array(width * height);
  const magnitudes: number[] = [];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const topLeft = gray[(y - 1) * width + x - 1];
      const top = gray[(y - 1) * width + x];
      const topRight = gray[(y - 1) * width + x + 1];
      const left = gray[y * width + x - 1];
      const right = gray[y * width + x + 1];
      const bottomLeft = gray[(y + 1) * width + x - 1];
      const bottom = gray[(y + 1) * width + x];
      const bottomRight = gray[(y + 1) * width + x + 1];
      const gx = -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
      const gy = -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      sobel[y * width + x] = magnitude;
      magnitudes.push(magnitude);
    }
  }

  magnitudes.sort((a, b) => a - b);
  const threshold = Math.max(55, magnitudes[Math.floor(magnitudes.length * 0.82)] ?? 55);
  for (let index = 0; index < edgeMask.length; index += 1) {
    if (sobel[index] >= threshold) edgeMask[index] = 1;
  }

  const thetas = 180;
  const maxRho = Math.ceil(Math.sqrt(width * width + height * height));
  const rhoCount = maxRho * 2 + 1;
  const accumulator = new Uint16Array(thetas * rhoCount);
  const cosines = new Float32Array(thetas);
  const sines = new Float32Array(thetas);
  for (let thetaIndex = 0; thetaIndex < thetas; thetaIndex += 1) {
    const theta = (thetaIndex * Math.PI) / thetas;
    cosines[thetaIndex] = Math.cos(theta);
    sines[thetaIndex] = Math.sin(theta);
  }

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if (!edgeMask[y * width + x]) continue;
      for (let thetaIndex = 0; thetaIndex < thetas; thetaIndex += 1) {
        const rho = Math.round(x * cosines[thetaIndex] + y * sines[thetaIndex]) + maxRho;
        accumulator[thetaIndex * rhoCount + rho] += 1;
      }
    }
  }

  const peaks: Line[] = [];
  for (let thetaIndex = 0; thetaIndex < thetas; thetaIndex += 1) {
    for (let rhoIndex = 0; rhoIndex < rhoCount; rhoIndex += 1) {
      const strength = accumulator[thetaIndex * rhoCount + rhoIndex];
      if (strength < 8) continue;
      let isPeak = true;
      for (let dt = -5; dt <= 5 && isPeak; dt += 1) {
        for (let dr = -7; dr <= 7; dr += 1) {
          const nt = thetaIndex + dt;
          const nr = rhoIndex + dr;
          if (nt < 0 || nt >= thetas || nr < 0 || nr >= rhoCount) continue;
          if (accumulator[nt * rhoCount + nr] > strength) {
            isPeak = false;
            break;
          }
        }
      }
      if (!isPeak) continue;
      const theta = (thetaIndex * Math.PI) / thetas;
      const rho = rhoIndex - maxRho;
      peaks.push({ theta, rho, strength });
    }
  }

  peaks.sort((a, b) => b.strength - a.strength);
  const lines: Line[] = [];
  for (const peak of peaks) {
    const isDuplicate = lines.some((line) => {
      const angleDifference = Math.abs(
        Math.atan2(Math.sin(peak.theta - line.theta), Math.cos(peak.theta - line.theta)),
      );
      const rhoDifference = Math.abs(peak.rho - line.rho);
      return angleDifference < 0.09 && rhoDifference < 12;
    });
    if (!isDuplicate) lines.push(peak);
    if (lines.length === 12) break;
  }

  if (lines.length < 4) {
    return { detected: false, corners: [], confidence: 0, reason: "Not enough court boundary lines were found." };
  }

  const rawCandidates: Point2D[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const intersection = lineIntersection(lines[i], lines[j]);
      if (!intersection) continue;
      if (intersection.x < -width * 0.15 || intersection.x > width * 1.15) continue;
      if (intersection.y < -height * 0.15 || intersection.y > height * 1.15) continue;

      const normalized = { x: intersection.x / width, y: intersection.y / height };
      const duplicate = rawCandidates.some(
        (candidate) =>
          Math.abs(candidate.x - normalized.x) * width < 12 &&
          Math.abs(candidate.y - normalized.y) * height < 12,
      );
      if (!duplicate) rawCandidates.push(normalized);
    }
  }

  let best: { corners: Point2D[]; confidence: number } | null = null;
  for (let a = 0; a < rawCandidates.length; a += 1) {
    for (let b = a + 1; b < rawCandidates.length; b += 1) {
      for (let c = b + 1; c < rawCandidates.length; c += 1) {
        for (let d = c + 1; d < rawCandidates.length; d += 1) {
          const ordered = orderCourtCorners([
            rawCandidates[a],
            rawCandidates[b],
            rawCandidates[c],
            rawCandidates[d],
          ]);
          if (!ordered) continue;

          const area = polygonArea(ordered);
          if (area < 0.08 || area > 0.72) continue;

          const widths = [
            Math.hypot(ordered[1].x - ordered[0].x, ordered[1].y - ordered[0].y),
            Math.hypot(ordered[2].x - ordered[3].x, ordered[2].y - ordered[3].y),
          ];
          const heights = [
            Math.hypot(ordered[3].x - ordered[0].x, ordered[3].y - ordered[0].y),
            Math.hypot(ordered[2].x - ordered[1].x, ordered[2].y - ordered[1].y),
          ];
          const widthRatio = Math.min(...widths) / Math.max(...widths);
          const heightRatio = Math.min(...heights) / Math.max(...heights);
          if (widthRatio < 0.35 || heightRatio < 0.35) continue;

          const support = perimeterEdgeSupport(ordered, edgeMask, width, height);
          const homography = solveHomography(getCourtCorners(), ordered);
          if (!homography) continue;

          const areaEvidence = clamp((area - 0.08) / 0.34, 0, 1);
          const shapeEvidence = (widthRatio + heightRatio) / 2;
          const confidence = Math.round(clamp(
            35 * support +
            25 * areaEvidence +
            25 * shapeEvidence +
            15 * Math.min(lines.length / 8, 1),
            0,
            99,
          ));

          if (!best || confidence > best.confidence) {
            best = { corners: ordered, confidence };
          }
        }
      }
    }
  }

  if (!best || best.confidence < 58) {
    return {
      detected: false,
      corners: [],
      confidence: best?.confidence ?? 0,
      reason: "A court boundary could not be detected reliably.",
    };
  }

  return { detected: true, corners: best.corners, confidence: best.confidence };
}

export async function detectCourtFromVideo(
  video: HTMLVideoElement,
): Promise<CourtDetectionResult> {
  if (!video.videoWidth || !video.videoHeight) {
    return { detected: false, corners: [], confidence: 0, reason: "The camera frame is not ready." };
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return { detected: false, corners: [], confidence: 0, reason: "Frame analysis is unavailable in this browser." };
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return detectCourtCornersFromImageData(image);
}
