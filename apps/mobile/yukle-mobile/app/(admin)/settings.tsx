import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { adminScreenStyles as s } from '../../src/constants/adminScreenStyles';
import { screenRootStyle } from '../../src/constants/layout';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((st) => st.user);

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}>
        <Text style={s.backLink}>← Geri</Text>
      </Pressable>
      <Text style={s.title}>Admin Ayarlar</Text>

      <View style={s.placeholderBanner}>
        <Text style={s.placeholderText}>
          Yakinda — bu ekrandaki alanlar kaydedilmiyor (web ile ayni: UI-only placeholder).
        </Text>
        <Text style={s.placeholderText}>
          Sifre degistirme ve bildirim tercihleri API baglantisi yok.
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Admin Bilgileri (salt okunur oturum)</Text>
        <TextInput
          style={[s.input, styles.disabled]}
          value={user?.fullName ?? 'Admin'}
          editable={false}
        />
        <TextInput
          style={[s.input, styles.disabled]}
          value="admin@yuk-le.com"
          editable={false}
        />
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Sifre Degistir</Text>
        <TextInput
          style={[s.input, styles.disabled]}
          placeholder="Mevcut sifre"
          placeholderTextColor="#6b7280"
          secureTextEntry
          editable={false}
        />
        <TextInput
          style={[s.input, styles.disabled]}
          placeholder="Yeni sifre"
          placeholderTextColor="#6b7280"
          secureTextEntry
          editable={false}
        />
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Bildirim Tercihleri</Text>
        <Text style={s.muted}>Ornek secenekler — kayit yok</Text>
        <Text style={s.muted}>• Yeni belge e-posta</Text>
        <Text style={s.muted}>• Supheli aktivite uyarisi</Text>
        <Text style={s.muted}>• 2FA: yakinda</Text>
      </View>

      <Pressable style={styles.saveBtn} disabled>
        <Text style={styles.saveBtnText}>Kaydet (devre disi)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  disabled: { opacity: 0.55 },
  saveBtn: {
    backgroundColor: 'rgba(255,107,0,0.35)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#9ca3af', fontWeight: '600' },
});
