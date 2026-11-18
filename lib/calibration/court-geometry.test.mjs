import assert from "node:assert/strict";
import test from "node:test";
import {
  COURT_DIMENSIONS,
  getCourtCorners,
  getCourtLines,
  metricToRenderPoint,
} from "../court-config.ts";
import {
  isValidOrderedCourt,
  projectPoint,
  solveHomography,
} from "./homography.ts";

test("official badminton dimensions are stored in metres", () => {
  assert.equal(COURT_DIMENSIONS.lengthMeters, 13.4);
  assert.equal(COURT_DIMENSIONS.doublesWidthMeters, 6.1);
  assert.equal(COURT_DIMENSIONS.singlesWidthMeters, 5.18);
  assert.equal(COURT_DIMENSIONS.shortServiceFromNetMeters, 1.98);
  assert.equal(COURT_DIMENSIONS.doublesLongServiceInsideBoundaryMeters, 0.76);
  assert.equal(COURT_DIMENSIONS.netHeightMeters, 1.524);
});

test("singles and doubles use the same official metric coordinate system", () => {
  assert.deepEqual(getCourtCorners(), [
    { x: 0, y: 0 },
    { x: 13.4, y: 0 },
    { x: 13.4, y: 6.1 },
    { x: 0, y: 6.1 },
  ]);

  const singles = getCourtLines("singles");
  const doubles = getCourtLines("doubles");
  assert.equal(singles.some((line) => line.id === "singles-sideline-far"), true);
  assert.equal(doubles.some((line) => line.id === "sideline-far"), true);

  const shortLeft = singles.find((line) => line.id === "short-service-left");
  assert.ok(Math.abs(shortLeft.from.x - 4.72) < 1e-10);
  assert.ok(Math.abs(shortLeft.to.x - 4.72) < 1e-10);

  const longLeft = doubles.find((line) => line.id === "doubles-long-service-left");
  assert.equal(longLeft.from.x, 0.76);
  assert.equal(longLeft.to.x, 0.76);
});

test("metric-to-render conversion uses one uniform scale", () => {
  const rect = { left: 20, top: 13, width: 600, height: 274 };
  const origin = metricToRenderPoint({ x: 0, y: 0 }, rect);
  const net = metricToRenderPoint({ x: 6.7, y: 3.05 }, rect);
  const farCorner = metricToRenderPoint({ x: 13.4, y: 6.1 }, rect);

  assert.ok(Math.abs((net.x - origin.x) / (farCorner.x - origin.x) - 6.7 / 13.4) < 1e-10);
  assert.ok(Math.abs((net.y - origin.y) / (farCorner.y - origin.y) - 3.05 / 6.1) < 1e-10);
});

test("metric homography maps official corners and rejects invalid quads", () => {
  const source = getCourtCorners();
  const destination = [
    { x: 0.15, y: 0.25 },
    { x: 0.82, y: 0.18 },
    { x: 0.74, y: 0.88 },
    { x: 0.22, y: 0.92 },
  ];
  const matrix = solveHomography(source, destination);

  assert.ok(matrix);
  assert.ok(isValidOrderedCourt(destination));
  const projectedNet = projectPoint(matrix, { x: 6.7, y: 3.05 });
  assert.ok(projectedNet);

  assert.equal(solveHomography(source, [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
    { x: 0.5, y: 0.5 },
  ]), null);
});

test("camera aspect ratio conversion remains within the display rect", () => {
  const portrait = { left: -777.777, top: 0, width: 2177.777, height: 1225 };
  const point = metricToRenderPoint({ x: 6.7, y: 3.05 }, portrait);
  assert.ok(point.x >= portrait.left);
  assert.ok(point.x <= portrait.left + portrait.width);
  assert.ok(point.y >= portrait.top);
  assert.ok(point.y <= portrait.top + portrait.height);
});
