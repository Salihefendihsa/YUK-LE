import type { StyleProp, ViewStyle } from 'react-native';

export type MapMarkerKind = 'driver' | 'destination' | 'origin' | 'default';

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  kind?: MapMarkerKind;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type LiveMapProps = {
  markers: MapMarker[];
  center?: MapCoordinate;
  style?: StyleProp<ViewStyle>;
  /** Harita yüksekliği (px) */
  height?: number;
  onMapReady?: () => void;
  /** Harita yüklenemediğinde (native key yok / tile hatası) */
  onMapError?: () => void;
};
