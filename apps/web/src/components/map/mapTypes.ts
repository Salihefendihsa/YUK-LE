export type MapCoordinate = {
  latitude: number
  longitude: number
}

export type MapMarker = MapCoordinate & {
  id: string
  title?: string
  /** Tıklanınca açılan popup gövdesi (çok satır için \n kullan). Yoksa tooltip gösterilir. */
  description?: string
  kind?: 'driver' | 'destination' | 'origin'
}
