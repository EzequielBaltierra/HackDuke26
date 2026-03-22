import { TextStyle } from 'react-native';
import { colors } from './colors';

/** Loaded via `useFonts` in `app/_layout.tsx` — must match Google Font export names */
export const fontFamily = {
  title: 'Faustina_600SemiBold',
  crimson: 'CrimsonText_400Regular',
  crimsonSemi: 'CrimsonText_600SemiBold',
  crimsonBold: 'CrimsonText_700Bold',
} as const;

/**
 * Design-spec sizes (pt). On narrow phones, hero lines use `adjustsFontSizeToFit` or slightly smaller `fontSize` where noted.
 */
export const type = {
  /** Title/Header — Faustina Semibold 64, foundational red */
  titleHeader: {
    fontFamily: fontFamily.title,
    fontSize: 64,
    color: colors.red,
  } as TextStyle,

  /** Title/Header accent — Faustina Semibold 64, red accent */
  titleHeaderAccent: {
    fontFamily: fontFamily.title,
    fontSize: 64,
    color: colors.redAccent,
  } as TextStyle,

  /** Stack / tab titles (nav bar): Faustina scaled for mobile chrome */
  navTitle: {
    fontFamily: fontFamily.title,
    fontSize: 22,
    color: colors.redAccent,
  } as TextStyle,

  /** Post title — Crimson Bold 36 */
  postTitle: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 36,
    color: colors.text,
  } as TextStyle,

  /** Post location — Crimson Bold 32 */
  postLocation: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 32,
    color: colors.text,
  } as TextStyle,

  /** Post description — Crimson Regular 32 */
  postDescription: {
    fontFamily: fontFamily.crimson,
    fontSize: 32,
    color: colors.text,
  } as TextStyle,

  /** Post vibe-tag — Crimson Bold 24 */
  postVibeTag: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 24,
    color: colors.vibeTag,
  } as TextStyle,

  /** Expedition user name — Crimson Semibold 48 */
  expeditionUserName: {
    fontFamily: fontFamily.crimsonSemi,
    fontSize: 48,
    color: colors.text,
  } as TextStyle,

  /** Points next to user — Crimson Regular 45 */
  expeditionUserPoints: {
    fontFamily: fontFamily.crimson,
    fontSize: 45,
    color: colors.greenAccent,
  } as TextStyle,

  /** Expedition duration — Crimson Semibold 40 */
  expeditionDuration: {
    fontFamily: fontFamily.crimsonSemi,
    fontSize: 40,
    color: colors.text,
  } as TextStyle,

  /** Expedition points line — Crimson Regular 38 */
  expeditionPoints: {
    fontFamily: fontFamily.crimson,
    fontSize: 38,
    color: colors.green,
  } as TextStyle,

  /** Quick facts heading — Crimson Bold 48 */
  quickFacts: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 48,
    color: colors.redAccent,
  } as TextStyle,

  /** Feed toggle segment (mobile-friendly) */
  feedToggle: {
    fontFamily: fontFamily.crimsonSemi,
    fontSize: 17,
  } as TextStyle,
} as const;

/** Card list density: same families, smaller sizes for feed rows */
export const typeCard = {
  discoveryTitle: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 24,
    color: colors.redAccent,
  } as TextStyle,
  discoveryCaption: {
    fontFamily: fontFamily.crimson,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,
  expeditionTitle: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 22,
    color: colors.redAccent,
  } as TextStyle,
  expeditionDescription: {
    fontFamily: fontFamily.crimson,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  } as TextStyle,
  userRowName: {
    fontFamily: fontFamily.crimsonSemi,
    fontSize: 18,
    color: colors.text,
  } as TextStyle,
  userRowPoints: {
    fontFamily: fontFamily.crimson,
    fontSize: 16,
    color: colors.greenAccent,
  } as TextStyle,
  meta: {
    fontFamily: fontFamily.crimson,
    fontSize: 13,
    color: colors.red,
    opacity: 0.85,
  } as TextStyle,
  vibeChip: {
    fontFamily: fontFamily.crimsonBold,
    fontSize: 13,
    color: colors.vibeTag,
  } as TextStyle,
} as const;
