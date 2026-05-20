import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { AuthScreen } from '../../src/components/ui/AuthScreen';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { authFormStyles as s } from '../../src/constants/authFormStyles';
import { authService } from '../../src/services/auth.service';
import { palette } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontFamily, typography } from '../../src/theme/typography';
import { digitsOnly } from '../../src/utils/validators';

const OTP_LENGTH = 6;

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = digitsOnly(String(params.phone ?? '')).slice(0, 10);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(60);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const submitCode = async (code: string) => {
    if (!phone) {
      setError('Telefon numarasi eksik. Kayit ekranina donun.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authService.verifyOtp({ phone, code });
      router.replace({
        pathname: '/(auth)/login',
        params: { verified: '1', phone },
      });
    } catch (e) {
      setError(authService.getErrorMessage(e));
      setDigits(Array(OTP_LENGTH).fill(''));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[i] = val.slice(-1);
    setDigits(next);
    if (val && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) void submitCode(next.join(''));
  };

  const handleResend = async () => {
    if (!phone) return;
    setResendBusy(true);
    setError('');
    try {
      await authService.resendVerificationOtp(phone);
      setSecondsLeft(60);
      setError('');
    } catch (e) {
      setError(authService.getErrorMessage(e));
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <AuthScreen
      title="Telefon Dogrulama"
      subtitle={`${phone || '?'} numarasina gonderilen 6 haneli kodu girin`}
    >
      <Text style={styles.hint}>Development: 123456</Text>

      {error ? <AlertBanner message={error} tone="error" /> : null}

      <View style={s.otpRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            style={[s.otpBox, d ? s.otpBoxFilled : null]}
            value={d}
            onChangeText={(t) => handleChange(i, t)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!loading}
          />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={palette.brand} style={{ marginBottom: spacing[4] }} />
      ) : null}

      <PrimaryButton
        title="Dogrula"
        onPress={() => void submitCode(digits.join(''))}
        loading={loading}
      />

      {secondsLeft > 0 ? (
        <Text style={[styles.resendWait, { textAlign: 'center' }]}>
          Kodu tekrar gonder: {secondsLeft}s
        </Text>
      ) : (
        <Pressable onPress={() => void handleResend()} disabled={resendBusy} style={styles.resendBtn}>
          <Text style={typography.link}>
            {resendBusy ? 'Gonderiliyor...' : 'Kodu Tekrar Gonder'}
          </Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.push('/(auth)/login')} style={styles.back}>
        <Text style={typography.link}>Giris ekranina don</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...typography.caption,
    marginBottom: spacing[4],
    color: palette.textMuted,
    textTransform: 'none',
  },
  resendWait: { ...typography.caption, marginTop: spacing[4], textTransform: 'none' },
  resendBtn: { marginTop: spacing[4], alignItems: 'center' },
  back: { marginTop: spacing[6], alignItems: 'center' },
});
