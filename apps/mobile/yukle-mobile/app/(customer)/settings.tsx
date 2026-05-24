import { useRouter } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/ui/Card';
import { FadeInView } from '../../src/components/ui/FadeInView';
import { GhostButton } from '../../src/components/ui/GhostButton';
import { ScreenScroll } from '../../src/constants/layout';
import { useNotificationPrefsStore } from '../../src/store/notification-prefs.store';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { space, spacing } from '../../src/theme/spacing';

export default function CustomerSettingsScreen() {
  const router = useRouter();
  const pushEnabled = useNotificationPrefsStore((s) => s.pushEnabled);
  const emailEnabled = useNotificationPrefsStore((s) => s.emailEnabled);
  const smsEnabled = useNotificationPrefsStore((s) => s.smsEnabled);
  const setPushEnabled = useNotificationPrefsStore((s) => s.setPushEnabled);
  const setEmailEnabled = useNotificationPrefsStore((s) => s.setEmailEnabled);
  const setSmsEnabled = useNotificationPrefsStore((s) => s.setSmsEnabled);

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <GhostButton title="← Profil" onPress={() => router.back()} style={styles.back} />

      <ScreenHeader
        title="Ayarlar"
        subtitle="Bildirim tercihleri (cihazda saklanır)"
      />

      <FadeInView>
      <Card variant="default" padding={4} style={styles.card}>
        <Text style={styles.sectionTitle}>Bildirim tercihleri</Text>
        <PrefRow
          label="Push bildirimleri"
          hint="Uygulama içi canlı bildirimler"
          value={pushEnabled}
          onValueChange={setPushEnabled}
        />
        <PrefRow
          label="E-posta"
          hint="Önemli işlem özeti (yakında)"
          value={emailEnabled}
          onValueChange={setEmailEnabled}
        />
        <PrefRow
          label="SMS"
          hint="Kritik uyarılar (yakında)"
          value={smsEnabled}
          onValueChange={setSmsEnabled}
        />
        <Text style={styles.note}>
          Tercihler bu cihazda saklanır. Sunucu tarafı eşleştirme sonraki sürümde eklenecek.
        </Text>
      </Card>
      </FadeInView>
    </ScreenScroll>
  );
}

function PrefRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: palette.borderLight, true: palette.brandMuted }}
        thumbColor={value ? palette.brand : palette.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  back: { alignSelf: 'flex-start' },
  card: { gap: space.sm },
  sectionTitle: { ...typography.h3, color: palette.gold, marginBottom: space.sm },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: palette.borderSubtle,
  },
  prefLabel: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.text },
  prefHint: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  note: { ...typography.caption, textTransform: 'none', color: palette.textMuted, marginTop: spacing[3] },
});
