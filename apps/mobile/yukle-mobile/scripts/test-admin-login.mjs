/**
 * Admin + musteri/sofor login dogrulama
 * Kullanim: node scripts/test-admin-login.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

async function login(phoneOrEmail, password) {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneOrEmail, password }),
  });
  if (!res.ok) throw new Error(`${phoneOrEmail} login (${res.status}): ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('API:', API);

  const customer = await login('5000000001', 'Test123!');
  console.log('Musteri OK:', customer.role, customer.fullName);

  const driver = await login('5000000002', 'Test123!');
  console.log('Sofor OK:', driver.role, driver.fullName);

  const admin = await login('admin@yuk-le.com', 'Admin123!');
  if (admin.role !== 'Admin') throw new Error(`Admin role bekleniyor, gelen: ${admin.role}`);
  console.log('Admin OK:', admin.role, admin.fullName);

  const dashRes = await fetch(`${API}/Admin/dashboard`, {
    headers: { Authorization: `Bearer ${admin.token ?? admin.Token}` },
  });
  if (!dashRes.ok) throw new Error(`Dashboard (${dashRes.status}): ${await dashRes.text()}`);
  const dash = await dashRes.json();
  console.log('Dashboard:', {
    totalUsers: dash.totalUsers,
    activeLoadCount: dash.activeLoadCount,
    pendingReviewCount: dash.pendingReviewCount,
    totalTransactionVolume: dash.totalTransactionVolume,
  });
  console.log('Tum testler basarili.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
