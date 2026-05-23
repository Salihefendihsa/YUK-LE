import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme/spacing';
import { LiveMap } from './LiveMap';
import type { LiveMapProps } from './LiveMap.types';
import { filterValidMarkers } from './mapUtils';

type Props = LiveMapProps & {
  /** Harita gösterilemezse veya marker yoksa gösterilir */
  fallback?: ReactNode;
  /** Harita altında ek içerik (uzaklık özeti vb.) */
  footer?: ReactNode;
};

/**
 * Harita + nazik fallback: native key yoksa veya hata olursa metin kartına düşer.
 */
export function LiveMapPanel({ fallback, footer, markers, ...mapProps }: Props) {
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const valid = filterValidMarkers(markers);
  const showMap = !mapUnavailable && valid.length > 0;

  return (
    <View style={styles.root}>
      {showMap ? (
        <LiveMap
          {...mapProps}
          markers={markers}
          onMapError={() => setMapUnavailable(true)}
        />
      ) : null}
      {!showMap && fallback ? <View style={styles.fallback}>{fallback}</View> : null}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[2] },
  fallback: {},
  footer: { marginTop: spacing[1] },
});
