import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PressableScale } from '../../../src/components/ui/PressableScale';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import {
  ScreenContainer,
  ScreenScroll,
  screenRootStyle,
  useScreenInsets,
} from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import {
  createAddress,
  deleteAddress,
  getMyAddresses,
  setDefaultAddress,
  updateAddress,
} from '../../../src/services/addresses.service';
import type { DeliveryAddress, DeliveryAddressInput } from '../../../src/types/address';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';

const EMPTY_FORM: DeliveryAddressInput = {
  title: '',
  companyName: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  city: '',
  district: '',
  isDefault: false,
};

export default function CustomerAddressesScreen() {
  const [items, setItems] = useState<DeliveryAddress[]>([]);
  const [form, setForm] = useState<DeliveryAddressInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await getMyAddresses();
      setItems(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const startEdit = (addr: DeliveryAddress) => {
    setEditingId(addr.id);
    setForm({
      title: addr.title,
      companyName: addr.companyName,
      contactPerson: addr.contactPerson,
      contactPhone: addr.contactPhone,
      address: addr.address,
      city: addr.city,
      district: addr.district,
      latitude: addr.latitude,
      longitude: addr.longitude,
      isDefault: addr.isDefault,
    });
  };

  const onSave = async () => {
    if (!form.title.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Baslik, sehir ve tam adres zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await updateAddress(editingId, form);
      } else {
        await createAddress(form);
      }
      resetForm();
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (addr: DeliveryAddress) => {
    Alert.alert(
      'Adresi sil',
      `"${addr.title}" adresini silmek istediginize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(addr.id);
              if (editingId === addr.id) resetForm();
              await load();
            } catch (e) {
              setError(getApiErrorMessage(e));
            }
          },
        },
      ]
    );
  };

  const confirmSetDefault = (addr: DeliveryAddress) => {
    if (addr.isDefault) return;
    Alert.alert(
      'Varsayilan adres',
      `"${addr.title}" varsayilan teslimat adresi yapilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await setDefaultAddress(addr.id);
              await load();
            } catch (e) {
              setError(getApiErrorMessage(e));
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Adresler yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  const { edgeStyle } = useScreenInsets();

  return (
    <KeyboardAvoidingView
      style={[screenRootStyle, edgeStyle]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenScroll
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Adreslerim" subtitle="Sık kullandığınız teslimat noktalarını kaydedin" />

        {error ? <AlertBanner message={error} tone="error" /> : null}

        <Card variant="glass" padding={4}>
          <Text style={styles.formTitle}>{editingId ? 'Adresi düzenle' : 'Yeni adres'}</Text>
          <TextField label="Başlık" value={form.title} onChangeText={(v) => setForm((s) => ({ ...s, title: v }))} />
          <TextField label="Şirket adı" value={form.companyName} onChangeText={(v) => setForm((s) => ({ ...s, companyName: v }))} />
          <TextField label="Yetkili kişi" value={form.contactPerson} onChangeText={(v) => setForm((s) => ({ ...s, contactPerson: v }))} />
          <TextField label="Telefon" value={form.contactPhone} onChangeText={(v) => setForm((s) => ({ ...s, contactPhone: v }))} keyboardType="phone-pad" />
          <TextField label="Şehir" value={form.city} onChangeText={(v) => setForm((s) => ({ ...s, city: v }))} />
          <TextField label="İlçe" value={form.district} onChangeText={(v) => setForm((s) => ({ ...s, district: v }))} />
          <TextField label="Tam adres" value={form.address} onChangeText={(v) => setForm((s) => ({ ...s, address: v }))} multiline numberOfLines={3} />
          <View style={styles.formActions}>
            {editingId ? (
              <SecondaryButton title="İptal" onPress={resetForm} style={styles.actionBtn} />
            ) : null}
            <PrimaryButton
              title={editingId ? 'Kaydet' : 'Adres Ekle'}
              onPress={onSave}
              loading={saving}
              style={styles.actionBtn}
            />
          </View>
        </Card>

        {items.length === 0 ? (
          <EmptyState
            icon="📍"
            title="Kayıtlı adres bulunamadı"
            description="Yukarıdaki formdan ilk teslimat adresinizi ekleyin."
          />
        ) : (
          items.map((a, index) => (
            <FadeInView key={a.id} delay={Math.min(index * 40, 200)}>
            <Card variant="default" padding={4} style={styles.addrCard}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                {a.isDefault ? <StatusPill label="Varsayılan" tone="success" /> : null}
              </View>
              <Text style={styles.addrMeta}>
                {a.companyName} · {a.contactPerson} ({a.contactPhone})
              </Text>
              <Text style={styles.addrMeta}>
                {a.address}, {a.district}/{a.city}
              </Text>
              <View style={styles.cardActions}>
                {!a.isDefault ? (
                  <SecondaryButton
                    title="Varsayılan Yap"
                    onPress={() => confirmSetDefault(a)}
                    style={styles.miniBtn}
                  />
                ) : null}
                <SecondaryButton title="Düzenle" onPress={() => startEdit(a)} style={styles.miniBtn} />
                <PressableScale style={styles.dangerBtn} onPress={() => confirmDelete(a)}>
                  <Text style={styles.dangerText}>Sil</Text>
                </PressableScale>
              </View>
            </Card>
            </FadeInView>
          ))
        )}
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  formTitle: { ...typography.h3, marginBottom: space.sm },
  formActions: { flexDirection: 'row', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 120 },
  addrCard: { gap: space.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  cardTitle: { ...typography.h3, flex: 1 },
  addrMeta: { ...typography.caption, textTransform: 'none' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: spacing[3] },
  miniBtn: { paddingHorizontal: spacing[3] },
  dangerBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.errorBorder,
  },
  dangerText: { ...typography.bodySmall, color: palette.error, fontFamily: typography.bodyMedium.fontFamily },
});
