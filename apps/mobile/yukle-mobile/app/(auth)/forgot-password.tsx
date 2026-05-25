import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { AuthScreen } from '../../src/components/ui/AuthScreen';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { TextField } from '../../src/components/ui/TextField';
import { authService } from '../../src/services/auth.service';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';
import { digitsOnly, formatPhone, validatePhone } from '../../src/utils/validators';

type Step = 1 | 2 | 3;

const stepSub: Record<Step, string> = {
  1: 'Telefon numaranızı girin, OTP gönderelim.',
  2: 'Telefonunuza gelen 6 haneli kodu girin.',
  3: 'Yeni şifrenizi belirleyin.',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phoneDigits = digitsOnly(phone).slice(0, 10);

  const submitPhone = async () => {
    if (!validatePhone(phoneDigits)) {
      setError('Telefon 5 ile başlayan 10 hane olmalı');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword({ phone: phoneDigits });
      setStep(2);
    } catch (e) {
      setError(authService.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('6 haneli OTP girin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp({
        phone: phoneDigits,
        code: otp.trim(),
        purpose: 'PasswordReset',
      });
      setStep(3);
    } catch (e) {
      setError(authService.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async () => {
    if (newPassword.length < 8 || newPassword !== newPassword2) {
      setError('Yeni şifre en az 8 karakter ve tekrar eşleşmeli');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword({
        phone: phoneDigits,
        otpCode: otp.trim(),
        newPassword,
      });
      router.replace({
        pathname: '/(auth)/login',
        params: { reset: '1' },
      });
    } catch (e) {
      setError(authService.getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Şifremi Unuttum" subtitle={stepSub[step]}>
      {error ? <AlertBanner message={error} tone="error" /> : null}

      {step === 1 ? (
        <>
          <TextField
            label="Telefon"
            icon="call-outline"
            placeholder="5XXXXXXXXX"
            value={phone}
            onChangeText={(t) => setPhone(formatPhone(t))}
            keyboardType="phone-pad"
            maxLength={13}
          />
          <PrimaryButton title="OTP Gönder" onPress={submitPhone} loading={loading} />
        </>
      ) : null}

      {step === 2 ? (
        <>
          <TextField
            label="OTP Kodu"
            icon="keypad-outline"
            placeholder="6 haneli kod"
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
          />
          <PrimaryButton title="OTP Doğrula" onPress={submitOtp} loading={loading} />
        </>
      ) : null}

      {step === 3 ? (
        <>
          <TextField
            label="Yeni şifre"
            icon="lock-closed-outline"
            placeholder="En az 8 karakter"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextField
            label="Yeni şifre tekrar"
            icon="lock-closed-outline"
            placeholder="Tekrar girin"
            value={newPassword2}
            onChangeText={setNewPassword2}
            secureTextEntry
          />
          <PrimaryButton title="Şifreyi Sıfırla" onPress={submitReset} loading={loading} />
        </>
      ) : null}

      <Pressable onPress={() => router.push('/(auth)/login')} style={styles.back}>
        <Text style={typography.link}>Girişe dön</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  back: { marginTop: spacing[5], alignItems: 'center' },
});
