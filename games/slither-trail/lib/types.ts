export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Cell {
  x: number;
  y: number;
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return OPPOSITE[a] === b;
}

export function applyDirection(cell: Cell, dir: Direction): Cell {
  switch (dir) {
    case 'up':
      return { x: cell.x, y: cell.y - 1 };
    case 'down':
      return { x: cell.x, y: cell.y + 1 };
    case 'left':
      return { x: cell.x - 1, y: cell.y };
    case 'right':
      return { x: cell.x + 1, y: cell.y };
  }
}
