import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { palette } from '../../theme/colors';
import type { LiveMapProps } from './LiveMap.types';
import type { MapMarkerKind } from './LiveMap.types';
import { isGoogleMapsKeyConfigured } from './mapConfig';
import { computeMapRegion, filterValidMarkers } from './mapUtils';

function pinColor(kind: MapMarkerKind | undefined): string {
  switch (kind) {
    case 'driver':
      return palette.brand;
    case 'destination':
      return palette.gold;
    case 'origin':
      return palette.info;
    default:
      return palette.textSecondary;
  }
}

export function LiveMap({
  markers,
  center,
  style,
  height = 220,
  onMapReady,
  onMapError,
}: LiveMapProps) {
  const mapsAvailable = isGoogleMapsKeyConfigured();

  useEffect(() => {
    if (Platform.OS === 'android' && !mapsAvailable) {
      onMapError?.();
    }
  }, [mapsAvailable, onMapError]);

  const validMarkers = useMemo(() => filterValidMarkers(markers), [markers]);
  const region = useMemo(
    () => computeMapRegion(validMarkers, center),
    [validMarkers, center]
  );

  if (Platform.OS === 'android' && !mapsAvailable) {
    return null;
  }

  if (validMarkers.length === 0) {
    return null;
  }

  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

  return (
    <View style={[styles.wrap, { height }, style]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={provider}
        initialRegion={region}
        region={region}
        onMapReady={onMapReady}
      >
        {validMarkers.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            description={m.description}
            pinColor={pinColor(m.kind)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    backgroundColor: palette.surface,
  },
});
