/**
 * Pazaryeri dongusu: musteri ilan -> sofor teklif -> musteri kabul -> pickup -> QR -> deliver
 * Kullanim: node scripts/e2e-marketplace.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';
const CUSTOMER_PHONE = '5000000001';
const DRIVER_PHONE = '5000000002';
const PASSWORD = 'Test123!';

async function login(phone) {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login ${phone} failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.token ?? data.accessToken;
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
    description: 'E2E pazaryeri test',
    pickupDate: tomorrow.toISOString(),
    deliveryDate: dayAfter.toISOString(),
    requiredVehicleType: 1,
    loadType: 0,
  };
  const res = await fetch(`${API}/Loads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Create load (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.load?.id ?? data.Load?.id;
}

async function submitBid(driverToken, loadId, amount) {
  const res = await fetch(`${API}/Bids/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ loadId, amount, note: 'E2E teklif' }),
  });
  if (!res.ok) throw new Error(`Submit bid (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.bidId ?? data.BidId ?? data.id ?? data.Id;
}

async function getBidsForLoad(customerToken, loadId) {
  const res = await fetch(`${API}/Bids/load/${loadId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (!res.ok) throw new Error(`GET bids (${res.status}): ${await res.text()}`);
  return res.json();
}

async function acceptBid(customerToken, bidId) {
  const res = await fetch(`${API}/Bids/${bidId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (!res.ok) throw new Error(`Accept bid (${res.status}): ${await res.text()}`);
}

async function getLoad(token, loadId) {
  const res = await fetch(`${API}/Loads/${loadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET load (${res.status}): ${await res.text()}`);
  return res.json();
}

async function pickup(driverToken, loadId) {
  const res = await fetch(`${API}/Loads/${loadId}/pickup`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  if (!res.ok) throw new Error(`Pickup (${res.status}): ${await res.text()}`);
}

async function getDeliveryQr(customerToken, loadId) {
  const res = await fetch(`${API}/Loads/${loadId}/delivery-qr`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (!res.ok) throw new Error(`Delivery QR (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.token ?? data.Token;
}

async function deliver(driverToken, loadId, qrToken, load) {
  const targetLat = load.destinationLat ?? load.DestinationLat;
  const targetLng = load.destinationLng ?? load.DestinationLng;
  const res = await fetch(`${API}/Loads/${loadId}/deliver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` },
    body: JSON.stringify({ qrToken, targetLat, targetLng }),
  });
  if (!res.ok) throw new Error(`Deliver (${res.status}): ${await res.text()}`);
}

function statusOk(actual, expected) {
  const map = { Active: 0, Assigned: 1, OnWay: 2, Delivered: 4 };
  return actual === expected || actual === map[expected];
}

async function main() {
  console.log('API:', API);
  const customerToken = await login(CUSTOMER_PHONE);
  const driverToken = await login(DRIVER_PHONE);
  console.log('1) Login OK');

  const loadId = await createLoad(customerToken);
  console.log('2) Load created:', loadId);

  const bidId = await submitBid(driverToken, loadId, 17200);
  console.log('3) Bid submitted:', bidId);

  const bids = await getBidsForLoad(customerToken, loadId);
  const list = Array.isArray(bids) ? bids : [];
  if (!list.some((b) => (b.id ?? b.Id) === bidId)) {
    throw new Error('Bid not visible to customer');
  }
  console.log('4) Customer sees bids:', list.length);

  await acceptBid(customerToken, bidId);
  const afterAccept = await getLoad(customerToken, loadId);
  const st = afterAccept.status;
  if (!statusOk(st, 'Assigned')) {
    throw new Error(`Expected Assigned after accept, got ${st}`);
  }
  console.log('5) Bid accepted, load status:', st);

  await pickup(driverToken, loadId);
  const afterPickup = await getLoad(customerToken, loadId);
  if (!statusOk(afterPickup.status, 'OnWay')) {
    throw new Error(`Expected OnWay after pickup, got ${afterPickup.status}`);
  }
  console.log('6) Driver pickup, status:', afterPickup.status);

  const qrToken = await getDeliveryQr(customerToken, loadId);
  if (!qrToken || qrToken.length < 10) throw new Error('Invalid QR token');
  console.log('7) Delivery QR token OK (len', qrToken.length, ')');

  const loadForDeliver = await getLoad(driverToken, loadId);
  await deliver(driverToken, loadId, qrToken, loadForDeliver);
  const final = await getLoad(customerToken, loadId);
  if (!statusOk(final.status, 'Delivered')) {
    throw new Error(`Expected Delivered, got ${final.status}`);
  }
  console.log('8) Delivered OK — tam dongu basarili');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
