export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 720;

export const SKY_TOP = 0x0f172a;
export const SKY_BOTTOM = 0x1e293b;
export const ACCENT = 0x4ade80;
export const ACCENT_DARK = 0x16a34a;
export const BIRD_BODY = 0xfde047;
export const BIRD_BEAK = 0xf97316;
export const BIRD_OUTLINE = 0x1f2937;
export const PIPE_FILL = 0x22c55e;
export const PIPE_EDGE = 0x14532d;
export const GROUND_FILL = 0x422006;
export const GROUND_TOP = 0x7c2d12;

export const GRAVITY = 1400;
export const FLAP_VELOCITY = -420;
export const PIPE_SPEED_START = 200;
export const PIPE_SPEED_MAX = 360;
export const PIPE_GAP_START = 180;
export const PIPE_GAP_MIN = 120;
export const PIPE_SPAWN_MS = 1500;
export const PIPE_SPAWN_MIN_MS = 950;
export const GROUND_HEIGHT = 80;

export const TEXTURE = {
  bird: 'fh-bird',
  pipe: 'fh-pipe',
  ground: 'fh-ground',
  pixel: 'fh-pixel',
} as const;
