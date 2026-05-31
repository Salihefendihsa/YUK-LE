import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { AuthScreen } from '../../src/components/ui/AuthScreen';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { TextField } from '../../src/components/ui/TextField';
import { authFormStyles as s } from '../../src/constants/authFormStyles';
import { authService } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/auth.store';
import { palette } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function AdminLoginRoute() {
  const router = useRouter();
  const setAuth = useAuthStore((st) => st.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const loginId = email.trim();
    if (!loginId || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authService.login({ phone: loginId, password });
      if (response.role !== 'Admin') {
        setError('Erişim reddedildi. Yalnızca yönetici hesapları giriş yapabilir.');
        return;
      }
      setAuth(response);
      router.replace('/(admin)/(tabs)/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'E-posta veya şifre hatalı.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Yönetici Girişi"
      subtitle="Yetkili personel — komuta merkezi"
      footer={
        <View style={styles.footer}>
          <Text style={styles.secureNote}>
            Yalnızca yetkili yönetici hesapları bu sayfadan giriş yapabilir.
          </Text>
          <View style={s.testBox}>
            <Text style={s.testTitle}>TEST ADMIN</Text>
            <Text style={s.testItem}>admin@navlonix.com / Admin123!</Text>
          </View>
        </View>
      }
      contentStyle={styles.adminCard}
    >
      <View style={styles.shieldRow}>
        <View style={styles.shieldBox}>
          <Ionicons name="shield-checkmark" size={28} color={palette.gold} />
        </View>
      </View>

      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={typography.link}>← Giriş ekranı</Text>
      </Pressable>

      <Text style={styles.fieldLabel}>E-posta</Text>
      <TextField
        icon="mail-outline"
        placeholder="admin@navlonix.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="username"
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

      {error ? <AlertBanner message={error} tone="error" /> : null}

      <PrimaryButton title="Giriş Yap" onPress={handleLogin} loading={loading} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  adminCard: { borderColor: palette.goldBorder },
  shieldRow: { alignItems: 'center', marginBottom: spacing[2] },
  shieldBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: palette.goldMuted,
    borderWidth: 1,
    borderColor: palette.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { marginBottom: spacing[2] },
  footer: { marginTop: spacing[6], width: '100%', gap: spacing[4] },
  secureNote: {
    ...typography.caption,
    textTransform: 'none',
    textAlign: 'center',
    color: palette.textMuted,
  },
  fieldLabel: {
    ...typography.caption,
    textTransform: 'none',
    marginBottom: spacing[1],
    color: palette.textSecondary,
  },
});
