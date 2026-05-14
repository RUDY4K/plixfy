'use client';

import type { Tile as TileData } from '../lib/moves';
import { getTileStyle, tileFontSize } from '../lib/constants';
import styles from '../puzzle-2048.module.css';

interface TileProps {
  tile: TileData;
}

/**
 * Position math: the boardWrap has 2.5cqw padding on each side, so the
 * tile layer is 95cqw wide. Four cells plus three 2.5cqw gaps fit there if
 * each cell is (95 − 7.5) / 4 = 21.875cqw. Slot stride = 21.875 + 2.5 =
 * 24.375cqw. Using `cqw` rather than `%` because CSS `translate(%)` is
 * relative to the element's own size, not the container's.
 */
const SLOT_CQW = 24.375;

export default function Tile({ tile }: TileProps) {
  const style = getTileStyle(tile.value);
  const tx = `translate(${tile.col * SLOT_CQW}cqw, ${tile.row * SLOT_CQW}cqw)`;

  const isHighTier = tile.value >= 512;

  return (
    <div
      className={`${styles.tile} ${tile.isNew ? styles.tileNew : ''} ${
        tile.isMerged ? styles.tileMerged : ''
      } ${isHighTier ? styles.glowWin : ''}`}
      style={{
        // Inline `transform` is what powers the slide transition; the CSS
        // animations use the --tx custom property so pop / merge effects keep
        // the tile in place.
        transform: tx,
        ['--tx' as string]: tx,
        background: style.bg,
        color: style.fg,
        fontSize: tileFontSize(tile.value),
        boxShadow: style.shadow ? `0 0 24px ${style.shadow}` : undefined,
      }}
    >
      {tile.value}
    </div>
  );
}
