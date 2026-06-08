import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { palette } from '../../theme/colors';
import type { LiveMapProps, MapMarker } from './LiveMap.types';
import { filterValidMarkers } from './mapUtils';

/**
 * Native canlı harita — react-native-webview içinde Leaflet + OpenStreetMap.
 * Ücretsiz/anahtarsız (Google Maps API anahtarı GEREKMEZ); Android dahil tüm
 * platformlarda web (LiveMap.web) ile aynı OSM görünümünü verir. Konum verisi
 * dışarıdan marker olarak gelir — bu bileşen veri kaynağına dokunmaz.
 */

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

/** Marker'ları WebView'deki Leaflet için JSON dizisine çevirir. */
function markersToJson(markers: MapMarker[]): string {
  const data = markers.map((m) => ({
    lat: m.latitude,
    lng: m.longitude,
    color: markerFill(m.kind),
    title: m.title ?? m.kind ?? 'Konum',
  }));
  // </script> kaçışı — başlık şehir adı olsa da güvenli tarafta kal.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const BASE_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;background:#0b0d10}</style>
</head>
<body>
<div id="map"></div>
<script>
  function post(t){ if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(t); } }
  try {
    var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([39.92, 32.85], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\\u00a9 OpenStreetMap', maxZoom: 19
    }).addTo(map);
    var layer = L.layerGroup().addTo(map);
    function render(markers){
      layer.clearLayers();
      var pts = [];
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        L.circleMarker([m.lat, m.lng], { radius: 9, color: '#050608', weight: 2, fillColor: m.color, fillOpacity: 0.95 })
          .bindTooltip(m.title, { permanent: false }).addTo(layer);
        pts.push([m.lat, m.lng]);
      }
      if (pts.length === 1) { map.setView(pts[0], 13); }
      else if (pts.length > 1) { map.fitBounds(L.latLngBounds(pts).pad(0.2)); }
    }
    window.__setMarkers = function(json){ try { render(JSON.parse(json)); } catch (e) { post('error'); } };
    map.whenReady(function(){ post('ready'); });
    render(__INITIAL_MARKERS__);
  } catch (e) { post('error'); }
</script>
</body>
</html>`;

export function LiveMap({ markers, style, height = 220, onMapReady, onMapError }: LiveMapProps) {
  const webRef = useRef<WebView>(null);
  const valid = useMemo(() => filterValidMarkers(markers), [markers]);

  // HTML yalnız ilk mount'ta üretilir (web LiveMap init-once deseni); sonraki
  // marker güncellemeleri injectJavaScript ile yapılır (reload/flicker yok).
  const html = useMemo(
    () => BASE_HTML.replace('__INITIAL_MARKERS__', markersToJson(valid)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca mount
    [],
  );

  useEffect(() => {
    const js = `window.__setMarkers && window.__setMarkers(${JSON.stringify(markersToJson(valid))}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [valid]);

  const onMessage = (e: WebViewMessageEvent) => {
    const t = e.nativeEvent.data;
    if (t === 'ready') onMapReady?.();
    else if (t === 'error') onMapError?.();
  };

  return (
    <View style={[styles.wrap, { height }, style]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        onMessage={onMessage}
        onError={() => onMapError?.()}
        onHttpError={() => onMapError?.()}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
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
  web: { flex: 1, backgroundColor: palette.surface },
});
