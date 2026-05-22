import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/ui/Card';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { TextField } from '../../src/components/ui/TextField';
import { adminScreenStyles as s } from '../../src/constants/adminScreenStyles';
import { screenRootStyle } from '../../src/constants/layout';
import { useAuthStore } from '../../src/store/auth.store';
import { palette } from '../../src/theme/colors';
import { fontFamily } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((st) => st.user);

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={typography.link}>← Geri</Text>
      </Pressable>

      <SectionHeader title="Admin Ayarlar" subtitle="UI-only — kayit yok" />

      <View style={s.placeholderBanner}>
        <Text style={s.placeholderText}>
          Yakinda — bu ekrandaki alanlar kaydedilmiyor (web ile ayni: UI-only placeholder).
        </Text>
        <Text style={s.placeholderText}>
          Sifre degistirme ve bildirim tercihleri API baglantisi yok.
        </Text>
      </View>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Admin Bilgileri (salt okunur oturum)</Text>
        <TextField value={user?.fullName ?? 'Admin'} editable={false} icon="person-outline" />
        <TextField value="admin@yuk-le.com" editable={false} icon="mail-outline" />
      </Card>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Sifre Degistir</Text>
        <TextField placeholder="Mevcut sifre" editable={false} secureTextEntry icon="lock-closed-outline" />
        <TextField placeholder="Yeni sifre" editable={false} secureTextEntry icon="lock-closed-outline" />
      </Card>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Bildirim Tercihleri</Text>
        <Text style={s.muted}>Ornek secenekler — kayit yok</Text>
        <Text style={s.muted}>• Yeni belge e-posta</Text>
        <Text style={s.muted}>• Supheli aktivite uyarisi</Text>
        <Text style={s.muted}>• 2FA: yakinda</Text>
      </Card>

      <Pressable style={styles.saveBtn} disabled>
        <Text style={styles.saveBtnText}>Kaydet (devre disi)</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[3] },
  back: { marginBottom: spacing[2] },
  cardTitle: { ...typography.h3, marginBottom: spacing[3] },
  saveBtn: {
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingVertical: spacing[3],
    alignItems: 'center',
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: palette.textMuted,
  },
});
