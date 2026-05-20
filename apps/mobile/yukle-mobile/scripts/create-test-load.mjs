/**
 * Musteri ile test yuk ilani olusturur (Elazig OSB -> Malatya).
 * Kullanim: node scripts/create-test-load.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

const CUSTOMER_PHONE = '5000000001';
const CUSTOMER_PASSWORD = 'Test123!';

async function login() {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: CUSTOMER_PHONE, password: CUSTOMER_PASSWORD }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Login failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  const token = data.token ?? data.accessToken;
  if (!token) throw new Error('Login response missing token');
  return token;
}

async function createLoad(token) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const body = {
    fromCity: 'Elazig',
    fromDistrict: 'OSB',
    toCity: 'Malatya',
    toDistrict: 'Merkez',
    fromLatitude: 38.636,
    fromLongitude: 39.0844,
    toLatitude: 38.3552,
    toLongitude: 38.3095,
    weight: 12000,
    volume: 24,
    price: 18500,
    currency: 'TRY',
    description: 'Mobil test yuk ilani - Elazig OSB Malatya',
    pickupDate: tomorrow.toISOString(),
    deliveryDate: dayAfter.toISOString(),
    requiredVehicleType: 1,
    loadType: 0,
  };

  const res = await fetch(`${API}/Loads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create load failed (${res.status}): ${err}`);
  }
  return res.json();
}

async function getActiveCount(driverToken) {
  const res = await fetch(`${API}/Loads/active`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  if (!res.ok) throw new Error(`GET active failed (${res.status})`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  return { total: data.total ?? items.length, items };
}

async function loginDriver() {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '5000000002', password: CUSTOMER_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Driver login failed (${res.status})`);
  const data = await res.json();
  return data.token ?? data.accessToken;
}

async function main() {
  console.log('API:', API);
  const token = await login();
  console.log('Musteri login OK');

  const created = await createLoad(token);
  const loadId = created.load?.id ?? created.Load?.id;
  const distKm = created.aiMarketAnalysis?.distanceKm ?? created.AiMarketAnalysis?.DistanceKm;
  console.log('Yuk olusturuldu:', loadId);
  if (distKm != null) console.log('Mesafe (km):', distKm);

  const driverToken = await loginDriver();
  console.log('Sofor login OK (active list dogrulama)');

  const { total, items } = await getActiveCount(driverToken);
  console.log(`GET /Loads/active -> total: ${total}, items: ${items.length}`);
  if (items.length < 1) {
    process.exitCode = 1;
    console.error('HATA: Aktif ilan listesi bos.');
  } else {
    console.log('Ilk ilan:', items[0].fromCity, '->', items[0].toCity);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
