export type Point2D = {
  x: number;
  y: number;
};

export type Homography = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export const UNIT_COURT_CORNERS: readonly Point2D[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

function solveLinearSystem(rows: number[][]): number[] | null {
  const size = rows.length;

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivotRow][column])) {
        pivotRow = row;
      }
    }

    if (Math.abs(rows[pivotRow][column]) < 1e-10) return null;
    [rows[column], rows[pivotRow]] = [rows[pivotRow], rows[column]];

    const pivot = rows[column][column];
    for (let entry = column; entry <= size; entry += 1) {
      rows[column][entry] /= pivot;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = rows[row][column];
      for (let entry = column; entry <= size; entry += 1) {
        rows[row][entry] -= factor * rows[column][entry];
      }
    }
  }

  return rows.map((row) => row[size]);
}

export function solveHomography(
  source: readonly Point2D[],
  destination: readonly Point2D[],
): Homography | null {
  if (source.length !== 4 || destination.length !== 4) return null;

  const rows: number[][] = [];
  for (let index = 0; index < 4; index += 1) {
    const { x, y } = source[index];
    const { x: u, y: v } = destination[index];
    if (![x, y, u, v].every(Number.isFinite)) return null;

    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }

  const values = solveLinearSystem(rows);
  return values
    ? [values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7]]
    : null;
}

export function projectPoint(matrix: Homography, point: Point2D): Point2D | null {
  const denominator = matrix[6] * point.x + matrix[7] * point.y + 1;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-10) return null;

  const x = (matrix[0] * point.x + matrix[1] * point.y + matrix[2]) / denominator;
  const y = (matrix[3] * point.x + matrix[4] * point.y + matrix[5]) / denominator;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

export function isValidQuadrilateral(points: readonly Point2D[]): boolean {
  if (points.length !== 4 || points.some(({ x, y }) => !Number.isFinite(x) || !Number.isFinite(y))) {
    return false;
  }

  let turnDirection = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const cross =
      (next.x - current.x) * (afterNext.y - next.y) -
      (next.y - current.y) * (afterNext.x - next.x);
    if (Math.abs(cross) < 1e-6) return false;
    const direction = Math.sign(cross);
    if (turnDirection !== 0 && direction !== turnDirection) return false;
    turnDirection = direction;
  }

  const area = Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
  return area > 0.0001;
}
