import assert from "node:assert/strict";
import test from "node:test";
import {
  getObjectFitCoverRect,
  isValidOrderedCourt,
  mapClientPointToVideo,
  mapStagePointToVideo,
  mapVideoPointToStage,
} from "./homography.ts";

test("cover mapping follows the visible crop for portrait video in a landscape stage", () => {
  const display = getObjectFitCoverRect(1080, 1920, 1280, 720);

  assert.equal(display.left, 0);
  assert.ok(display.top < 0);
  assert.ok(display.height > 720);
  assert.ok(Math.abs(display.top + 777.7777778) < 0.001);

  const topEdge = mapClientPointToVideo(640, 0, { left: 20, top: 30, width: 1280, height: 720 }, display);
  const bottomEdge = mapClientPointToVideo(640, 720, { left: 20, top: 30, width: 1280, height: 720 }, display);
  assert.ok(topEdge.y > 0 && topEdge.y < 0.5);
  assert.ok(bottomEdge.y > 0.5 && bottomEdge.y < 1);
});

test("video and displayed-stage point transforms round-trip through cropping", () => {
  const display = getObjectFitCoverRect(1080, 1920, 1280, 720);
  const original = { x: 0.42, y: 0.58 };
  const stagePoint = mapVideoPointToStage(original, display);
  const restored = mapStagePointToVideo(
    { x: stagePoint.x / 1280, y: stagePoint.y / 720 },
    { width: 1280, height: 720 },
    display,
  );

  assert.ok(Math.abs(restored.x - original.x) < 1e-10);
  assert.ok(Math.abs(restored.y - original.y) < 1e-10);
});

test("ordered court geometry rejects reversed, crossed, and degenerate points", () => {
  assert.equal(
    isValidOrderedCourt([
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.12 },
      { x: 0.85, y: 0.9 },
      { x: 0.15, y: 0.88 },
    ]),
    true,
  );
  assert.equal(
    isValidOrderedCourt([
      { x: 0.1, y: 0.1 },
      { x: 0.15, y: 0.88 },
      { x: 0.85, y: 0.9 },
      { x: 0.9, y: 0.12 },
    ]),
    false,
  );
  assert.equal(
    isValidOrderedCourt([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ]),
    false,
  );
  assert.equal(
    isValidOrderedCourt([
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 0.5 },
    ]),
    false,
  );
});
