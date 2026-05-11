import { apiClient } from './client'
import type { CustomerDashboard, DriverDashboard } from './types'

export async function getDashboard(): Promise<CustomerDashboard | DriverDashboard> {
  const res = await apiClient.get('/Dashboard')
  return (res.data ?? {}) as CustomerDashboard | DriverDashboard
}

export async function getCustomerDashboard(): Promise<CustomerDashboard> {
  const data = await getDashboard()
  return data as CustomerDashboard
}

export async function getDriverDashboard(): Promise<DriverDashboard> {
  const data = await getDashboard()
  return data as DriverDashboard
}
