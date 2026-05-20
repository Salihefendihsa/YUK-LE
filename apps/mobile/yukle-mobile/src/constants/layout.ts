import { Platform, type ViewStyle } from 'react-native';
import { Colors } from './colors';

export const screenRootStyle: ViewStyle = Platform.select({
  web: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: Colors.bgDark,
  },
  default: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
}) as ViewStyle;
