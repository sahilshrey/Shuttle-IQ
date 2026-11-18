import assert from "node:assert/strict";
import test from "node:test";
import {
  detectCourtCornersFromImageData,
  orderCourtCorners,
} from "./detect-court.ts";

test("court corner ordering produces a clockwise four-corner quad", () => {
  const ordered = orderCourtCorners([
    { x: 0.82, y: 0.72 },
    { x: 0.12, y: 0.64 },
    { x: 0.78, y: 0.18 },
    { x: 0.18, y: 0.22 },
  ]);

  assert.deepEqual(ordered, [
    { x: 0.18, y: 0.22 },
    { x: 0.78, y: 0.18 },
    { x: 0.82, y: 0.72 },
    { x: 0.12, y: 0.64 },
  ]);
});

test("synthetic rectangular court edges are detected from real edge data", () => {
  const width = 240;
  const height = 160;
  const data = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = 18;
      data[index + 1] = 90;
      data[index + 2] = 52;
      data[index + 3] = 255;
    }
  }

  const left = 40;
  const right = 200;
  const top = 35;
  const bottom = 125;
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left - 1; x <= left + 1; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = 235;
    }
    for (let x = right - 1; x <= right + 1; x += 1) {
      const index = (y * width + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = 235;
    }
  }
  for (let x = left; x <= right; x += 1) {
    for (let y = top - 1; y <= top + 1; y += 1) {
      const index = (y * width + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = 235;
    }
    for (let y = bottom - 1; y <= bottom + 1; y += 1) {
      const index = (y * width + x) * 4;
      data[index] = data[index + 1] = data[index + 2] = 235;
    }
  }

  const image = { width, height, data };
  const result = detectCourtCornersFromImageData(image);

  assert.equal(result.detected, true);
  assert.ok(result.confidence >= 58);
  assert.equal(result.corners.length, 4);
});
