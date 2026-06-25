/**
 * font.ts — LEGACY `font` + `fontSize` (53 ekran ishlatadi).
 * Shrift nomlari tokens.ts'dan keladi. `fontSize` raqamli shkala o'zgarmagan.
 */
import { tokens } from './tokens';

export const fontSize = {
  10: 12,
  11: 13,
  12: 14,
  13: 15,
  14: 16,
  15: 17,
  16: 18,
  17: 19,
  18: 20,
  19: 21,
  20: 22,
  21: 23,
  22: 24,
  23: 25,
};

export const font = {
  bold: tokens.font.bold,
  light: tokens.font.light,
  medium: tokens.font.medium,
  regular: tokens.font.regular,
  thin: tokens.font.thin,
};
