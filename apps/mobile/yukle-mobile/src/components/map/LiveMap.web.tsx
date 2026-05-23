import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../../theme/colors';
import type { LiveMapProps } from './LiveMap.types';
import type { MapMarker } from './LiveMap.types';
import { computeCenter, filterValidMarkers, isValidCoordinate } from './mapUtils';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© OpenStreetMap';

function markerFill(kind: MapMarker['kind']): string {
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        if (disposed || !containerRef.current) return;

        if (!mapRef.current) {
          const valid = filterValidMarkers(markers);
          const initial = computeCenter(valid, center);
          mapRef.current = L.map(containerRef.current, {
            zoomControl: true,
            attributionControl: true,
          }).setView([initial.latitude, initial.longitude], valid.length > 1 ? 10 : 12);

          L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(
            mapRef.current
          );
          layerRef.current = L.layerGroup().addTo(mapRef.current);
        }

        if (!readyRef.current) {
          readyRef.current = true;
          onMapReady?.();
        }
      } catch {
        onMapError?.();
      }
    };

    void init();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
        readyRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca mount
  }, []);

  useEffect(() => {
    const update = async () => {
      try {
        const L = await import('leaflet');
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) return;

        layer.clearLayers();
        const valid = filterValidMarkers(markers);

        for (const m of valid) {
          L.circleMarker([m.latitude, m.longitude], {
            radius: 9,
            color: '#050608',
            weight: 2,
            fillColor: markerFill(m.kind),
            fillOpacity: 0.95,
          })
            .bindTooltip(m.title ?? m.kind ?? 'Konum', { permanent: false })
            .addTo(layer);
        }

        if (valid.length === 1) {
          map.setView([valid[0].latitude, valid[0].longitude], 13);
        } else if (valid.length > 1) {
          const bounds = L.latLngBounds(valid.map((m) => [m.latitude, m.longitude] as [number, number]));
          map.fitBounds(bounds.pad(0.2));
        } else if (center && isValidCoordinate(center.latitude, center.longitude)) {
          map.setView([center.latitude, center.longitude], 11);
        }
      } catch {
        onMapError?.();
      }
    };

    void update();
  }, [markers, center, onMapError]);

  return (
    <View style={[styles.wrap, { height }, style]}>
      {createElement('div', {
        ref: (node: HTMLDivElement | null) => {
          containerRef.current = node;
        },
        style: {
          width: '100%',
          height: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: palette.surface,
        },
      })}
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
  },
});
