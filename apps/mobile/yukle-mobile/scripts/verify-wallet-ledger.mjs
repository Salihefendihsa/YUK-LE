/**
 * E2E marketplace + wallet ledger checks (driver balances after accept/deliver).
 * Usage: node scripts/verify-wallet-ledger.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';
const CUSTOMER_PHONE = '5000000001';
const DRIVER_PHONE = '5000000002';
const PASSWORD = 'Test123!';
const BID_AMOUNT = 17200;
const COMMISSION_RATE = 0.1;
const WITHHOLDING_RATE = 0.05;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function expectedNet(gross, isCorporate) {
  const t = round2(gross);
  const k = round2(t * COMMISSION_RATE);
  const s = isCorporate ? 0 : round2(t * WITHHOLDING_RATE);
  const h = round2(t - k - s);
  return { t, k, s, h };
}

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

async function getWallet(token) {
  const res = await fetch(`${API}/Wallet`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Wallet GET (${res.status}): ${await res.text()}`);
  return res.json();
}

function userIdFromJwt(token) {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  const key = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
  return parseInt(payload[key] ?? payload.sub ?? '0', 10);
}

async function getProfile(token, userId) {
  const res = await fetch(`${API}/Users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`User profile (${res.status}): ${await res.text()}`);
  return res.json();
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
    description: 'Wallet ledger verify',
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
    body: JSON.stringify({ loadId, amount, note: 'Wallet verify bid' }),
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

async function getLoad(token, loadId) {
  const res = await fetch(`${API}/Loads/${loadId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET load (${res.status}): ${await res.text()}`);
  return res.json();
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

function assertClose(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.01) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

async function main() {
  console.log('API:', API);
  const customerToken = await login(CUSTOMER_PHONE);
  const driverToken = await login(DRIVER_PHONE);

  const driverId = userIdFromJwt(driverToken);
  const isCorporate = false;
  const { t, k, s, h } = expectedNet(BID_AMOUNT, isCorporate);
  console.log(`Settlement T=${t} K=${k} S=${s} H=${h} corporate=${isCorporate}`);

  const walletBefore = await getWallet(driverToken);
  const pendingBefore = Number(walletBefore.pendingBalance ?? walletBefore.PendingBalance ?? 0);
  const walletBalBefore = Number(walletBefore.walletBalance ?? walletBefore.WalletBalance ?? 0);
  console.log('Before trip: wallet=', walletBalBefore, 'pending=', pendingBefore);

  const loadId = await createLoad(customerToken);
  const bidId = await submitBid(driverToken, loadId, BID_AMOUNT);
  await getBidsForLoad(customerToken, loadId);
  await acceptBid(customerToken, bidId);

  const walletAfterAccept = await getWallet(driverToken);
  const pendingAfterAccept = Number(walletAfterAccept.pendingBalance ?? walletAfterAccept.PendingBalance ?? 0);
  assertClose(pendingAfterAccept, pendingBefore + h, 'PendingBalance after accept');
  console.log('OK after accept: pending=', pendingAfterAccept, '(+' + h + ')');

  await pickup(driverToken, loadId);
  const qrToken = await getDeliveryQr(customerToken, loadId);
  const loadForDeliver = await getLoad(driverToken, loadId);
  await deliver(driverToken, loadId, qrToken, loadForDeliver);

  const walletAfterDeliver = await getWallet(driverToken);
  const pendingAfterDeliver = Number(walletAfterDeliver.pendingBalance ?? walletAfterDeliver.PendingBalance ?? 0);
  const walletAfterDeliverBal = Number(walletAfterDeliver.walletBalance ?? walletAfterDeliver.WalletBalance ?? 0);

  assertClose(pendingAfterDeliver, pendingAfterAccept - h, 'PendingBalance after deliver');
  assertClose(walletAfterDeliverBal, walletBalBefore + h, 'WalletBalance after deliver');
  console.log('OK after deliver: wallet=', walletAfterDeliverBal, '(+' + h + ') pending=', pendingAfterDeliver);

  const txRes = await fetch(`${API}/Wallet/transactions`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const tx = await txRes.json();
  const hold = (Array.isArray(tx) ? tx : []).find((x) => String(x.status ?? x.Status) === 'Hold');
  const release = (Array.isArray(tx) ? tx : []).find((x) => String(x.status ?? x.Status) === 'Release');
  if (!hold || !release) throw new Error('Missing Hold or Release in wallet audit log');
  console.log('OK audit log: Hold and Release present');
  console.log('Wallet ledger verification PASSED');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
