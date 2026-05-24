import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlertBanner } from '../ui/AlertBanner';
import { Card } from '../ui/Card';
import { FadeInView } from '../ui/FadeInView';
import { PressableScale } from '../ui/PressableScale';
import { PrimaryButton } from '../ui/PrimaryButton';
import { TextField } from '../ui/TextField';
import { getApiErrorMessage } from '../../services/api.client';
import { submitRating } from '../../services/ratings.service';
import { palette } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { space } from '../../theme/spacing';
import { sizes } from '../../theme/sizes';

type Props = {
  loadId: string;
  driverUserId: number;
  driverName?: string;
  onRated?: () => void;
};

export function DriverRatingForm({ loadId, driverUserId, driverName, onRated }: Props) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (score < 1 || score > 5) {
      setError('Lütfen 1 ile 5 arasında yıldız seçin.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await submitRating({
        loadId,
        givenToUserId: driverUserId,
        score,
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
    return <AlertBanner message="Şoför puanlamanız kaydedildi. Teşekkürler!" tone="success" />;
  }

  return (
    <FadeInView>
      <Card variant="default" padding={4} style={styles.card}>
        <Text style={styles.title}>Şoförü puanlayın</Text>
        <Text style={styles.sub}>
          {driverName ? `${driverName} · ` : ''}Teslim sonrası deneyiminizi paylaşın.
        </Text>
        {error ? <AlertBanner message={error} tone="error" /> : null}
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <PressableScale key={n} onPress={() => setScore(n)} accessibilityLabel={`${n} yıldız`}>
              <Ionicons
                name={n <= score ? 'star' : 'star-outline'}
                size={sizes.icon.lg}
                color={n <= score ? palette.gold : palette.textMuted}
              />
            </PressableScale>
          ))}
        </View>
        <TextField
          label="Yorum (isteğe bağlı)"
          placeholder="Kısa değerlendirme"
          value={comment}
          onChangeText={setComment}
          editable={!busy}
          multiline
        />
        <PrimaryButton title="Puanı Gönder" onPress={onSubmit} loading={busy} disabled={busy || score < 1} />
      </Card>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md },
  title: { ...typography.h3, color: palette.gold },
  sub: { ...typography.caption, textTransform: 'none' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, paddingVertical: space.sm },
});
