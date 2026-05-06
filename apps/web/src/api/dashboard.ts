import { apiClient } from './client'
import type { CustomerDashboard, DriverDashboard } from './types'

export async function getDashboard(): Promise<CustomerDashboard | DriverDashboard> {
  const res = await apiClient.get('/Dashboard')
  return res.data
}

export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const res = await apiClient.get<CustomerDashboard>('/Dashboard')
  return res.data
}

export async function getDriverDashboard(): Promise<DriverDashboard> {
  const res = await apiClient.get<DriverDashboard>('/Dashboard')
  return res.data
}
