/**
 * Development OTP flow: register -> verify with 123456
 * Usage: node scripts/test-register-otp.mjs
 */
const API = process.env.API_URL ?? 'http://localhost:5151/api';
const OTP = '123456';

async function main() {
  const phone = `5${String(Date.now()).slice(-9)}`;
  const email = `otp-test-${Date.now()}@yukle.test`;

  console.log('API:', API);
  console.log('Phone:', phone);

  const regRes = await fetch(`${API}/Auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'OTP Test User',
      phone,
      email,
      password: 'Test123!',
      role: 'Customer',
      isCorporate: true,
      companyName: 'OTP Test Ltd',
      taxNumber: '1234567890',
      companyAddress: 'Test Mahallesi No 1 Istanbul',
      acceptedKvkk: true,
      acceptedTerms: true,
    }),
  });

  if (!regRes.ok) {
    throw new Error(`Register failed (${regRes.status}): ${await regRes.text()}`);
  }
  console.log('1) Register OK');

  const verifyRes = await fetch(`${API}/Auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code: OTP }),
  });

  if (!verifyRes.ok) {
    throw new Error(`Verify OTP failed (${verifyRes.status}): ${await verifyRes.text()}`);
  }
  console.log('2) Verify OTP OK with', OTP);

  const loginRes = await fetch(`${API}/Auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password: 'Test123!' }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login after verify failed (${loginRes.status}): ${await loginRes.text()}`);
  }
  console.log('3) Login after verify OK');
  console.log('Register + OTP flow PASSED');
}

main().catch((e) => {
  console.error('FAIL:', e.message ?? e);
  process.exitCode = 1;
});
