/**
 * Sofor teklif -> musteri bildirim + unread count
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

async function login(phone, password) {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  if (!res.ok) throw new Error(`Login ${phone} (${res.status})`);
  const d = await res.json();
  return d.token ?? d.Token;
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${path} (${res.status}): ${data.message ?? text}`);
  return data;
}

async function post(path, token, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${path} (${res.status}): ${data.message ?? text}`);
  return data;
}

async function main() {
  const custToken = await login('5000000001', 'Test123!');
  const drvToken = await login('5000000002', 'Test123!');

  const before = await get('/Notifications/unread-count', custToken);
  const countBefore = before.count ?? before.Count ?? 0;
  console.log('Musteri unread once:', countBefore);

  const loads = await get('/Loads/active', drvToken);
  const list = Array.isArray(loads) ? loads : loads.items ?? loads.Items ?? [];
  const load = list[0];
  if (!load?.id) {
    console.log('Aktif ilan yok — e2e-marketplace calistirin');
    return;
  }
  console.log('Ilan:', load.id, load.fromCity, '->', load.toCity);

  try {
    await post('/Bids/submit', drvToken, { loadId: load.id, amount: 12000 + Math.floor(Math.random() * 500) });
    console.log('Teklif gonderildi');
    await new Promise((r) => setTimeout(r, 800));
    const after = await get('/Notifications/unread-count', custToken);
    console.log('Musteri unread sonra:', after.count ?? after.Count);
  } catch (e) {
    console.log('Teklif atlandi:', e.message);
  }

  const notes = await get('/Notifications?page=1&pageSize=3', custToken);
  const items = notes.items ?? notes.Items ?? [];
  const first = items[0];
  console.log('Son bildirim:', first?.title, '-', first?.message?.slice(0, 60));

  if (first?.id && !first.isRead) {
    await fetch(`${API}/Notifications/${first.id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${custToken}` },
    });
    const afterRead = await get('/Notifications/unread-count', custToken);
    console.log('Okundu sonrasi unread:', afterRead.count ?? afterRead.Count);
  }

  console.log('Bildirim API testi tamamlandi.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
