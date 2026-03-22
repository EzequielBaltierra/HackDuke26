/**
 * Root color system — matches design palette (Figma + style guide).
 * Use these tokens instead of raw hex so the app does not depend on opening Figma.
 */
export const colors = {
  /** Background foundational */
  bg: '#EADED0',
  /** Background accent / highlighted surfaces */
  bgAccent: '#C7AF94',
  /** Base green foundational */
  green: '#4E705E',
  /** Base green accent / highlight (borders, focus, emphasis) */
  greenAccent: '#08463D',
  /** Base red foundational */
  red: '#6D3A3C',
  /** Base red accent / highlight */
  redAccent: '#361319',
  /** Blue accent (secondary UI, search, links) */
  blueAccent: '#617891',
  /** Default text */
  text: '#110703',
  /** Post / expedition vibe tags */
  vibeTag: '#4A4459',
  /** Surface on sand (cards) */
  surface: '#FFFFFF',
} as const;

export type ColorName = keyof typeof colors;
