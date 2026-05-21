import type { TextStyle } from 'react-native';

export const Typography = {
  display: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    lineHeight: 36,
  } as TextStyle,

  heading1: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    lineHeight: 30,
  } as TextStyle,

  heading2: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 26,
  } as TextStyle,

  heading3: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,

  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
  } as TextStyle,

  small: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    lineHeight: 18,
  } as TextStyle,

  button: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 16,
    letterSpacing: 0.3,
  } as TextStyle,

  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 20,
  } as TextStyle,
} as const;

export default Typography;
