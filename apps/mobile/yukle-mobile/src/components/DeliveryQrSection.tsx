import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../constants/colors';
import { getApiErrorMessage } from '../services/api.client';
import { getDeliveryQr } from '../services/loads.service';

type Props = {
  loadId: string;
};

export function DeliveryQrSection({ loadId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [expiresMin, setExpiresMin] = useState(15);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQr = useCallback(async () => {
    if (!loadId) return;
    setLoading(true);
    setErr('');
    try {
      const data = await getDeliveryQr(loadId);
      setToken(data.token);
      setExpiresMin(data.expiresInMinutes);
    } catch (e) {
      setToken(null);
      setErr(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    fetchQr();
  }, [fetchQr]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.muted}>QR kod hazirlaniyor...</Text>
      </View>
    );
  }

  if (err || !token) {
    return <Text style={styles.muted}>{err || 'QR kod uretilemedi.'}</Text>;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Bu QR kodu sofore gosterin. Teslimatta okutulacak anahtar {expiresMin} dakika gecerlidir.
      </Text>
      <View style={styles.qrBox}>
        <QRCode value={token} size={200} color={Colors.bgDark} backgroundColor="#FFFFFF" />
      </View>
      <Text style={styles.tokenHint} selectable>
        Yuk ID: {loadId}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12, alignItems: 'center' },
  center: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  hint: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenHint: { color: Colors.textMuted, fontSize: 11 },
});
