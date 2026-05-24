/**
 * Wallet settlement smoke test (G.1 — %2 driver + %2 customer).
 * Usage: node scripts/verify-wallet-ledger.mjs
 * Env: API_URL, CUSTOMER_PHONE, CUSTOMER_PASSWORD, DRIVER_PHONE, DRIVER_PASSWORD
 */

const API = process.env.API_URL ?? 'http://localhost:5151/api';
const CUSTOMER_PHONE = process.env.CUSTOMER_PHONE ?? '5000000001';
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD ?? 'Customer123!';
const DRIVER_PHONE = process.env.DRIVER_PHONE ?? '5000000002';
const DRIVER_PASSWORD = process.env.DRIVER_PASSWORD ?? 'Driver123!';

const DRIVER_RATE = Number(process.env.COMMISSION_DRIVER_RATE ?? 0.02);
const CUSTOMER_RATE = Number(process.env.COMMISSION_CUSTOMER_RATE ?? 0.02);
const STOPAJ_RATE = Number(process.env.STOPAJ_RATE ?? 0);

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calcSettlement(bidAmount, driverIsCorporate = false) {
  const x = round2(bidAmount);
  const driverCommission = round2(x * DRIVER_RATE);
  const customerCommission = round2(x * CUSTOMER_RATE);
  const stopaj = driverIsCorporate ? 0 : round2(x * STOPAJ_RATE);
  const driverNet = round2(x - driverCommission - stopaj);
  const customerTotal = round2(x + customerCommission);
  const platformRevenue = round2(driverCommission + customerCommission);
  return { x, driverCommission, customerCommission, stopaj, driverNet, customerTotal, platformRevenue };
}

async function post(path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function login(phone, password) {
  const data = await post('/Auth/login', { phone, password });
  return data.token ?? data.accessToken;
}

async function main() {
  const preview = await get('/Settlement/preview?amount=10000', await login(CUSTOMER_PHONE, CUSTOMER_PASSWORD));
  const expected = calcSettlement(10000);
  console.log('Preview API:', preview);
  console.log('Expected:', expected);

  const bid = Number(preview.bidAmount ?? preview.BidAmount ?? 0);
  if (round2(bid) !== expected.x) throw new Error('Preview bidAmount mismatch');
  if (round2(Number(preview.customerTotal ?? preview.CustomerTotal)) !== expected.customerTotal) {
    throw new Error('Preview customerTotal mismatch');
  }
  if (round2(Number(preview.driverNet ?? preview.DriverNet)) !== expected.driverNet) {
    throw new Error('Preview driverNet mismatch');
  }
  if (round2(Number(preview.platformRevenue ?? preview.PlatformRevenue)) !== expected.platformRevenue) {
    throw new Error('Preview platformRevenue mismatch (expected 4%)');
  }

  console.log('OK settlement preview matches config rates');
  console.log('Driver rate:', preview.driverCommissionRate ?? preview.DriverCommissionRate);
  console.log('Customer rate:', preview.customerCommissionRate ?? preview.CustomerCommissionRate);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
