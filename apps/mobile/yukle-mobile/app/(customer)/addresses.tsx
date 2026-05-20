import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../src/constants/colors';
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

function FormField({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={Colors.textMuted}
        multiline={multiline}
      />
    </View>
  );
}

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
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Adresler yukleniyor...</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Profil</Text>
        </Pressable>
        <Text style={styles.title}>Teslimat Adreslerim</Text>
        <Text style={styles.sub}>Sik kullandiginiz teslimat noktalarini kaydedin.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'Adresi duzenle' : 'Yeni adres'}</Text>
          <FormField label="Baslik" value={form.title} onChangeText={(v) => setForm((s) => ({ ...s, title: v }))} />
          <FormField label="Sirket adi" value={form.companyName} onChangeText={(v) => setForm((s) => ({ ...s, companyName: v }))} />
          <FormField label="Yetkili kisi" value={form.contactPerson} onChangeText={(v) => setForm((s) => ({ ...s, contactPerson: v }))} />
          <FormField label="Telefon" value={form.contactPhone} onChangeText={(v) => setForm((s) => ({ ...s, contactPhone: v }))} />
          <FormField label="Sehir" value={form.city} onChangeText={(v) => setForm((s) => ({ ...s, city: v }))} />
          <FormField label="Ilce" value={form.district} onChangeText={(v) => setForm((s) => ({ ...s, district: v }))} />
          <FormField label="Tam adres" value={form.address} onChangeText={(v) => setForm((s) => ({ ...s, address: v }))} multiline />
          <View style={styles.formActions}>
            {editingId ? (
              <Pressable style={styles.ghostBtn} onPress={resetForm}>
                <Text style={styles.ghostBtnText}>Iptal</Text>
              </Pressable>
            ) : null}
            <Pressable style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={onSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={Colors.bgDark} />
              ) : (
                <Text style={styles.primaryBtnText}>{editingId ? 'Kaydet' : 'Adres Ekle'}</Text>
              )}
            </Pressable>
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Kayitli adres bulunamadi</Text>
            <Text style={styles.muted}>Yukari formdan ilk teslimat adresinizi ekleyin.</Text>
          </View>
        ) : (
          items.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                {a.isDefault ? <Text style={styles.defaultBadge}>Varsayilan</Text> : null}
              </View>
              <Text style={styles.muted}>
                {a.companyName} · {a.contactPerson} ({a.contactPhone})
              </Text>
              <Text style={styles.muted}>
                {a.address}, {a.district}/{a.city}
              </Text>
              <View style={styles.cardActions}>
                {!a.isDefault ? (
                  <Pressable style={styles.ghostBtn} onPress={() => confirmSetDefault(a)}>
                    <Text style={styles.ghostBtnText}>Varsayilan Yap</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.ghostBtn} onPress={() => startEdit(a)}>
                  <Text style={styles.ghostBtnText}>Duzenle</Text>
                </Pressable>
                <Pressable style={styles.dangerBtn} onPress={() => confirmDelete(a)}>
                  <Text style={styles.dangerBtnText}>Sil</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  backLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  formCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  formTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  field: { gap: 4 },
  fieldLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  primaryBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.bgDark, fontWeight: '700', fontSize: 15 },
  ghostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghostBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  dangerBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  dangerBtnText: { color: Colors.error, fontSize: 13, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  defaultBadge: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
});
