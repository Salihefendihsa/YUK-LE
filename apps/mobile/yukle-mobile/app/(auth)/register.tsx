import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { AuthScreen } from '../../src/components/ui/AuthScreen';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { authFormStyles as s } from '../../src/constants/authFormStyles';
import { palette } from '../../src/theme/colors';
import { authService } from '../../src/services/auth.service';
import type { RegisterRole } from '../../src/types/auth';
import {
  digitsOnly,
  formatIBAN,
  formatPhone,
  isAdult,
  validateEmail,
  validateIBAN,
  validatePassword,
  validatePhone,
  validateTaxNumber,
  validateTC,
} from '../../src/utils/validators';

const LICENSE_CLASSES = ['B', 'C', 'CE', 'D', 'DE', 'E'];

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<RegisterRole>('Customer');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [tcIdentityNumber, setTcIdentityNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [licenseClass, setLicenseClass] = useState('B');
  const [iban, setIban] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedLocationTracking, setAcceptedLocationTracking] = useState(false);

  const passwordState = validatePassword(password);

  const validateStep1 = (): boolean => {
    const p = digitsOnly(phone).slice(0, 10);
    if (!fullName.trim()) {
      setError('Ad soyad gerekli');
      return false;
    }
    if (!validatePhone(p)) {
      setError('Telefon 5 ile baslayan 10 hane olmali');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Gecerli e-posta girin');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep2 = (): boolean => {
    const taxDigits = digitsOnly(taxNumber).slice(0, 10);
    const tcDigits = digitsOnly(tcIdentityNumber).slice(0, 11);
    if (role === 'Customer') {
      if (companyName.trim().length < 2) {
        setError('Sirket adi en az 2 karakter');
        return false;
      }
      if (!validateTaxNumber(taxDigits)) {
        setError('Vergi numarasi 10 hane olmali');
        return false;
      }
      if (companyAddress.trim().length < 10) {
        setError('Sirket adresi en az 10 karakter');
        return false;
      }
    } else {
      if (!validateTC(tcDigits)) {
        setError('TC kimlik 11 hane olmali');
        return false;
      }
      if (!birthDate.trim()) {
        setError('Dogum tarihi gerekli (YYYY-MM-DD)');
        return false;
      }
      if (!isAdult(birthDate)) {
        setError('18 yasindan buyuk olmalisiniz');
        return false;
      }
      const ibanNorm = iban.replace(/\s/g, '').toUpperCase();
      if (!validateIBAN(ibanNorm)) {
        setError('IBAN TR + 24 hane olmali');
        return false;
      }
      if (address.trim().length < 10) {
        setError('Ikametgah adresi en az 10 karakter');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Sifreler eslesmiyor');
      return;
    }
    if (!passwordState.valid) {
      setError('Sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli');
      return;
    }
    if (!acceptedKvkk || !acceptedTerms) {
      setError('KVKK ve kullanim kosullari zorunlu');
      return;
    }
    if (role === 'Driver' && !acceptedLocationTracking) {
      setError('Konum takibi onayi zorunlu');
      return;
    }

    const normalizedPhone = digitsOnly(phone).slice(0, 10);
    const taxDigits = digitsOnly(taxNumber).slice(0, 10);
    const tcDigits = digitsOnly(tcIdentityNumber).slice(0, 11);
    const ibanNorm = iban.replace(/\s/g, '').toUpperCase();

    setLoading(true);
    setError('');
    try {
      await authService.register({
        fullName: fullName.trim(),
        phone: normalizedPhone,
        email: email.trim(),
        password,
        role,
        isCorporate: role === 'Customer',
        companyName: companyName.trim(),
        taxNumber: taxDigits,
        companyAddress: companyAddress.trim(),
        tcIdentityNumber: tcDigits,
        birthDate: role === 'Driver' ? birthDate.trim() : undefined,
        iban: role === 'Driver' ? ibanNorm : undefined,
        address: role === 'Driver' ? address.trim() : undefined,
        licenseClass: role === 'Driver' ? licenseClass : undefined,
        acceptedKvkk,
        acceptedTerms,
        acceptedLocationTracking: role === 'Driver' ? acceptedLocationTracking : false,
        taxNumberOrTCKN: role === 'Driver' ? tcDigits : taxDigits,
      });
      router.replace({
        pathname: '/(auth)/verify-phone',
        params: { phone: normalizedPhone },
      });
    } catch (e) {
      setError(authService.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Hesap Olustur" subtitle="Platforma ucretsiz katilin">
        <View style={s.roleRow}>
          <Pressable
            style={[s.roleBtn, role === 'Customer' && s.roleBtnActive]}
            onPress={() => setRole('Customer')}
          >
            <Text style={[s.roleBtnText, role === 'Customer' && s.roleBtnTextActive]}>Musteri</Text>
          </Pressable>
          <Pressable
            style={[s.roleBtn, role === 'Driver' && s.roleBtnActive]}
            onPress={() => setRole('Driver')}
          >
            <Text style={[s.roleBtnText, role === 'Driver' && s.roleBtnTextActive]}>Sofor</Text>
          </Pressable>
        </View>

        <Text style={s.stepBadge}>Adim {step} / 3</Text>
        {error ? <AlertBanner message={error} tone="error" /> : null}

        {step === 1 ? (
          <>
            <Text style={s.label}>Ad Soyad *</Text>
            <TextInput
              style={s.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ad Soyad"
              placeholderTextColor={palette.textMuted}
            />
            <Text style={s.label}>Telefon *</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              keyboardType="phone-pad"
              maxLength={13}
              placeholder="5XX XXX XX XX"
              placeholderTextColor={palette.textMuted}
            />
            <Text style={s.label}>E-posta *</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="ornek@firma.com"
              placeholderTextColor={palette.textMuted}
            />
            <View style={s.stepRow}>
              <View />
              <Pressable
                style={[s.stepBtn, s.stepBtnPrimary]}
                onPress={() => validateStep1() && setStep(2)}
              >
                <Text style={s.stepBtnTextPrimary}>Ileri</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            {role === 'Customer' ? (
              <>
                <Text style={s.label}>Vergi Numarasi *</Text>
                <TextInput
                  style={s.input}
                  value={taxNumber}
                  onChangeText={(t) => setTaxNumber(digitsOnly(t).slice(0, 10))}
                  keyboardType="number-pad"
                  maxLength={10}
                  placeholderTextColor={palette.textMuted}
                />
                <Text style={s.label}>Sirket Adi *</Text>
                <TextInput
                  style={s.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholderTextColor={palette.textMuted}
                />
                <Text style={s.label}>Sirket Adresi *</Text>
                <TextInput
                  style={s.input}
                  value={companyAddress}
                  onChangeText={setCompanyAddress}
                  placeholderTextColor={palette.textMuted}
                />
              </>
            ) : (
              <>
                <Text style={s.label}>TC Kimlik No *</Text>
                <TextInput
                  style={s.input}
                  value={tcIdentityNumber}
                  onChangeText={(t) => setTcIdentityNumber(digitsOnly(t).slice(0, 11))}
                  keyboardType="number-pad"
                  maxLength={11}
                  placeholderTextColor={palette.textMuted}
                />
                <Text style={s.label}>Dogum Tarihi * (YYYY-MM-DD)</Text>
                <TextInput
                  style={s.input}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="1990-05-15"
                  placeholderTextColor={palette.textMuted}
                />
                <Text style={s.label}>Ehliyet Sinifi *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {LICENSE_CLASSES.map((c) => (
                    <Pressable
                      key={c}
                      style={[s.stepBtn, licenseClass === c && s.stepBtnPrimary]}
                      onPress={() => setLicenseClass(c)}
                    >
                      <Text style={licenseClass === c ? s.stepBtnTextPrimary : s.stepBtnText}>{c}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={s.label}>IBAN *</Text>
                <TextInput
                  style={s.input}
                  value={iban}
                  onChangeText={(t) => setIban(formatIBAN(t).slice(0, 32))}
                  placeholder="TR00 0000..."
                  placeholderTextColor={palette.textMuted}
                />
                <Text style={s.label}>Ikametgah Adresi *</Text>
                <TextInput
                  style={s.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholderTextColor={palette.textMuted}
                />
              </>
            )}
            <View style={s.stepRow}>
              <Pressable style={s.stepBtn} onPress={() => setStep(1)}>
                <Text style={s.stepBtnText}>Geri</Text>
              </Pressable>
              <Pressable
                style={[s.stepBtn, s.stepBtnPrimary]}
                onPress={() => validateStep2() && setStep(3)}
              >
                <Text style={s.stepBtnTextPrimary}>Ileri</Text>
              </Pressable>
            </View>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={s.label}>Sifre *</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={palette.textMuted}
            />
            <Text style={[s.sub, { marginTop: -8 }]}>Guc: {passwordState.strength}</Text>
            <Text style={s.label}>Sifre Tekrar *</Text>
            <TextInput
              style={s.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor={palette.textMuted}
            />
            <View style={s.checkRow}>
              <Switch value={acceptedKvkk} onValueChange={setAcceptedKvkk} trackColor={{ true: palette.brand }} />
              <Text style={s.checkLabel}>KVKK metnini kabul ediyorum</Text>
            </View>
            <View style={s.checkRow}>
              <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} trackColor={{ true: palette.brand }} />
              <Text style={s.checkLabel}>Kullanim kosullarini kabul ediyorum</Text>
            </View>
            {role === 'Driver' ? (
              <View style={s.checkRow}>
                <Switch
                  value={acceptedLocationTracking}
                  onValueChange={setAcceptedLocationTracking}
                  trackColor={{ true: palette.brand }}
                />
                <Text style={s.checkLabel}>Aktif seferde konum takibine onay veriyorum</Text>
              </View>
            ) : null}
            <PrimaryButton title="Hesap Olustur" onPress={handleSubmit} loading={loading} />
            <Pressable style={s.stepBtn} onPress={() => setStep(2)}>
              <Text style={[s.stepBtnText, { textAlign: 'center', marginTop: 8 }]}>Geri</Text>
            </Pressable>
          </>
        ) : null}

        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={s.link}>Zaten hesabiniz var mi? Giris Yap</Text>
        </Pressable>
    </AuthScreen>
  );
}
