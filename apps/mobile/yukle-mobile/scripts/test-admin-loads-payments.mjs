/**
 * Admin ilan + odeme testi
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

async function main() {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const loadsRes = await fetch(`${API}/Admin/loads`, { headers });
  if (!loadsRes.ok) throw new Error(`loads (${loadsRes.status})`);
  const loads = await loadsRes.json();
  console.log('Ilan sayisi:', loads.length);
  if (loads[0]) {
    console.log('Ornek ilan:', loads[0].fromCity, '->', loads[0].toCity, loads[0].status);
  }

  const payRes = await fetch(`${API}/Admin/payments`, { headers });
  if (!payRes.ok) throw new Error(`payments (${payRes.status})`);
  const payments = await payRes.json();
  console.log('Odeme sayisi:', payments.length);
  const blocked = payments.filter((p) => p.status === 'Blocked');
  console.log('Havuzda (Blocked):', blocked.length);

  const cancellable = loads.find(
    (l) => l.status === 'Active' || l.status === 'Assigned' || l.status === 'OnWay'
  );
  if (cancellable) {
    const id = cancellable.id;
    const cancelRes = await fetch(`${API}/Admin/loads/${id}/cancel`, {
      method: 'POST',
      headers,
    });
    console.log('Iptal test:', cancelRes.status, cancelRes.ok ? 'OK' : await cancelRes.text());
  } else {
    console.log('Iptal test atlandi — uygun durumda ilan yok');
  }

  if (blocked[0]) {
    const relRes = await fetch(`${API}/Admin/payments/${blocked[0].id}/release`, {
      method: 'POST',
      headers,
    });
    console.log('Release test:', relRes.status, relRes.ok ? 'OK' : await relRes.text());
  } else {
    console.log('Release test atlandi — Blocked odeme yok');
  }

  console.log('Test tamamlandi.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
