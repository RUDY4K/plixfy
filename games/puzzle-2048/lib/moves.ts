import { BOARD_SIZE } from './constants';

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export interface MergeOp {
  /** Source tile that survives and gets its value doubled after the slide. */
  keepId: number;
  /** Source tile that gets removed once the slide completes. */
  absorbId: number;
  newValue: number;
}

export interface MoveResult {
  tiles: Tile[];
  merges: MergeOp[];
  moved: boolean;
  scoreGain: number;
}

function rotateCoords(row: number, col: number, dir: Direction) {
  switch (dir) {
    case 'left':
      return { row, col };
    case 'right':
      return { row, col: BOARD_SIZE - 1 - col };
    case 'up':
      return { row: col, col: row };
    case 'down':
      return { row: col, col: BOARD_SIZE - 1 - row };
  }
}

function unrotateCoords(row: number, col: number, dir: Direction) {
  switch (dir) {
    case 'left':
      return { row, col };
    case 'right':
      return { row, col: BOARD_SIZE - 1 - col };
    case 'up':
      return { row: col, col: row };
    case 'down':
      return { row: BOARD_SIZE - 1 - col, col: row };
  }
}

/**
 * Compute the result of a move. The returned `tiles` array has merging pairs
 * sharing the same (row, col) — the UI animates that as both tiles sliding to
 * the merge cell. Call applyMerges() after the slide animation completes to
 * collapse pairs into a single doubled tile.
 */
export function move(tiles: Tile[], direction: Direction): MoveResult {
  const rotated = tiles.map((t) => {
    const r = rotateCoords(t.row, t.col, direction);
    return { ...t, row: r.row, col: r.col };
  });

  const byRow: Tile[][] = Array.from({ length: BOARD_SIZE }, () => []);
  for (const t of rotated) byRow[t.row].push(t);

  const newTiles: Tile[] = [];
  const merges: MergeOp[] = [];
  let moved = false;
  let scoreGain = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    const sorted = [...byRow[row]].sort((a, b) => a.col - b.col);
    let writeCol = 0;
    let i = 0;
    while (i < sorted.length) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (next && next.value === cur.value) {
        newTiles.push({ ...cur, row, col: writeCol });
        newTiles.push({ ...next, row, col: writeCol });
        merges.push({ keepId: cur.id, absorbId: next.id, newValue: cur.value * 2 });
        scoreGain += cur.value * 2;
        if (cur.col !== writeCol || next.col !== writeCol) moved = true;
        writeCol++;
        i += 2;
      } else {
        newTiles.push({ ...cur, row, col: writeCol });
        if (cur.col !== writeCol) moved = true;
        writeCol++;
        i += 1;
      }
    }
  }

  const final = newTiles.map((t) => {
    const r = unrotateCoords(t.row, t.col, direction);
    return { ...t, row: r.row, col: r.col, isNew: false, isMerged: false };
  });

  return { tiles: final, merges, moved, scoreGain };
}

export function applyMerges(tiles: Tile[], merges: MergeOp[]): Tile[] {
  if (merges.length === 0) return tiles.map((t) => ({ ...t, isMerged: false, isNew: false }));
  const absorbed = new Set(merges.map((m) => m.absorbId));
  const keepMap = new Map(merges.map((m) => [m.keepId, m.newValue] as const));
  return tiles
    .filter((t) => !absorbed.has(t.id))
    .map((t) => {
      const merged = keepMap.get(t.id);
      if (merged !== undefined) {
        return { ...t, value: merged, isMerged: true, isNew: false };
      }
      return { ...t, isMerged: false, isNew: false };
    });
}

interface IdGenerator {
  next(): number;
}

export function spawnTile(tiles: Tile[], idGen: IdGenerator): Tile | null {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const empty: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push({ row: r, col: c });
    }
  }
  if (empty.length === 0) return null;
  const pick = empty[Math.floor(Math.random() * empty.length)];
  return {
    id: idGen.next(),
    value: Math.random() < 0.9 ? 2 : 4,
    row: pick.row,
    col: pick.col,
    isNew: true,
  };
}

export function makeIdGen(start: number = 1): IdGenerator {
  let n = start;
  return {
    next: () => n++,
  };
}

export function initialTiles(idGen: IdGenerator): Tile[] {
  const out: Tile[] = [];
  for (let i = 0; i < 2; i++) {
    const t = spawnTile(out, idGen);
    if (t) out.push({ ...t, isNew: false });
  }
  return out;
}

export function isGameOver(tiles: Tile[]): boolean {
  if (tiles.length < BOARD_SIZE * BOARD_SIZE) return false;
  const grid: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(0)
  );
  for (const t of tiles) grid[t.row][t.col] = t.value;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (c + 1 < BOARD_SIZE && grid[r][c] === grid[r][c + 1]) return false;
      if (r + 1 < BOARD_SIZE && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}

export function reachedWin(tiles: Tile[], target: number): boolean {
  return tiles.some((t) => t.value === target);
}
