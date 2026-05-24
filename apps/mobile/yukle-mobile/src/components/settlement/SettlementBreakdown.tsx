import { StyleSheet, Text, View } from 'react-native';
import type { SettlementPreview } from '../../types/settlement';
import { formatRatePct } from '../../services/settlement.service';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCurrencyTRY } from '../../utils/format';

type Mode = 'customer' | 'driver';

type Props = {
  settlement: SettlementPreview;
  mode: Mode;
  compact?: boolean;
};

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasis && styles.valueEmphasis]}>{value}</Text>
    </View>
  );
}

export function SettlementBreakdown({ settlement, mode, compact }: Props) {
  const driverPct = formatRatePct(settlement.driverCommissionRate);
  const customerPct = formatRatePct(settlement.customerCommissionRate);
  const stopajPct = formatRatePct(settlement.stopajRate);

  if (mode === 'customer') {
    return (
      <View style={[styles.box, compact && styles.boxCompact]}>
        <Row label="Teklif tutarı" value={formatCurrencyTRY(settlement.bidAmount)} />
        <Row
          label={`Komisyon (${customerPct})`}
          value={`+ ${formatCurrencyTRY(settlement.customerCommission)}`}
        />
        <Row label="Ödenecek (hold)" value={formatCurrencyTRY(settlement.customerTotal)} emphasis />
      </View>
    );
  }

  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <Row label="Teklif tutarı" value={formatCurrencyTRY(settlement.bidAmount)} />
      <Row
        label={`Komisyon (${driverPct})`}
        value={`− ${formatCurrencyTRY(settlement.driverCommission)}`}
      />
      <Row label={`Stopaj (${stopajPct})`} value={`− ${formatCurrencyTRY(settlement.withholding)}`} />
      <Row label="Net kazanç" value={formatCurrencyTRY(settlement.driverNet)} emphasis />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.borderLight,
    backgroundColor: palette.surface,
    gap: 6,
  },
  boxCompact: { marginTop: spacing[1], padding: spacing[2] },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  label: { ...typography.caption, textTransform: 'none', flex: 1 },
  value: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    color: palette.text,
  },
  valueEmphasis: { color: palette.gold },
});
