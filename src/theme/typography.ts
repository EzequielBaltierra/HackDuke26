import { TextStyle } from 'react-native';
import { colors } from './colors';

export const ff = {
  faustinaSemi: 'Faustina_600SemiBold',
  crimson: 'CrimsonText_400Regular',
  crimsonSemi: 'CrimsonText_600SemiBold',
  crimsonBold: 'CrimsonText_700Bold',
} as const;

/** @deprecated Use `ff` — kept for login, FactCard, leaderboard, etc. */
export const fontFamily = ff;

export const textStyles = {
  titleHeaderAccent: {
    fontFamily: ff.faustinaSemi,
    fontSize: 32,
    color: colors.redAccent,
    letterSpacing: -0.5,
  } as TextStyle,
  postTitle: {
    fontFamily: ff.crimsonBold,
    fontSize: 18,
    color: colors.textPrimary,
  } as TextStyle,
  postLocation: {
    fontFamily: ff.crimsonBold,
    fontSize: 16,
    color: colors.textPrimary,
  } as TextStyle,
  postDescription: {
    fontFamily: ff.crimson,
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  } as TextStyle,
  vibeTag: {
    fontFamily: ff.crimsonBold,
    fontSize: 12,
    color: colors.textMuted,
  } as TextStyle,
  userName: {
    fontFamily: ff.crimsonSemi,
    fontSize: 24,
    color: colors.textPrimary,
  } as TextStyle,
  userPoints: {
    fontFamily: ff.crimson,
    fontSize: 22,
    color: colors.textPrimary,
  } as TextStyle,
  duration: {
    fontFamily: ff.crimsonSemi,
    fontSize: 20,
    color: colors.textPrimary,
  } as TextStyle,
  points: {
    fontFamily: ff.crimson,
    fontSize: 19,
    color: colors.greenBase,
  } as TextStyle,
} as const;

/** Semantic groups for screens that predate `textStyles` naming */
export const type = {
  titleHeaderAccent: textStyles.titleHeaderAccent,
  postTitle: textStyles.postTitle,
  postDescription: textStyles.postDescription,
  quickFacts: {
    fontFamily: ff.crimsonBold,
    fontSize: 48,
    color: colors.redAccent,
  } as TextStyle,
} as const;

/** Optional feed-card presets (re-export for `src/theme/index`) */
export const typeCard = {
  discoveryTitle: {
    fontFamily: ff.crimsonBold,
    fontSize: 24,
    color: colors.redAccent,
  } as TextStyle,
  discoveryCaption: {
    fontFamily: ff.crimson,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  } as TextStyle,
  expeditionTitle: {
    fontFamily: ff.crimsonBold,
    fontSize: 22,
    color: colors.redAccent,
  } as TextStyle,
  expeditionDescription: {
    fontFamily: ff.crimson,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
  } as TextStyle,
  userRowName: textStyles.userName,
  userRowPoints: textStyles.userPoints,
  meta: {
    fontFamily: ff.crimson,
    fontSize: 13,
    color: colors.redBase,
    opacity: 0.85,
  } as TextStyle,
  vibeChip: {
    fontFamily: ff.crimsonBold,
    fontSize: 13,
    color: colors.textMuted,
  } as TextStyle,
} as const;
