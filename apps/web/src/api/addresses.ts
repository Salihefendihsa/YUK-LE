import { apiClient } from './client'

export type DeliveryAddress = {
  id: string
  title: string
  companyName: string
  contactPerson: string
  contactPhone: string
  address: string
  city: string
  district: string
  latitude?: number
  longitude?: number
  isDefault: boolean
}

export async function getMyAddresses() {
  const res = await apiClient.get<DeliveryAddress[]>('/DeliveryAddresses')
  return res.data
}

export async function createAddress(data: Omit<DeliveryAddress, 'id'>) {
  const res = await apiClient.post('/DeliveryAddresses', data)
  return res.data
}

export async function updateAddress(id: string, data: Omit<DeliveryAddress, 'id'>) {
  const res = await apiClient.put(`/DeliveryAddresses/${id}`, data)
  return res.data
}

export async function deleteAddress(id: string) {
  await apiClient.delete(`/DeliveryAddresses/${id}`)
}

export async function setDefaultAddress(id: string) {
  await apiClient.put(`/DeliveryAddresses/${id}/set-default`)
}
