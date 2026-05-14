export const BOARD_SIZE = 4;
export const WIN_VALUE = 2048;

export const SLIDE_MS = 150;
export const MERGE_MS = 180;

export interface TileStyle {
  bg: string;
  fg: string;
  shadow?: string;
}

const FALLBACK: TileStyle = { bg: '#fef9c3', fg: '#1f2937', shadow: 'rgba(254,249,195,0.9)' };

export const TILE_COLORS: Record<number, TileStyle> = {
  2: { bg: '#fef3c7', fg: '#1f2937' },
  4: { bg: '#fde68a', fg: '#1f2937' },
  8: { bg: '#fb923c', fg: '#ffffff' },
  16: { bg: '#f97316', fg: '#ffffff' },
  32: { bg: '#ea580c', fg: '#ffffff' },
  64: { bg: '#dc2626', fg: '#ffffff' },
  128: { bg: '#eab308', fg: '#ffffff' },
  256: { bg: '#d97706', fg: '#ffffff' },
  512: { bg: '#facc15', fg: '#1f2937', shadow: 'rgba(250,204,21,0.4)' },
  1024: { bg: '#fde047', fg: '#1f2937', shadow: 'rgba(253,224,71,0.6)' },
  2048: { bg: '#fef08a', fg: '#1f2937', shadow: 'rgba(254,240,138,0.9)' },
};

export function getTileStyle(value: number): TileStyle {
  return TILE_COLORS[value] ?? FALLBACK;
}

export function tileFontSize(value: number): string {
  if (value < 100) return 'clamp(28px, 8vw, 56px)';
  if (value < 1000) return 'clamp(24px, 7vw, 48px)';
  if (value < 10000) return 'clamp(20px, 6vw, 38px)';
  return 'clamp(16px, 5vw, 30px)';
}
