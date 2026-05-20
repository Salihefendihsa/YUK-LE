import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { YukleButton } from '../../src/components/YukleButton';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { authService } from '../../src/services/auth.service';
import { useAuthStore } from '../../src/store/auth.store';

export default function AdminLoginRoute() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const loginId = email.trim();
    if (!loginId || !password) {
      setError('E-posta ve sifre gerekli.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await authService.login({ phone: loginId, password });
      if (response.role !== 'Admin') {
        setError('Erisim reddedildi. Yetkisiz giris denemesi kayit altindadir.');
        return;
      }
      setAuth(response);
      router.replace('/(admin)/(tabs)/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'E-posta veya sifre hatali.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Giris ekrani</Text>
        </TouchableOpacity>

        <View style={styles.logoSection}>
          <View style={styles.shieldBox}>
            <Ionicons name="shield-checkmark-outline" size={32} color={Colors.primaryGold} />
          </View>
          <Text style={styles.title}>Yonetici Girisi</Text>
          <Text style={styles.subtitle}>Yetkili personel girisi</Text>
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="admin@yuk-le.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.icon} />
          <TextInput
            style={[styles.input, styles.inputFlex]}
            placeholder="********"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <YukleButton title="Giris Yap" onPress={handleLogin} loading={loading} />

        <Text style={styles.secureNote}>Bu sayfa korumalidir. Tum giris denemeleri kayit altindadir.</Text>

        <View style={styles.testBox}>
          <Text style={styles.testTitle}>TEST ADMIN</Text>
          <Text style={styles.testItem}>admin@yuk-le.com / Admin123!</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: screenRootStyle,
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600', marginBottom: 24 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  shieldBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,182,39,0.12)',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
  inputFlex: { flex: 1 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: Colors.error, fontSize: 13, flex: 1 },
  secureNote: { color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  testBox: {
    marginTop: 24,
    backgroundColor: Colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  testTitle: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  testItem: { color: Colors.textMuted, fontSize: 12 },
});
