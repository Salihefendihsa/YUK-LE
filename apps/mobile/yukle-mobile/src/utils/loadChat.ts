import type { Load } from '../types/load';

/** Web musteri: load.driverId varken sohbet acilir. */
export function canCustomerOpenChat(load: Load): boolean {
  const driverId = load.driverId;
  return driverId != null && Number(driverId) > 0;
}

/** Web sofor: Assigned, OnWay, Delivered. */
export function canDriverOpenChat(load: Load): boolean {
  return load.status === 'Assigned' || load.status === 'OnWay' || load.status === 'Delivered';
}
