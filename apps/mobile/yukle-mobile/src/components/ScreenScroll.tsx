import type { ScrollViewProps } from 'react-native';
import { ScrollView } from 'react-native';
import { screenRootStyle } from '../constants/layout';
import { useScreenInsets } from '../hooks/useScreenInsets';

type Props = ScrollViewProps & {
  withTabBar?: boolean;
};

/** ScrollView root with status-bar top inset and scroll bottom inset (tab bar / home indicator). */
export function ScreenScroll({ style, contentContainerStyle, withTabBar, ...props }: Props) {
  const { edgeStyle, contentInset } = useScreenInsets({ withTabBar });
  return (
    <ScrollView
      style={[screenRootStyle, edgeStyle, style]}
      contentContainerStyle={[contentContainerStyle, contentInset]}
      {...props}
    />
  );
}
