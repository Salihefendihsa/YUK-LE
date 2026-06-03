import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertBanner } from '../components/ui/AlertBanner';
import { AuthScreen } from '../components/ui/AuthScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { TextField } from '../components/ui/TextField';
import { authFormStyles as s } from '../constants/authFormStyles';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { formatPhone, normalizeLoginPhone } from '../utils/validators';
import { palette } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verified?: string; phone?: string; reset?: string }>();
  const setAuth = useAuthStore((st) => st.setAuth);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (params.verified === '1') {
      setInfo('Hesabınız doğrulandı, giriş yapabilirsiniz.');
      if (params.phone) {
        const d = normalizeLoginPhone(String(params.phone));
        if (d) setPhone(d);
      }
    } else if (params.reset === '1') {
      setInfo('Şifreniz güncellendi. Giriş yapabilirsiniz.');
    }
  }, [params.verified, params.phone, params.reset]);

  const handleLogin = async () => {
    const normalizedPhone = normalizeLoginPhone(phone);
    if (!normalizedPhone || !password) {
      setError('Telefon numarası ve şifre gerekli');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authService.login({ phone: normalizedPhone, password });
      setAuth(response);
      if (response.role === 'Customer') {
        router.replace('/(customer)/(tabs)/dashboard');
      } else if (response.role === 'Driver') {
        router.replace('/(driver)/(tabs)/dashboard');
      } else {
        setError('Bu hesap mobil uygulamada desteklenmiyor');
      }
    } catch (err: unknown) {
      const statusCode = (err as { response?: { status?: number } })?.response?.status;
      const payload = (err as {
        response?: { data?: { requiresVerification?: boolean; phone?: string } };
      })?.response?.data;

      if (statusCode === 403 && payload?.requiresVerification) {
        router.push({
          pathname: '/(auth)/verify-phone',
          params: { phone: payload.phone ?? normalizedPhone },
        });
        return;
      }

      setError(authService.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Giriş Yap"
      subtitle="Hesabınıza devam edin"
      footer={
        __DEV__ ? (
          <View style={styles.footer}>
            <View style={s.testBox}>
              <Text style={s.testTitle}>TEST KULLANICILARI</Text>
              <Text style={s.testItem}>Müşteri: 5000000001 / Test123!</Text>
              <Text style={s.testItem}>Şoför: 5000000002 / Test123!</Text>
            </View>
          </View>
        ) : null
      }
    >
      <TextField
        icon="call-outline"
        placeholder="5XXXXXXXXX"
        value={phone}
        onChangeText={(t) => setPhone(formatPhone(t))}
        keyboardType="phone-pad"
        maxLength={13}
      />

      <TextField
        icon="lock-closed-outline"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        right={
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={palette.textMuted}
            />
          </TouchableOpacity>
        }
      />

      <Pressable style={styles.forgot} onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={typography.link}>Şifremi Unuttum</Text>
      </Pressable>

      {info ? <AlertBanner message={info} tone="success" /> : null}
      {error ? <AlertBanner message={error} tone="error" /> : null}

      <PrimaryButton title="Giriş Yap" onPress={handleLogin} loading={loading} />

      <Pressable style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.registerText}>Hesabınız yok mu? Kayıt Ol</Text>
      </Pressable>

      <Pressable style={styles.adminLink} onPress={() => router.push('/(auth)/admin-login')}>
        <Text style={styles.adminText}>Admin Girişi</Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end', marginTop: -spacing[2], marginBottom: spacing[4] },
  registerLink: { marginTop: spacing[5], alignItems: 'center' },
  registerText: { ...typography.link },
  adminLink: { marginTop: spacing[3], alignItems: 'center' },
  adminText: { ...typography.caption, color: palette.textSecondary },
  footer: { marginTop: spacing[6], width: '100%' },
});
