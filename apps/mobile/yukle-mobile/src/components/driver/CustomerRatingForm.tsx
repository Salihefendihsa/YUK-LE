import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AlertBanner } from '../ui/AlertBanner';
import { Card } from '../ui/Card';
import { PrimaryButton } from '../ui/PrimaryButton';
import { TextField } from '../ui/TextField';
import { getApiErrorMessage } from '../../services/api.client';
import { submitRating } from '../../services/ratings.service';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = {
  loadId: string;
  customerUserId: number;
  customerName?: string;
  onRated?: () => void;
};

export function CustomerRatingForm({ loadId, customerUserId, customerName, onRated }: Props) {
  const [score, setScore] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    const n = Number(score);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      setError('Puan 1 ile 5 arasında olmalıdır.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitRating({
        loadId,
        givenToUserId: customerUserId,
        score: n,
        comment: comment.trim() || undefined,
      });
      setDone(true);
      onRated?.();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AlertBanner message="Müşteri puanlamanız kaydedildi. Teşekkürler!" tone="success" />
    );
  }

  return (
    <Card variant="default" padding={4} style={styles.card}>
      <Text style={styles.title}>Müşteriyi puanlayın</Text>
      <Text style={styles.sub}>
        {customerName ? `${customerName} · ` : ''}Teslim sonrası 1–5 arası puan verin.
      </Text>
      {error ? <AlertBanner message={error} tone="error" /> : null}
      <TextField
        label="Puan (1–5)"
        keyboardType="number-pad"
        placeholder="Örn: 5"
        value={score}
        onChangeText={setScore}
        editable={!busy}
      />
      <TextField
        label="Yorum (isteğe bağlı)"
        placeholder="Kısa değerlendirme"
        value={comment}
        onChangeText={setComment}
        editable={!busy}
        multiline
      />
      <PrimaryButton title="Puanı Gönder" onPress={onSubmit} loading={busy} disabled={busy} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3] },
  title: { fontFamily: fontFamily.semiBold, fontSize: 15, color: palette.gold },
  sub: { ...typography.caption, textTransform: 'none' },
});
