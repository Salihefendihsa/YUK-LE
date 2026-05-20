export interface DeliveryAddress {
  id: string;
  title: string;
  companyName: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  city: string;
  district: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export type DeliveryAddressInput = Omit<DeliveryAddress, 'id'>;
