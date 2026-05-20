/**
 * Musteri ile teklif kabul eder (varsayilan bidId: 1).
 * Kullanim: node scripts/accept-bid.mjs [bidId]
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';
const CUSTOMER_PHONE = '5000000001';
const DRIVER_PHONE = '5000000002';
const PASSWORD = 'Test123!';
const BID_ID = Number(process.argv[2] ?? '1');

async function login(phone) {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.token ?? data.accessToken;
}

async function acceptBid(token, bidId) {
  const res = await fetch(`${API}/Bids/${bidId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Accept bid failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function getDriverTrip(driverToken) {
  const res = await fetch(`${API}/Loads/active`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  if (!res.ok) throw new Error(`GET active failed (${res.status})`);
  const data = await res.json();
  const items = Array.isArray(data) ? data : data.items ?? [];
  const isTrip = (s) => s === 'Assigned' || s === 'OnWay' || s === 'Arrived' || s === 1 || s === 2 || s === 3;
  return items.find((x) => isTrip(x.status)) ?? null;
}

async function getLoad(token, loadId) {
  const res = await fetch(`${API}/Loads/${loadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET load failed (${res.status})`);
  return res.json();
}

async function main() {
  console.log('API:', API);
  console.log('BidId:', BID_ID);

  const customerToken = await login(CUSTOMER_PHONE);
  console.log('Musteri login OK');

  const acceptRes = await acceptBid(customerToken, BID_ID);
  console.log('Accept:', acceptRes.message ?? 'OK');

  const driverToken = await login(DRIVER_PHONE);
  console.log('Sofor login OK');

  const trip = await getDriverTrip(driverToken);
  if (!trip) {
    throw new Error('Sofor aktif seferi bulunamadi (Assigned/OnWay). API yeniden baslatildi mi?');
  }

  const load = await getLoad(driverToken, trip.id);
  console.log('Sefer:', load.fromCity, '->', load.toCity);
  console.log('Durum:', load.status, '(beklenen: Assigned)');
  console.log('DriverId:', load.driverId);
  console.log('LoadId:', load.id);

  const assigned = load.status === 'Assigned' || load.status === 1;
  if (!assigned) {
    process.exitCode = 1;
    console.error('HATA: Ilan Assigned degil, gelen:', load.status);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
