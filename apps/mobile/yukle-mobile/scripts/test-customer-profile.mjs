/**
 * Musteri profil GET/PUT dogrulama
 * Kullanim: node scripts/test-customer-profile.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';
const PHONE = '5000000001';
const PASSWORD = 'Test123!';

async function login() {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const token = data.token ?? data.accessToken;
  const userId = data.userId ?? data.UserId;
  if (!token || userId == null) throw new Error('Login missing token or userId');
  return { token, userId };
}

async function main() {
  console.log('API:', API);
  const { token, userId } = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  console.log('Login OK, userId:', userId);

  const getRes = await fetch(`${API}/Users/${userId}`, { headers });
  if (!getRes.ok) throw new Error(`GET profile (${getRes.status}): ${await getRes.text()}`);
  const profile = await getRes.json();
  console.log('GET /Users/{id}:', profile.fullName, '|', profile.role, '|', profile.email);

  const putRes = await fetch(`${API}/Users/${userId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      fullName: profile.fullName,
      email: profile.email,
      companyName: profile.companyName || 'Mobil Test A.S.',
      companyAddress: profile.companyAddress || 'Test OSB',
    }),
  });
  if (!putRes.ok) throw new Error(`PUT profile (${putRes.status}): ${await putRes.text()}`);
  console.log('PUT /Users/{id}: OK');

  const histRes = await fetch(`${API}/Loads/history?page=1&pageSize=5`, { headers });
  if (!histRes.ok) throw new Error(`History (${histRes.status})`);
  const hist = await histRes.json();
  const n = (hist.items ?? hist.Items ?? []).length;
  console.log('GET /Loads/history (analitik icin gercek sefer verisi ayri):', n, 'kayit');
  console.log('Analitik ekrani: DEMO (API yok, web ile ayni)');
  console.log('Test tamamlandi.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
