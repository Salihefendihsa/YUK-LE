/**
 * FAZ 3 ADIM 5 — admin sistem modulleri
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

async function login() {
  const res = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: 'admin@yuk-le.com', password: 'Admin123!' }),
  });
  if (!res.ok) throw new Error(`Login (${res.status})`);
  const data = await res.json();
  return data.token ?? data.Token;
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`${path} (${res.status})`);
  return res.json();
}

async function main() {
  const token = await login();
  const [sys, ext, logs, blocked, chats, drivers, ratings] = await Promise.all([
    get('/Admin/system', token),
    get('/System/status', token),
    get('/Admin/logs', token),
    get('/Admin/blocked-messages', token),
    get('/Admin/chats', token),
    get('/Admin/active-drivers', token),
    get('/Ratings/all', token),
  ]);

  console.log('System:', sys.api, sys.db, 'U-ETDS:', sys.workers?.uetdsPending);
  console.log('External:', ext.message?.slice(0, 40));
  console.log('Logs:', logs.length);
  console.log('Blocked:', blocked.length);
  console.log('Chats:', chats.length);
  console.log('Active drivers:', drivers.length);
  console.log('Ratings:', ratings.length);

  if (chats[0]) {
    const msgs = await get(`/Admin/chats/${chats[0].loadId}`, token);
    console.log('Chat messages sample:', msgs.length);
  }

  console.log('ADIM 5 API test OK');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
