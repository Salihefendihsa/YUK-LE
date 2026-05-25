/**
 * FAZ 4 ADIM 1 — kayit, dogrulama, sifre sifirlama
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';

function digits(n) {
  return String(n).replace(/\D/g, '');
}

function suffix() {
  return String(Date.now()).slice(-7);
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(`${path} (${res.status}): ${data.message ?? text}`);
  return data;
}

async function login(phone, password) {
  const data = await post('/Auth/login', { phone, password });
  return data.token ?? data.Token;
}

async function main() {
  const s = suffix();
  const custPhone = `500${s}`.slice(0, 10);
  const drvPhone = `501${String(Number(s) + 17).slice(-7)}`.slice(0, 10);
  const password = 'Test1234!';
  const newPassword = 'Test5678!';

  console.log('Musteri telefon:', custPhone);
  await post('/Auth/register', {
    fullName: 'Test Müşteri A.Ş.',
    phone: custPhone,
    email: `musteri${s}@test.com`,
    password,
    role: 'Customer',
    isCorporate: true,
    companyName: 'Test Lojistik',
    taxNumber: '1234567890',
    companyAddress: 'Istanbul Merkez Mah. No 1',
    tcIdentityNumber: '',
    acceptedKvkk: true,
    acceptedTerms: true,
    acceptedLocationTracking: false,
    taxNumberOrTCKN: '1234567890',
  });
  await post('/Auth/verify-otp', { phone: custPhone, code: '123456' });
  const custToken = await login(custPhone, password);
  console.log('Musteri login OK, token?', !!custToken);

  console.log('Sofor telefon:', drvPhone);
  await post('/Auth/register', {
    fullName: 'Test Şoför',
    phone: drvPhone,
    email: `sofor${s}@test.com`,
    password,
    role: 'Driver',
    isCorporate: false,
    companyName: '',
    taxNumber: '',
    companyAddress: '',
    tcIdentityNumber: '11111111110',
    birthDate: '1990-01-15',
    iban: 'TR330006100519786457841326',
    address: 'Ankara Cankaya Mah. No 5',
    licenseClass: 'C',
    acceptedKvkk: true,
    acceptedTerms: true,
    acceptedLocationTracking: true,
    taxNumberOrTCKN: '11111111110',
  });
  await post('/Auth/verify-otp', { phone: drvPhone, code: '123456' });
  const drvToken = await login(drvPhone, password);
  console.log('Sofor login OK, token?', !!drvToken);

  await new Promise((r) => setTimeout(r, 2000));
  await post('/Auth/forgot-password', { phone: custPhone });
  await post('/Auth/verify-otp', { phone: custPhone, code: '123456', purpose: 'PasswordReset' });
  await new Promise((r) => setTimeout(r, 1500));
  await post('/Auth/reset-password', { phone: custPhone, otpCode: '123456', newPassword });
  await login(custPhone, newPassword);
  console.log('Sifremi unuttum akisi OK');

  console.log('Tum auth testleri basarili.');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
