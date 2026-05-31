/**
 * Admin belge kuyrugu testi
 * Kullanim: node scripts/test-admin-reviews.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

async function login(emailOrPhone, password) {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: emailOrPhone, password }),
  });
  if (!res.ok) throw new Error(`Login (${res.status}): ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('API:', API);
  const admin = await login('admin@navlonix.com', 'Admin123!');
  const token = admin.token ?? admin.Token;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const listRes = await fetch(`${API}/Admin/pending-reviews`, { headers });
  if (!listRes.ok) throw new Error(`pending-reviews (${listRes.status}): ${await listRes.text()}`);
  const list = await listRes.json();
  const items = Array.isArray(list) ? list : [];
  console.log('Bekleyen inceleme:', items.length);

  if (items.length === 0) {
    console.log('Kuyruk bos. Test icin sofor (5000000002) ile belge yukleyip');
    console.log('AI gri alan (PendingReview) durumuna dusmesi gerekir.');
    console.log('Mevcut test soforu genelde Active — belge OCR sonrasi kuyruga duser.');
    return;
  }

  const first = items[0];
  const userId = first.id ?? first.Id;
  console.log('Ornek:', first.fullName, '| id:', userId);

  const decideRes = await fetch(`${API}/Admin/reviews/${userId}/decide`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      isApproved: true,
      reason: 'Mobil API test — belgeler manuel onaylandi.',
    }),
  });
  if (!decideRes.ok) throw new Error(`decide (${decideRes.status}): ${await decideRes.text()}`);
  console.log('Onay OK:', await decideRes.json());

  const list2 = await fetch(`${API}/Admin/pending-reviews`, { headers });
  const after = await list2.json();
  console.log('Kuyruk sonra:', Array.isArray(after) ? after.length : 0);
  console.log('Test tamamlandi.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
