import { useEffect, useState } from 'react';
import { getDriverLocation, type DriverLocationInfo } from '../services/location.service';
import type { LoadStatus } from '../types/load';
import { formatDistanceKm, haversineKm } from '../utils/geo';
import { formatDateTimeTR } from '../utils/format';

const POLL_MS = 20_000;

type Options = {
  loadId: string;
  status: LoadStatus | undefined;
  destinationLat?: number;
  destinationLng?: number;
};

export function useCustomerDriverLocation({
  loadId,
  status,
  destinationLat,
  destinationLng,
}: Options) {
  const [driverLoc, setDriverLoc] = useState<DriverLocationInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const shouldPoll = status === 'Assigned' || status === 'OnWay';

  useEffect(() => {
    if (!loadId || !shouldPoll) {
      setDriverLoc(null);
      return;
    }

    let cancelled = false;

    const fetchLoc = async () => {
      try {
        setLoading(true);
        const data = await getDriverLocation(loadId);
        if (!cancelled) setDriverLoc(data);
      } catch {
        if (!cancelled) setDriverLoc(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchLoc();
    const timer = setInterval(() => {
      void fetchLoc();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [loadId, shouldPoll]);

  const hasCoords =
    driverLoc?.lastKnownLatitude != null && driverLoc?.lastKnownLongitude != null;

  let distanceLabel: string | null = null;
  if (
    hasCoords &&
    destinationLat != null &&
    destinationLng != null &&
    !Number.isNaN(destinationLat) &&
    !Number.isNaN(destinationLng)
  ) {
    const km = haversineKm(
      driverLoc!.lastKnownLatitude!,
      driverLoc!.lastKnownLongitude!,
      destinationLat,
      destinationLng
    );
    distanceLabel = formatDistanceKm(km);
  }

  const summary = (() => {
    if (!shouldPoll) return null;
    if (loading && !hasCoords) return 'Şoför konumu yükleniyor…';
    if (!hasCoords) return 'Konum henüz paylaşılmadı.';
    const updated = driverLoc?.lastLocationUpdate
      ? formatDateTimeTR(driverLoc.lastLocationUpdate)
      : null;
    const parts = ['Şoför yolda'];
    if (distanceLabel) parts.push(`hedefe yaklaşık ${distanceLabel}`);
    if (updated) parts.push(`son güncelleme ${updated}`);
    return parts.join(' · ');
  })();

  const coordsText =
    hasCoords && driverLoc
      ? `${driverLoc.lastKnownLatitude!.toFixed(5)}, ${driverLoc.lastKnownLongitude!.toFixed(5)}`
      : null;

  return {
    shouldShow: shouldPoll,
    hasCoords,
    driverLatitude: driverLoc?.lastKnownLatitude ?? null,
    driverLongitude: driverLoc?.lastKnownLongitude ?? null,
    driverName: driverLoc?.fullName,
    summary,
    coordsText,
    loading,
  };
}
