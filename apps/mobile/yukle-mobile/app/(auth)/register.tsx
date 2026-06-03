import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { AuthScreen } from '../../src/components/ui/AuthScreen';
import { FadeInView } from '../../src/components/ui/FadeInView';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { TextField } from '../../src/components/ui/TextField';
import { authFormStyles as s } from '../../src/constants/authFormStyles';
import { palette } from '../../src/theme/colors';
import { space, spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
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
      setError('Telefon 5 ile başlayan 10 hane olmalı');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Geçerli e-posta girin');
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
        setError('Şirket adı en az 2 karakter');
        return false;
      }
      if (!validateTaxNumber(taxDigits)) {
        setError('Vergi numarası 10 hane olmalı');
        return false;
      }
      if (companyAddress.trim().length < 10) {
        setError('Şirket adresi en az 10 karakter');
        return false;
      }
    } else {
      if (!validateTC(tcDigits)) {
        setError('TC kimlik 11 hane olmalı');
        return false;
      }
      if (!birthDate.trim()) {
        setError('Doğum tarihi gerekli (YYYY-MM-DD)');
        return false;
      }
      if (!isAdult(birthDate)) {
        setError('18 yaşından büyük olmalısınız');
        return false;
      }
      const ibanNorm = iban.replace(/\s/g, '').toUpperCase();
      if (!validateIBAN(ibanNorm)) {
        setError('IBAN TR + 24 hane olmalı');
        return false;
      }
      if (address.trim().length < 10) {
        setError('İkametgah adresi en az 10 karakter');
        return false;
      }
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (!passwordState.valid) {
      setError('Şifre en az 8 karakter, büyük-küçük harf ve rakam içermeli');
      return;
    }
    if (!acceptedKvkk || !acceptedTerms) {
      setError('KVKK ve kullanım koşulları zorunludur');
      return;
    }
    if (role === 'Driver' && !acceptedLocationTracking) {
      setError('Konum takibi onayı zorunludur');
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
    <AuthScreen title="Hesap Oluştur" subtitle="Platforma ücretsiz katılın">
      <View style={s.roleRow}>
        <Pressable
          style={[s.roleBtn, role === 'Customer' && s.roleBtnActive]}
          onPress={() => setRole('Customer')}
        >
          <Text style={[s.roleBtnText, role === 'Customer' && s.roleBtnTextActive]}>Müşteri</Text>
        </Pressable>
        <Pressable
          style={[s.roleBtn, role === 'Driver' && s.roleBtnActive]}
          onPress={() => setRole('Driver')}
        >
          <Text style={[s.roleBtnText, role === 'Driver' && s.roleBtnTextActive]}>Şoför</Text>
        </Pressable>
      </View>

      <Text style={s.stepBadge}>Adım {step} / 3</Text>
      {error ? <AlertBanner message={error} tone="error" /> : null}

      {step === 1 ? (
        <FadeInView key="step1">
          <TextField
            label="Ad Soyad *"
            icon="person-outline"
            placeholder="Ad Soyad"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TextField
            label="Telefon *"
            icon="call-outline"
            placeholder="5XXXXXXXXX"
            value={phone}
            onChangeText={(t) => setPhone(formatPhone(t))}
            keyboardType="phone-pad"
            maxLength={13}
          />
          <TextField
            label="E-posta *"
            icon="mail-outline"
            placeholder="ornek@firma.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={s.stepRow}>
            <View />
            <Pressable
              style={[s.stepBtn, s.stepBtnPrimary]}
              onPress={() => validateStep1() && setStep(2)}
            >
              <Text style={s.stepBtnTextPrimary}>İleri</Text>
            </Pressable>
          </View>
        </FadeInView>
      ) : null}

      {step === 2 ? (
        <FadeInView key={`step2-${role}`}>
          {role === 'Customer' ? (
            <>
              <TextField
                label="Vergi Numarası *"
                icon="business-outline"
                placeholder="1234567890"
                value={taxNumber}
                onChangeText={(t) => setTaxNumber(digitsOnly(t).slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
              />
              <TextField
                label="Şirket Adı *"
                icon="briefcase-outline"
                placeholder="ABC Lojistik A.Ş."
                value={companyName}
                onChangeText={setCompanyName}
              />
              <TextField
                label="Şirket Adresi *"
                icon="location-outline"
                placeholder="Mahalle, Sokak, No, İlçe, İl"
                value={companyAddress}
                onChangeText={setCompanyAddress}
                multiline
              />
            </>
          ) : (
            <>
              <TextField
                label="TC Kimlik No *"
                icon="card-outline"
                placeholder="11 hane"
                value={tcIdentityNumber}
                onChangeText={(t) => setTcIdentityNumber(digitsOnly(t).slice(0, 11))}
                keyboardType="number-pad"
                maxLength={11}
              />
              <TextField
                label="Doğum Tarihi * (YYYY-MM-DD)"
                icon="calendar-outline"
                placeholder="1990-05-15"
                value={birthDate}
                onChangeText={setBirthDate}
                autoCapitalize="none"
              />
              <Text style={[typography.caption, { textTransform: 'none', color: palette.textSecondary, marginBottom: space.sm }]}>
                Ehliyet Sınıfı *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
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
              <TextField
                label="IBAN *"
                icon="wallet-outline"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                value={iban}
                onChangeText={(t) => setIban(formatIBAN(t).slice(0, 32))}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TextField
                label="İkametgah Adresi *"
                icon="home-outline"
                placeholder="Mahalle, Sokak, No, İlçe, İl"
                value={address}
                onChangeText={setAddress}
                multiline
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
              <Text style={s.stepBtnTextPrimary}>İleri</Text>
            </Pressable>
          </View>
        </FadeInView>
      ) : null}

      {step === 3 ? (
        <FadeInView key="step3">
          <TextField
            label="Şifre *"
            icon="lock-closed-outline"
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={[typography.bodySmall, { marginTop: -spacing[2], marginBottom: spacing[3], color: palette.textMuted }]}>
            Güç: {passwordState.strength}
          </Text>
          <TextField
            label="Şifre Tekrar *"
            icon="lock-closed-outline"
            placeholder="********"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <View style={s.checkRow}>
            <Switch value={acceptedKvkk} onValueChange={setAcceptedKvkk} trackColor={{ true: palette.brand, false: palette.borderLight }} />
            <Text style={s.checkLabel}>KVKK metnini kabul ediyorum</Text>
          </View>
          <View style={s.checkRow}>
            <Switch value={acceptedTerms} onValueChange={setAcceptedTerms} trackColor={{ true: palette.brand, false: palette.borderLight }} />
            <Text style={s.checkLabel}>Kullanım koşullarını kabul ediyorum</Text>
          </View>
          {role === 'Driver' ? (
            <View style={s.checkRow}>
              <Switch
                value={acceptedLocationTracking}
                onValueChange={setAcceptedLocationTracking}
                trackColor={{ true: palette.brand, false: palette.borderLight }}
              />
              <Text style={s.checkLabel}>Aktif seferde konum takibine onay veriyorum</Text>
            </View>
          ) : null}
          <PrimaryButton title="Hesap Oluştur" onPress={handleSubmit} loading={loading} />
          <Pressable style={[s.stepBtn, { marginTop: spacing[3], alignItems: 'center' }]} onPress={() => setStep(2)}>
            <Text style={s.stepBtnText}>Geri</Text>
          </Pressable>
        </FadeInView>
      ) : null}

      <Pressable onPress={() => router.push('/(auth)/login')}>
        <Text style={s.link}>Zaten hesabınız var mı? Giriş Yap</Text>
      </Pressable>
    </AuthScreen>
  );
}
