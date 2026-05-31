import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Card } from '../../../src/components/ui/Card';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { TextField } from '../../../src/components/ui/TextField';
import { adminScreenStyles as s } from '../../../src/constants/adminScreenStyles';
import { ScreenScroll } from '../../../src/constants/layout';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';

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
        <Text style={styles.cardTitle}>Yönetici bilgileri (salt okunur)</Text>
        <TextField value={user?.fullName ?? 'Yönetici'} editable={false} icon="person-outline" />
        <TextField value="admin@navlonix.com" editable={false} icon="mail-outline" />
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

      <PressableScale style={styles.saveBtn} disabled>
        <Text style={styles.saveBtnText}>Kaydet (devre dışı)</Text>
      </PressableScale>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  cardTitle: { ...typography.h3, marginBottom: space.md },
  saveBtn: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.borderLight,
    paddingVertical: space.md,
    alignItems: 'center',
    opacity: 0.6,
  },
  saveBtnText: { ...typography.bodyMedium, color: palette.textMuted },
});
