/** docs/STYLE_GUIDE.md — Color Palette */
const palette = {
  bgPrimary: '#EADED0',
  bgAccent: '#C7AF94',
  greenBase: '#4E705E',
  greenAccent: '#08463D',
  redBase: '#6D3A3C',
  redAccent: '#361319',
  blueAccent: '#617891',
  textPrimary: '#110703',
  textMuted: '#4A4459',
  tabIconActive: '#EADED0',
  tabIconInactive: '#C7AF94',
  surface: '#FFFFFF',
} as const;

/** Canonical tokens + short aliases (`bg`, `green`, `text`, `red`) for legacy screens */
export const colors = {
  ...palette,
  bg: palette.bgPrimary,
  green: palette.greenBase,
  text: palette.textPrimary,
  red: palette.redBase,
} as const;
