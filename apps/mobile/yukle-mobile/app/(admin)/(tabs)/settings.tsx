import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Card } from '../../../src/components/ui/Card';
import { TextField } from '../../../src/components/ui/TextField';
import { adminScreenStyles as s } from '../../../src/constants/adminScreenStyles';
import { ScreenScroll } from '../../../src/constants/layout';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { fontFamily } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { typography } from '../../../src/theme/typography';

export default function AdminSettingsScreen() {
  const user = useAuthStore((st) => st.user);

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Ayarlar" subtitle="Yakında kullanılabilir" />

      <View style={s.placeholderBanner}>
        <Text style={s.placeholderText}>
          Bu ekrandaki ayarlar henüz kaydedilmiyor; yakında kullanıma açılacaktır.
        </Text>
        <Text style={s.placeholderText}>
          Şifre değiştirme ve bildirim tercihleri şu an devre dışıdır.
        </Text>
      </View>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Admin Bilgileri (salt okunur oturum)</Text>
        <TextField value={user?.fullName ?? 'Admin'} editable={false} icon="person-outline" />
        <TextField value="admin@yuk-le.com" editable={false} icon="mail-outline" />
      </Card>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Şifre Değiştir</Text>
        <TextField placeholder="Mevcut şifre" editable={false} secureTextEntry icon="lock-closed-outline" />
        <TextField placeholder="Yeni şifre" editable={false} secureTextEntry icon="lock-closed-outline" />
      </Card>

      <Card variant="elevated" padding={4}>
        <Text style={styles.cardTitle}>Bildirim Tercihleri</Text>
        <Text style={s.muted}>Örnek seçenekler — kayıt yok</Text>
        <Text style={s.muted}>• Yeni belge e-posta</Text>
        <Text style={s.muted}>• Şüpheli aktivite uyarısı</Text>
        <Text style={s.muted}>• İki adımlı doğrulama: yakında</Text>
      </Card>

      <Pressable style={styles.saveBtn} disabled>
        <Text style={styles.saveBtnText}>Kaydet (devre disi)</Text>
      </Pressable>
    </ScreenScroll>
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
