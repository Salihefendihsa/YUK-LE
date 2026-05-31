/**
 * Admin kullanici listesi + toggle-active
 * Kullanim: node scripts/test-admin-users.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

async function login() {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: 'admin@navlonix.com', password: 'Admin123!' }),
  });
  if (!res.ok) throw new Error(`Login (${res.status})`);
  const data = await res.json();
  return data.token ?? data.Token;
}

async function main() {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const driversRes = await fetch(`${API}/Admin/drivers`, { headers });
  const customersRes = await fetch(`${API}/Admin/customers`, { headers });
  if (!driversRes.ok) throw new Error(`drivers (${driversRes.status})`);
  if (!customersRes.ok) throw new Error(`customers (${customersRes.status})`);

  const drivers = await driversRes.json();
  const customers = await customersRes.json();
  console.log('Sofor sayisi:', drivers.length);
  console.log('Musteri sayisi:', customers.length);

  const target = drivers[0] ?? customers[0];
  if (!target) {
    console.log('Liste bos, toggle test atlandi.');
    return;
  }

  const userId = target.id;
  const wasActive = target.isActive;
  const toggleRes = await fetch(`${API}/Admin/users/${userId}/toggle-active`, {
    method: 'POST',
    headers,
  });
  if (!toggleRes.ok) throw new Error(`toggle (${toggleRes.status}): ${await toggleRes.text()}`);
  const toggled = await toggleRes.json();
  console.log('Toggle:', userId, wasActive, '->', toggled.isActive);

  await fetch(`${API}/Admin/users/${userId}/toggle-active`, { method: 'POST', headers });
  console.log('Geri alindi (tekrar toggle).');

  const profileRes = await fetch(`${API}/Users/${userId}`, { headers });
  if (!profileRes.ok) throw new Error(`GET Users (${profileRes.status})`);
  const profile = await profileRes.json();
  console.log('Profil (gercek):', profile.fullName, profile.role);
  console.log('Test tamamlandi.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
