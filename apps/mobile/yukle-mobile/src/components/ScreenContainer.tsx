import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import { screenRootStyle } from '../constants/layout';
import { useScreenInsets } from '../hooks/useScreenInsets';

type Props = ViewProps & {
  withTabBar?: boolean;
};

/** Full-screen root with status-bar safe top inset. */
export function ScreenContainer({ style, withTabBar, ...props }: Props) {
  const { edgeStyle } = useScreenInsets({ withTabBar });
  return <View style={[screenRootStyle, edgeStyle, style]} {...props} />;
}
