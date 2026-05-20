import type { DeliveryAddress, DeliveryAddressInput } from '../types/address';
import { apiClient } from './api.client';

function normalizeAddress(raw: unknown): DeliveryAddress {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    title: String(r.title ?? ''),
    companyName: String(r.companyName ?? ''),
    contactPerson: String(r.contactPerson ?? ''),
    contactPhone: String(r.contactPhone ?? ''),
    address: String(r.address ?? ''),
    city: String(r.city ?? ''),
    district: String(r.district ?? ''),
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
    isDefault: Boolean(r.isDefault),
  };
}

/** GET /DeliveryAddresses */
export async function getMyAddresses(): Promise<DeliveryAddress[]> {
  const res = await apiClient.get('/DeliveryAddresses');
  const data = res.data;
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAddress);
}

/** POST /DeliveryAddresses */
export async function createAddress(data: DeliveryAddressInput): Promise<DeliveryAddress> {
  const res = await apiClient.post('/DeliveryAddresses', data);
  return normalizeAddress(res.data);
}

/** PUT /DeliveryAddresses/{id} */
export async function updateAddress(id: string, data: DeliveryAddressInput): Promise<DeliveryAddress> {
  const res = await apiClient.put(`/DeliveryAddresses/${id}`, data);
  return normalizeAddress(res.data);
}

/** DELETE /DeliveryAddresses/{id} */
export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/DeliveryAddresses/${id}`);
}

/** PUT /DeliveryAddresses/{id}/set-default */
export async function setDefaultAddress(id: string): Promise<void> {
  await apiClient.put(`/DeliveryAddresses/${id}/set-default`);
}
