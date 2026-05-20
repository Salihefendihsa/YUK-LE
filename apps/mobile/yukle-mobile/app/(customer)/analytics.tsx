import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  DEMO_ANALYTICS_MONTHS,
  DEMO_CARBON_REDUCTION_PCT,
  DEMO_CARBON_TONNES,
  DEMO_DRIVER_SATISFACTION,
  DEMO_MONTHLY_SAVINGS_TRY,
  DEMO_MONTHLY_SPEND,
  DEMO_SPEND_CHART_MAX,
  DEMO_TOP_ROUTES,
} from '../../src/constants/customer-analytics-demo';
import { Colors } from '../../src/constants/colors';
import { screenRootStyle } from '../../src/constants/layout';
import { formatCurrencyTRY } from '../../src/utils/format';

export default function CustomerAnalyticsScreen() {
  const router = useRouter();

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Profil</Text>
      </Pressable>

      <Text style={styles.title}>Analitik</Text>
      <Text style={styles.sub}>Harcama, guzergah ve surdurulebilirlik ozeti</Text>

      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>DEMO VERI — Gercek API baglantisi yok (web ile ayni)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Toplam harcama</Text>
        <Text style={styles.mutedSmall}>Aylik trend (demo)</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>En cok kullanilan guzergahlar</Text>
        {DEMO_TOP_ROUTES.map((route, i) => (
          <Text key={route} style={styles.routeLine}>
            {i + 1}. {route}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sofor memnuniyeti</Text>
        <Text style={styles.bigStat}>{DEMO_DRIVER_SATISFACTION.toFixed(1)}</Text>
        <Text style={styles.mutedSmall}>Son 90 gun ortalamasi (demo)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Karbon ayak izi</Text>
        <Text style={styles.bodyText}>
          Tahmini emisyon: <Text style={styles.strong}>{DEMO_CARBON_TONNES} t CO2e</Text> bu ay. Yesil
          arac tercihi ile <Text style={styles.strong}>%{DEMO_CARBON_REDUCTION_PCT}</Text> azaltilabilir.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bu ay tasarruf</Text>
        <Text style={styles.bigStatGold}>{formatCurrencyTRY(DEMO_MONTHLY_SAVINGS_TRY)}</Text>
        <Text style={styles.mutedSmall}>Akilli eslestirme ve guzergah optimizasyonu ile (demo).</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14 },
  demoBanner: {
    backgroundColor: 'rgba(255,182,39,0.12)',
    borderWidth: 1,
    borderColor: Colors.primaryGold,
    borderRadius: 8,
    padding: 10,
  },
  demoBannerText: { color: Colors.primaryGold, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  mutedSmall: { color: Colors.textMuted, fontSize: 12 },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 160,
    marginTop: 12,
  },
  barWrap: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 },
  bar: {
    width: '100%',
    maxWidth: 32,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: Colors.primary,
    minHeight: 8,
  },
  barLabel: { color: Colors.textMuted, fontSize: 10 },
  routeLine: { color: Colors.textSecondary, fontSize: 14, lineHeight: 22 },
  bigStat: { color: Colors.primary, fontSize: 42, fontWeight: '800' },
  bigStatGold: { color: Colors.primaryGold, fontSize: 32, fontWeight: '800' },
  bodyText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  strong: { color: Colors.textPrimary, fontWeight: '700' },
});
