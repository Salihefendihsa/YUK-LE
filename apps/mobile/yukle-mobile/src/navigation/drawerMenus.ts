import type { Ionicons } from '@expo/vector-icons';

export type AppRole = 'customer' | 'driver' | 'admin';

export type DrawerMenuItem = {
  href: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Path segment used to detect active route */
  activeMatch: string;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  customer: 'Müşteri',
  driver: 'Şoför',
  admin: 'Yönetici',
};

export const CUSTOMER_DRAWER_ITEMS: DrawerMenuItem[] = [
  { href: '/(customer)/(tabs)/dashboard', label: 'Ana Sayfa', icon: 'home-outline', activeMatch: 'dashboard' },
  { href: '/(customer)/(tabs)/loads', label: 'İlanlarım', icon: 'cube-outline', activeMatch: 'loads' },
  {
    href: '/(customer)/(tabs)/create-load',
    label: 'İlan Oluştur',
    icon: 'add-circle-outline',
    activeMatch: 'create-load',
  },
  {
    href: '/(customer)/(tabs)/addresses',
    label: 'Adreslerim',
    icon: 'location-outline',
    activeMatch: 'addresses',
  },
  { href: '/(customer)/(tabs)/history', label: 'Geçmiş', icon: 'time-outline', activeMatch: 'history' },
  {
    href: '/(customer)/(tabs)/analytics',
    label: 'Analitik',
    icon: 'bar-chart-outline',
    activeMatch: 'analytics',
  },
  {
    href: '/notifications',
    label: 'Bildirimler',
    icon: 'notifications-outline',
    activeMatch: 'notifications',
  },
  { href: '/(customer)/(tabs)/profile', label: 'Profil', icon: 'person-outline', activeMatch: 'profile' },
];

export const DRIVER_DRAWER_ITEMS: DrawerMenuItem[] = [
  { href: '/(driver)/(tabs)/dashboard', label: 'Ana Sayfa', icon: 'home-outline', activeMatch: 'dashboard' },
  { href: '/(driver)/(tabs)/loads', label: 'Yük Panosu', icon: 'cube-outline', activeMatch: 'loads' },
  {
    href: '/(driver)/(tabs)/active-load',
    label: 'Aktif Sefer',
    icon: 'navigate-outline',
    activeMatch: 'active-load',
  },
  { href: '/(driver)/(tabs)/wallet', label: 'Cüzdan', icon: 'wallet-outline', activeMatch: 'wallet' },
  {
    href: '/(driver)/(tabs)/documents',
    label: 'Belgeler',
    icon: 'document-text-outline',
    activeMatch: 'documents',
  },
  { href: '/(driver)/(tabs)/bids', label: 'Tekliflerim', icon: 'pricetag-outline', activeMatch: 'bids' },
  { href: '/(driver)/(tabs)/history', label: 'Geçmiş', icon: 'time-outline', activeMatch: 'history' },
  {
    href: '/notifications',
    label: 'Bildirimler',
    icon: 'notifications-outline',
    activeMatch: 'notifications',
  },
  { href: '/(driver)/(tabs)/profile', label: 'Profil', icon: 'person-outline', activeMatch: 'profile' },
];

export const ADMIN_DRAWER_ITEMS: DrawerMenuItem[] = [
  {
    href: '/(admin)/(tabs)/dashboard',
    label: 'Komuta Merkezi',
    icon: 'grid-outline',
    activeMatch: 'dashboard',
  },
  {
    href: '/(admin)/(tabs)/reviews',
    label: 'Belge Kuyruğu',
    icon: 'document-text-outline',
    activeMatch: 'reviews',
  },
  { href: '/(admin)/(tabs)/users', label: 'Kullanıcılar', icon: 'people-outline', activeMatch: 'users' },
  { href: '/(admin)/(tabs)/payments', label: 'Ödemeler', icon: 'card-outline', activeMatch: 'payments' },
  { href: '/(admin)/(tabs)/system', label: 'Sistem', icon: 'settings-outline', activeMatch: 'system' },
  { href: '/(admin)/(tabs)/loads', label: 'İlanlar', icon: 'cube-outline', activeMatch: '/loads' },
  { href: '/(admin)/(tabs)/logs', label: 'Loglar', icon: 'list-outline', activeMatch: 'logs' },
  {
    href: '/(admin)/(tabs)/blocked-messages',
    label: 'Engellenen Mesajlar',
    icon: 'ban-outline',
    activeMatch: 'blocked-messages',
  },
  { href: '/(admin)/(tabs)/chats', label: 'Sohbetler', icon: 'chatbubbles-outline', activeMatch: 'chats' },
  { href: '/(admin)/(tabs)/ratings', label: 'Puanlar', icon: 'star-outline', activeMatch: 'ratings' },
  {
    href: '/(admin)/(tabs)/tracking',
    label: 'Canlı Takip',
    icon: 'navigate-outline',
    activeMatch: 'tracking',
  },
  { href: '/(admin)/(tabs)/settings', label: 'Ayarlar', icon: 'options-outline', activeMatch: 'settings' },
];

export function getDrawerItems(role: AppRole): DrawerMenuItem[] {
  switch (role) {
    case 'customer':
      return CUSTOMER_DRAWER_ITEMS;
    case 'driver':
      return DRIVER_DRAWER_ITEMS;
    case 'admin':
      return ADMIN_DRAWER_ITEMS;
  }
}

export function isDrawerItemActive(pathname: string, item: DrawerMenuItem): boolean {
  if (item.activeMatch === '/loads') {
    return pathname.includes('/loads') && !pathname.includes('create-load');
  }
  return pathname.includes(item.activeMatch);
}
