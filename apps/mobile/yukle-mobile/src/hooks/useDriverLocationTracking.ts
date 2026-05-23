import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { updateDriverLocation } from '../services/location.service';

const INTERVAL_MS = 10_000;

type Options = {
  loadId: string | null | undefined;
  /** Assigned veya OnWay iken true */
  enabled: boolean;
};

/**
 * Aktif seferde konumu REST ile gönderir.
 * expo-location yalnızca native'de dinamik import edilir (web bundle güvenli).
 */
export function useDriverLocationTracking({ loadId, enabled }: Options) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastPosition, setLastPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const stop = () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (!enabled || !loadId) {
      stop();
      setStatusMessage(null);
      setLastPosition(null);
      return () => {
        cancelledRef.current = true;
        stop();
      };
    }

    const push = async (latitude: number, longitude: number) => {
      if (cancelledRef.current) return;
      try {
        await updateDriverLocation({ loadId, latitude, longitude });
        setLastPosition({ latitude, longitude });
        const time = new Date().toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setStatusMessage(`Konum paylaşılıyor · son güncelleme ${time}`);
      } catch {
        if (!cancelledRef.current) {
          setStatusMessage('Konum sunucuya gönderilemedi. Bağlantınızı kontrol edin.');
        }
      }
    };

    const startWeb = () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setStatusMessage('Tarayıcı konum özelliğini desteklemiyor.');
        return;
      }
      const tick = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            void push(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            setStatusMessage('Konum izni verilmedi. Paylaşım durduruldu.');
            stop();
          },
          { enableHighAccuracy: true, maximumAge: 8000, timeout: 12000 }
        );
      };
      tick();
      intervalRef.current = setInterval(tick, INTERVAL_MS);
    };

    const startNative = async () => {
      try {
        const Location = await import('expo-location');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setStatusMessage('Konum izni verilmedi. Ayarlardan izin verebilirsiniz.');
          return;
        }

        const tick = async () => {
          try {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            await push(pos.coords.latitude, pos.coords.longitude);
          } catch {
            if (!cancelledRef.current) {
              setStatusMessage('Konum alınamadı. GPS açık mı kontrol edin.');
            }
          }
        };

        await tick();
        intervalRef.current = setInterval(() => {
          void tick();
        }, INTERVAL_MS);
      } catch {
        setStatusMessage('Konum servisi kullanılamıyor.');
      }
    };

    if (Platform.OS === 'web') {
      startWeb();
    } else {
      void startNative();
    }

    const appSub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        stop();
      }
    });

    return () => {
      cancelledRef.current = true;
      stop();
      appSub.remove();
    };
  }, [loadId, enabled]);

  return { statusMessage, lastPosition };
}
