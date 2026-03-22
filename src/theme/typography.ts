import { TextStyle } from 'react-native';
import { colors } from './colors';

export const ff = {
  faustinaSemi: 'Faustina_600SemiBold',
  crimson: 'CrimsonText_400Regular',
  crimsonSemi: 'CrimsonText_600SemiBold',
  crimsonBold: 'CrimsonText_700Bold',
} as const;

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
