import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { palette } from '../../theme/colors';

/**
 * Native konum seçici — react-native-webview içinde Leaflet + OpenStreetMap.
 * Salt-gösterim `LiveMap.native`'ten ayrıdır: burada sürüklenebilir/tıklanabilir
 * tek bir pin vardır; kullanıcı haritaya dokunup ya da pin'i sürükleyerek tam
 * koordinatı belirler. Seçim `postMessage({lat,lng})` ile RN'e iletilir.
 * Anahtarsız/ücretsiz (Google Maps API anahtarı gerekmez).
 */

export type PickerCoordinate = { latitude: number; longitude: number };

type MapPickerProps = {
  /** Mevcut pin konumu (her zaman tanımlı). */
  value: PickerCoordinate;
  /** Şehir merkezi; değişince (şehir/ilçe seçimi) harita buraya yeniden ortalanır. */
  center: PickerCoordinate;
  onChange: (c: PickerCoordinate) => void;
  kind?: 'origin' | 'destination';
  /** İlk açılış zoom'u — şehir seçili değilken geniş (ülke), seçiliyken yakın. */
  initialZoom?: number;
  height?: number;
};

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const centerKey = (c: PickerCoordinate) => `${c.latitude},${c.longitude}`;

function pinColor(kind?: 'origin' | 'destination'): string {
  return kind === 'destination' ? palette.gold : palette.info;
}

function buildHtml(value: PickerCoordinate, color: string, zoom: number): string {
  return `<!DOCTYPE html>
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
  function emit(ll){ post(JSON.stringify({ lat: ll.lat, lng: ll.lng })); }
  try {
    var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${value.latitude}, ${value.longitude}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\\u00a9 OpenStreetMap', maxZoom: 19
    }).addTo(map);
    var icon = L.divIcon({
      className: 'pin',
      html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #050608;box-shadow:0 0 0 2px rgba(255,255,255,0.35)"></span>',
      iconSize: [18, 18], iconAnchor: [9, 9]
    });
    var marker = L.marker([${value.latitude}, ${value.longitude}], { draggable: true, icon: icon }).addTo(map);
    marker.on('dragend', function(){ emit(marker.getLatLng()); });
    map.on('click', function(e){ marker.setLatLng(e.latlng); emit(e.latlng); });
    window.__setPin = function(lat, lng){ marker.setLatLng([lat, lng]); };
    window.__setView = function(lat, lng){ map.setView([lat, lng], 13); };
    map.whenReady(function(){ post('ready'); });
  } catch (e) { post('error'); }
</script>
</body>
</html>`;
}

export function MapPicker({ value, center, onChange, kind, initialZoom = 13, height = 240 }: MapPickerProps) {
  const webRef = useRef<WebView>(null);
  const onChangeRef = useRef(onChange);
  const prevCenterRef = useRef<string>(centerKey(center));
  onChangeRef.current = onChange;

  const color = pinColor(kind);

  // HTML yalnız ilk mount'ta üretilir (LiveMap.native deseni); sonraki güncellemeler
  // injectJavaScript ile yapılır — reload/flicker yok.
  const html = useMemo(
    () => buildHtml(value, color, initialZoom),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca mount
    [],
  );

  // Dışarıdan gelen value değişince pin'i senkronla (idempotent — kullanıcı sürüklemesinde no-op).
  useEffect(() => {
    const js = `window.__setPin && window.__setPin(${value.latitude}, ${value.longitude}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [value.latitude, value.longitude]);

  // Şehir merkezi değişince haritayı yeniden ortala (pin sürüklemesinde DEĞİL).
  useEffect(() => {
    const k = centerKey(center);
    if (k === prevCenterRef.current) return;
    prevCenterRef.current = k;
    const js = `window.__setView && window.__setView(${center.latitude}, ${center.longitude}); true;`;
    webRef.current?.injectJavaScript(js);
  }, [center.latitude, center.longitude]);

  const onMessage = (e: WebViewMessageEvent) => {
    const data = e.nativeEvent.data;
    if (data === 'ready' || data === 'error') return;
    try {
      const parsed = JSON.parse(data) as { lat?: number; lng?: number };
      if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        onChangeRef.current({ latitude: round6(parsed.lat), longitude: round6(parsed.lng) });
      }
    } catch {
      /* köprü dışı mesaj — yok say */
    }
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        onMessage={onMessage}
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
