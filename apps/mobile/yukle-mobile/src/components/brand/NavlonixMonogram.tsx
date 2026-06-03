import Svg, { Path, Rect } from 'react-native-svg';
import { palette } from '../../theme/colors';

const VIEW_SIZE = 64;
const MARK_RX = VIEW_SIZE * 0.24;
const STROKE = 6.75;

const strokeProps = {
  stroke: '#FFFFFF',
  strokeWidth: STROKE,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

type Props = {
  size: number;
};

/** Turuncu yuvarlak kare + beyaz N/oklar — web NavlonixMonogram ile aynı geometri. */
export function NavlonixMonogram({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} fill="none" accessibilityElementsHidden>
      <Rect width={VIEW_SIZE} height={VIEW_SIZE} rx={MARK_RX} fill={palette.brand} />
      <Path d="M16 48 L16 21" {...strokeProps} />
      <Path d="M48 48 L48 21" {...strokeProps} />
      <Path d="M16 21 L48 48" {...strokeProps} />
      <Path d="M9 28 L16 19 L23 28" {...strokeProps} />
      <Path d="M41 28 L48 19 L55 28" {...strokeProps} />
    </Svg>
  );
}
