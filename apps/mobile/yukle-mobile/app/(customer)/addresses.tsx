import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AlertBanner } from '../../src/components/ui/AlertBanner';
import { Card } from '../../src/components/ui/Card';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../src/components/ui/StatusPill';
import { TextField } from '../../src/components/ui/TextField';
import { screenRootStyle } from '../../src/constants/layout';
import { getApiErrorMessage } from '../../src/services/api.client';
import {
  createAddress,
  deleteAddress,
  getMyAddresses,
  setDefaultAddress,
  updateAddress,
} from '../../src/services/addresses.service';
import type { DeliveryAddress, DeliveryAddressInput } from '../../src/types/address';
import { palette } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing } from '../../src/theme/spacing';

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
  const router = useRouter();
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
        { text: 'Iptal', style: 'cancel' },
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
        { text: 'Iptal', style: 'cancel' },
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
      <View style={screenRootStyle}>
        <LoadingState message="Adresler yukleniyor..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={screenRootStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={typography.link}>← Profil</Text>
        </Pressable>
        <Text style={styles.title}>Teslimat Adreslerim</Text>
        <Text style={styles.sub}>Sik kullandiginiz teslimat noktalarini kaydedin.</Text>

        {error ? <AlertBanner message={error} tone="error" /> : null}

        <Card variant="glass" padding={4}>
          <Text style={styles.formTitle}>{editingId ? 'Adresi duzenle' : 'Yeni adres'}</Text>
          <TextField label="Baslik" value={form.title} onChangeText={(v) => setForm((s) => ({ ...s, title: v }))} />
          <TextField label="Sirket adi" value={form.companyName} onChangeText={(v) => setForm((s) => ({ ...s, companyName: v }))} />
          <TextField label="Yetkili kisi" value={form.contactPerson} onChangeText={(v) => setForm((s) => ({ ...s, contactPerson: v }))} />
          <TextField label="Telefon" value={form.contactPhone} onChangeText={(v) => setForm((s) => ({ ...s, contactPhone: v }))} keyboardType="phone-pad" />
          <TextField label="Sehir" value={form.city} onChangeText={(v) => setForm((s) => ({ ...s, city: v }))} />
          <TextField label="Ilce" value={form.district} onChangeText={(v) => setForm((s) => ({ ...s, district: v }))} />
          <TextField label="Tam adres" value={form.address} onChangeText={(v) => setForm((s) => ({ ...s, address: v }))} multiline numberOfLines={3} />
          <View style={styles.formActions}>
            {editingId ? (
              <SecondaryButton title="Iptal" onPress={resetForm} style={styles.actionBtn} />
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
            title="Kayitli adres bulunamadi"
            description="Yukari formdan ilk teslimat adresinizi ekleyin."
          />
        ) : (
          items.map((a) => (
            <Card key={a.id} variant="default" padding={4} style={styles.addrCard}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                {a.isDefault ? <StatusPill label="Varsayilan" tone="success" /> : null}
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
                    title="Varsayilan Yap"
                    onPress={() => confirmSetDefault(a)}
                    style={styles.miniBtn}
                  />
                ) : null}
                <SecondaryButton title="Duzenle" onPress={() => startEdit(a)} style={styles.miniBtn} />
                <Pressable style={styles.dangerBtn} onPress={() => confirmDelete(a)}>
                  <Text style={styles.dangerText}>Sil</Text>
                </Pressable>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  title: { ...typography.h1 },
  sub: { ...typography.caption, textTransform: 'none' },
  formTitle: { ...typography.h3, marginBottom: spacing[2] },
  formActions: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2], flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 120 },
  addrCard: { gap: spacing[2] },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  cardTitle: { ...typography.h3, flex: 1 },
  addrMeta: { ...typography.caption, textTransform: 'none' },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] },
  miniBtn: { paddingHorizontal: spacing[3] },
  dangerBtn: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.errorBorder,
  },
  dangerText: { color: palette.error, fontSize: 13, fontWeight: '600' },
});
