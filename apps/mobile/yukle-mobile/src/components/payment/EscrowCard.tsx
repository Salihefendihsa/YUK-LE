import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getPaymentForLoad, type PaymentInfo } from '../../services/payments.service';
import { palette } from '../../theme/colors';
import { radius } from '../../theme/radius';
import { space, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { formatCurrencyTRY } from '../../utils/format';
import { Card } from '../ui/Card';
import { StatusPill } from '../ui/StatusPill';

type Props = {
  loadId: string;
  /** Yük durumu — değiştiğinde (kabul/teslim) emanet bilgisi tazelenir. */
  loadStatus: string;
  /** 'customer' → ödeyen bakışı; 'driver' → kazanç bakışı. */
  view?: 'customer' | 'driver';
};

function Row({
  label,
  value,
  tone,
  emphasis,
}: {
  label: string;
  value: string;
  tone?: 'plus' | 'minus';
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, emphasis && styles.rowLabelEmphasis]} numberOfLines={2}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          tone === 'plus' && styles.plus,
          tone === 'minus' && styles.minus,
          emphasis && styles.rowValueEmphasis,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Emanet (escrow) kartı — web payment/EscrowCard.tsx ile görsel parity.
 * İki taraflı şeffaf döküm: müşteri +%X hizmet bedeli, şoför −%Y komisyon,
 * platform geliri (müşteri + şoför payı). Mock ödeme; gerçek tahsilat yok.
 */
export function EscrowCard({ loadId, loadStatus, view = 'customer' }: Props) {
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    void getPaymentForLoad(loadId)
      .then((p) => alive && setPayment(p))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, [loadId, loadStatus]);

  if (!loaded) return null;

  // Emanet henüz yok: ilan aktifse bilgilendir, değilse hiçbir şey gösterme.
  if (!payment) {
    if (loadStatus === 'Active') {
      return (
        <Card variant="elevated" padding={4} style={styles.card}>
          <Text style={styles.title}>💳 Güvenli Ödeme (Emanet)</Text>
          <Text style={styles.hint}>
            Bir teklifi kabul ettiğinizde ödeme emanete alınır ve teslimat onaylanana kadar güvende tutulur.
          </Text>
        </Card>
      );
    }
    return null;
  }

  const custPct = Math.round(payment.customerCommissionRate * 1000) / 10;
  const drvPct = Math.round(payment.driverCommissionRate * 1000) / 10;
  const isHeld = payment.status === 'Held';
  const isReleased = payment.status === 'Released';
  const isRefunded = payment.status === 'Refunded';

  const badge = isHeld
    ? { label: 'Emanette', tone: 'warning' as const }
    : isReleased
      ? { label: 'Ödendi', tone: 'success' as const }
      : { label: 'İade edildi', tone: 'neutral' as const };

  return (
    <Card variant="elevated" padding={4} style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>💳 Güvenli Ödeme (Emanet)</Text>
        <StatusPill label={badge.label} tone={badge.tone} />
      </View>

      {isHeld ? (
        <Text style={styles.lead}>
          <Text style={styles.strong}>{formatCurrencyTRY(payment.customerTotal)}</Text> emanette tutuluyor.
          {view === 'driver'
            ? ' Teslimat onaylandığında net tutar cüzdanınıza geçecek.'
            : ' Teslimat onaylandığında şoföre aktarılacak.'}
        </Text>
      ) : null}
      {isReleased ? (
        <Text style={styles.lead}>
          ✓ Ödeme tamamlandı. <Text style={styles.strong}>{formatCurrencyTRY(payment.netAmount)}</Text> şoför
          cüzdanına aktarıldı.
        </Text>
      ) : null}
      {isRefunded ? <Text style={styles.lead}>Bu yükün ödemesi müşteriye iade edildi.</Text> : null}

      <View style={styles.breakdown}>
        <Row label="Navlun (brüt)" value={formatCurrencyTRY(payment.grossAmount)} />

        {/* Müşteri tarafı: brütün üstüne hizmet bedeli eklenir */}
        <Row
          label={`Müşteri hizmet bedeli (+%${custPct})`}
          value={`+${formatCurrencyTRY(payment.customerCommission)}`}
          tone="plus"
        />
        <Row
          label={view === 'customer' ? 'Ödediğiniz toplam' : 'Müşterinin ödediği'}
          value={formatCurrencyTRY(payment.customerTotal)}
          emphasis
        />

        <View style={styles.divider} />

        {/* Şoför tarafı: brütten komisyon (ve varsa stopaj) kesilir */}
        <Row
          label={`Şoför komisyonu (−%${drvPct})`}
          value={`−${formatCurrencyTRY(payment.driverCommission)}`}
          tone="minus"
        />
        {payment.withholding > 0 ? (
          <Row label="Stopaj" value={`−${formatCurrencyTRY(payment.withholding)}`} tone="minus" />
        ) : null}
        <Row label="Şoföre net" value={formatCurrencyTRY(payment.netAmount)} emphasis />

        <View style={styles.divider} />

        {/* Platform geliri = müşteri payı + şoför payı */}
        <Row
          label={`Platform geliri (müşteri +%${custPct} & şoför +%${drvPct})`}
          value={formatCurrencyTRY(payment.commissionAmount)}
        />
      </View>

      <Text style={styles.foot}>Demo: ödeme altyapısı mock'tur, gerçek tahsilat yapılmaz.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  title: { ...typography.h3, flexShrink: 1 },
  hint: { ...typography.bodySmall, color: palette.textMuted },
  lead: { ...typography.bodySmall, color: palette.textSecondary },
  strong: { color: palette.text, fontFamily: typography.bodyMedium.fontFamily },
  breakdown: {
    marginTop: space.xs,
    padding: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    gap: spacing[2],
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  rowLabel: { ...typography.caption, textTransform: 'none', color: palette.textSecondary, flex: 1 },
  rowLabelEmphasis: { color: palette.text, fontFamily: typography.bodyMedium.fontFamily },
  rowValue: { ...typography.bodySmall, fontFamily: typography.bodyMedium.fontFamily, color: palette.text },
  rowValueEmphasis: { color: palette.gold },
  plus: { color: palette.success },
  minus: { color: palette.error },
  divider: { height: 1, backgroundColor: palette.borderSubtle, marginVertical: space.xs },
  foot: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
});
