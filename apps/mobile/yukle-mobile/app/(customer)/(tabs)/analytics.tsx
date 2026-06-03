import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import {
  DEMO_ANALYTICS_MONTHS,
  DEMO_CARBON_REDUCTION_PCT,
  DEMO_CARBON_TONNES,
  DEMO_CUSTOMER_SATISFACTION,
  DEMO_MONTHLY_SAVINGS_TRY,
  DEMO_MONTHLY_SPEND,
  DEMO_SPEND_CHART_MAX,
  DEMO_TOP_ROUTES,
} from '../../../src/constants/customer-analytics-demo';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { radius } from '../../../src/theme/radius';
import { space, spacing } from '../../../src/theme/spacing';
import { formatCurrencyTRY } from '../../../src/utils/format';

// TODO Faz 4+: Gerçek analitik API'sı bağlanınca DEMO_* constants'lerini kaldır
// ve veriyi backend'den fetch et. Web ve mobil senkron olarak demo'dan canlıya
// geçmeli. Şu an /api/Analytics endpoint'i yok (web Analytics.tsx hard-coded).
export default function CustomerAnalyticsScreen() {
  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader
        title="Analitik (Yakında)"
        subtitle="Canlı veri yakında bağlanacak — şu an örnek görünüm"
      />

      <FadeInView>
      <Card variant="elevated" padding={3} style={styles.demoBanner}>
        <StatusPill label="YAKINDA — ÖRNEK GÖRÜNÜM" tone="warning" />
        <Text style={styles.demoBannerText}>
          Harcama, güzergah ve sürdürülebilirlik raporları hesabınıza yakında bağlanacak.
          Bu ekrandaki rakamlar yalnızca tasarım önizlemesidir.
        </Text>
      </Card>
      </FadeInView>

      <FadeInView delay={40}>
      <Card variant="glass" padding={4}>
        <Text style={styles.cardTitle}>Toplam harcama</Text>
        <Text style={styles.cardSub}>Aylık trend (örnek)</Text>
        <View style={styles.barChart}>
          {DEMO_MONTHLY_SPEND.map((v, i) => (
            <View key={DEMO_ANALYTICS_MONTHS[i]} style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(8, (v / DEMO_SPEND_CHART_MAX) * 140) },
                ]}
              />
              <Text style={styles.barLabel}>{DEMO_ANALYTICS_MONTHS[i]}</Text>
            </View>
          ))}
        </View>
      </Card>
      </FadeInView>

      <FadeInView delay={80}>
      <Card variant="default" padding={4}>
        <Text style={styles.cardTitle}>En çok kullanılan güzergahlar</Text>
        {DEMO_TOP_ROUTES.map((route, i) => (
          <View key={route} style={styles.routeRow}>
            <Text style={styles.routeIndex}>{i + 1}</Text>
            <Text style={styles.routeLine}>{route}</Text>
          </View>
        ))}
      </Card>
      </FadeInView>

      <FadeInView delay={120}>
      <Card variant="default" padding={4}>
        <Text style={styles.cardTitle}>Memnuniyet puanınız</Text>
        <Text style={styles.bigStat}>{DEMO_CUSTOMER_SATISFACTION.toFixed(1)}</Text>
        <Text style={styles.cardSub}>Şoförlerin size verdiği ortalama (son 90 gün, örnek)</Text>
      </Card>
      </FadeInView>

      <FadeInView delay={160}>
      <Card variant="default" padding={4}>
        <Text style={styles.cardTitle}>Karbon ayak izi</Text>
        <Text style={styles.bodyText}>
          Tahmini emisyon: <Text style={styles.strong}>{DEMO_CARBON_TONNES} t CO₂e</Text> bu ay. Yeşil
          araç tercihi ile <Text style={styles.strong}>%{DEMO_CARBON_REDUCTION_PCT}</Text> azaltılabilir.
        </Text>
      </Card>
      </FadeInView>

      <FadeInView delay={200}>
      <Card variant="glass" padding={4} style={styles.savingsCard}>
        <Text style={styles.cardTitle}>Bu ay tasarruf</Text>
        <Text style={styles.bigStatGold}>{formatCurrencyTRY(DEMO_MONTHLY_SAVINGS_TRY)}</Text>
        <Text style={styles.cardSub}>Akıllı eşleştirme ve güzergah optimizasyonu ile (örnek).</Text>
      </Card>
      </FadeInView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  demoBanner: {
    borderColor: palette.goldBorder,
    backgroundColor: palette.goldMuted,
    gap: space.sm,
    alignItems: 'center',
  },
  demoBannerText: {
    ...typography.caption,
    textTransform: 'none',
    color: palette.gold,
    textAlign: 'center',
  },
  cardTitle: { ...typography.h3 },
  cardSub: { ...typography.caption, textTransform: 'none', marginTop: space.xs },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    height: 160,
    marginTop: space.md,
  },
  barWrap: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: space.sm },
  bar: {
    width: '100%',
    maxWidth: 32,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    backgroundColor: palette.brand,
    minHeight: 8,
  },
  barLabel: { ...typography.caption, textTransform: 'none', fontSize: 10 },
  routeRow: { flexDirection: 'row', gap: spacing[3], marginTop: space.sm },
  routeIndex: { ...typography.bodySmall, color: palette.brand, width: 20, fontFamily: typography.bodyMedium.fontFamily },
  routeLine: { ...typography.body, flex: 1 },
  bigStat: { ...typography.h1, fontSize: 42, color: palette.brand, marginVertical: space.sm },
  bigStatGold: { ...typography.h2, fontSize: 32, color: palette.gold, marginVertical: space.sm },
  bodyText: { ...typography.body, color: palette.textSecondary },
  strong: { color: palette.text, fontFamily: typography.bodyMedium.fontFamily },
  savingsCard: { borderColor: palette.goldBorder },
});
