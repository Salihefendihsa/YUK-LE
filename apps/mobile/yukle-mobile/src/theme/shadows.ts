import { Platform } from 'react-native';
import { palette } from './colors';

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
      elevation: 2,
    },
    android: { elevation: 2 },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 12,
      elevation: 6,
    },
    android: { elevation: 6 },
    default: {},
  }),
  brand: Platform.select({
    ios: {
      shadowColor: palette.brand,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    android: { elevation: 8 },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.42,
      shadowRadius: 28,
      elevation: 10,
    },
    android: { elevation: 10 },
    default: {},
  }),
};
