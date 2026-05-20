/**
 * Musteri ile teslimat QR token uretir (OnWay/Assigned yuk icin).
 * Kullanim: node scripts/get-delivery-qr.mjs [loadId]
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';
const CUSTOMER_PHONE = '5000000001';
const PASSWORD = 'Test123!';

async function login(phone) {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status})`);
  const data = await res.json();
  return data.token ?? data.accessToken;
}

async function main() {
  const loadId = process.argv[2];
  if (!loadId) {
    console.error('Kullanim: node scripts/get-delivery-qr.mjs <loadId>');
    process.exitCode = 1;
    return;
  }
  const token = await login(CUSTOMER_PHONE);
  const res = await fetch(`${API}/Loads/${loadId}/delivery-qr`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`QR failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  console.log('LoadId:', data.loadId ?? loadId);
  console.log('Token (sofor uygulamasina yapistirin):');
  console.log(data.token ?? data.Token);
  console.log('Gecerlilik (dk):', data.expiresInMinutes ?? data.ExpiresInMinutes ?? 15);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exitCode = 1;
});
