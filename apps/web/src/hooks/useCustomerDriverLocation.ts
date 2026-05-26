import { useEffect, useState } from 'react'
import { getDriverLocation } from '../api/location'
import type { LoadStatus } from '../api/types'
import { formatDistanceKm, haversineKm } from '../utils/geo'
import { formatDateTime } from '../utils/formatters'

const POLL_MS = 20_000

type Options = {
  loadId: string
  status: LoadStatus | undefined
  destinationLat?: number
  destinationLng?: number
}

export function useCustomerDriverLocation({
  loadId,
  status,
  destinationLat,
  destinationLng,
}: Options) {
  const [driverLoc, setDriverLoc] = useState<Awaited<ReturnType<typeof getDriverLocation>> | null>(null)
  const [loading, setLoading] = useState(false)

  const shouldPoll = status === 'Assigned' || status === 'OnWay'
  const shouldFetch = shouldPoll || status === 'Arrived'

  useEffect(() => {
    if (!loadId || !shouldFetch) {
      setDriverLoc(null)
      return
    }

    let cancelled = false

    const fetchLoc = async () => {
      try {
        setLoading(true)
        const data = await getDriverLocation(loadId)
        if (!cancelled) setDriverLoc(data)
      } catch {
        if (!cancelled) setDriverLoc(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchLoc()

    if (!shouldPoll) {
      return () => {
        cancelled = true
      }
    }

    const timer = setInterval(() => {
      void fetchLoc()
    }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [loadId, shouldFetch, shouldPoll])

  const hasCoords =
    driverLoc?.lastKnownLatitude != null && driverLoc?.lastKnownLongitude != null

  let distanceLabel: string | null = null
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
    )
    distanceLabel = formatDistanceKm(km)
  }

  const summary = (() => {
    if (!shouldFetch) return null
    if (loading && !hasCoords) return 'Şoför konumu yükleniyor…'
    if (!hasCoords) return 'Konum henüz paylaşılmadı.'
    const updated = driverLoc?.lastLocationUpdate
      ? formatDateTime(driverLoc.lastLocationUpdate)
      : null
    const parts = [status === 'Arrived' ? 'Varış noktasında' : 'Şoför yolda']
    if (distanceLabel) parts.push(`hedefe yaklaşık ${distanceLabel}`)
    if (updated) parts.push(`son güncelleme ${updated}`)
    return parts.join(' · ')
  })()

  return {
    shouldShow: shouldFetch,
    hasCoords,
    driverLatitude: driverLoc?.lastKnownLatitude ?? null,
    driverLongitude: driverLoc?.lastKnownLongitude ?? null,
    driverName: driverLoc?.fullName,
    summary,
    loading,
  }
}
