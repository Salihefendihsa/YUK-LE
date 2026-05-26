export type MapCoordinate = {
  latitude: number
  longitude: number
}

export type MapMarker = MapCoordinate & {
  id: string
  title?: string
  kind?: 'driver' | 'destination' | 'origin'
}
