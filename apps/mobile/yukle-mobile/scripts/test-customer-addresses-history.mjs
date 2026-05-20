/**
 * Musteri adres CRUD + gecmis sefer testi
 * Kullanim: node scripts/test-customer-addresses-history.mjs
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
  return data.token ?? data.accessToken;
}

async function main() {
  console.log('API:', API);
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const createRes = await fetch(`${API}/DeliveryAddresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Mobil Test Depo',
      companyName: 'Test A.S.',
      contactPerson: 'Ahmet Yilmaz',
      contactPhone: '5551112233',
      address: 'OSB 1. Cadde No:5',
      city: 'Elazig',
      district: 'OSB',
      isDefault: false,
    }),
  });
  if (!createRes.ok) throw new Error(`Create address (${createRes.status}): ${await createRes.text()}`);
  const created = await createRes.json();
  const addrId = created.id ?? created.Id;
  console.log('1) Adres eklendi:', addrId);

  const listRes = await fetch(`${API}/DeliveryAddresses`, { headers });
  const list = await listRes.json();
  console.log('2) Adres sayisi:', list.length);

  const setDefRes = await fetch(`${API}/DeliveryAddresses/${addrId}/set-default`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!setDefRes.ok) throw new Error(`Set default (${setDefRes.status}): ${await setDefRes.text()}`);
  console.log('3) Varsayilan yapildi');

  const delRes = await fetch(`${API}/DeliveryAddresses/${addrId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!delRes.ok) throw new Error(`Delete (${delRes.status}): ${await delRes.text()}`);
  console.log('4) Adres silindi');

  const histRes = await fetch(`${API}/Loads/history?page=1&pageSize=50`, { headers });
  if (!histRes.ok) throw new Error(`History (${histRes.status}): ${await histRes.text()}`);
  const hist = await histRes.json();
  const items = hist.items ?? hist.Items ?? [];
  const totalSpend = hist.totalSpend ?? hist.TotalSpend ?? 0;
  console.log('5) Gecmis sefer sayisi:', items.length, '| Toplam harcama:', totalSpend);
  if (items.length > 0) {
    const first = items[0];
    console.log('   Ornek:', first.fromCity, '->', first.toCity, '| Sofor:', first.driverName ?? first.DriverName ?? '-');
  } else {
    console.log('   (Bos liste — once E2E ile teslim edilmis ilan gerekir)');
  }
  console.log('Test tamamlandi.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
