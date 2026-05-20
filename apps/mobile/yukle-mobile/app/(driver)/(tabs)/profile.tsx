import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../../src/constants/colors';
import { screenRootStyle } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { changePassword, getUserProfile, updateUserProfile } from '../../../src/services/user.service';
import { useAuthStore } from '../../../src/store/auth.store';

export default function DriverProfileScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');
  const [pwdError, setPwdError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tcMasked, setTcMasked] = useState('');
  const [iban, setIban] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [licenseClass, setLicenseClass] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [role, setRole] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatingCount, setTotalRatingCount] = useState(0);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const loadProfile = useCallback(async () => {
    if (!authUser?.userId) {
      setLoading(false);
      return;
    }
    try {
      setError('');
      const p = await getUserProfile(authUser.userId);
      setFullName(p.fullName);
      setEmail(p.email);
      setPhone(p.phone);
      setTcMasked(p.tcIdentityNumber ?? '');
      setIban(p.iban ?? '');
      setHomeAddress(p.homeAddress ?? '');
      setLicenseClass(p.licenseClass ?? '');
      setVehiclePlate(p.vehiclePlate ?? '');
      setVehicleType(p.vehicleType ?? '');
      setRole(p.role);
      setApprovalStatus(p.approvalStatus);
      setAverageRating(p.averageRating);
      setTotalRatingCount(p.totalRatingCount);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authUser?.userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!authUser?.userId) return;
    if (!fullName.trim()) {
      setError('Ad soyad zorunludur.');
      return;
    }
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const ibanRaw = iban.replace(/\s/g, '');
      await updateUserProfile(authUser.userId, {
        fullName: fullName.trim(),
        email: email.trim(),
        iban: ibanRaw || undefined,
        homeAddress: homeAddress.trim() || undefined,
      });
      setStatus('Profil kaydedildi.');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPwdError('Mevcut ve yeni sifre zorunludur.');
      return;
    }
    if (newPassword !== newPassword2) {
      setPwdError('Yeni sifreler eslesmiyor.');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('Yeni sifre en az 8 karakter olmalidir.');
      return;
    }
    setPwdSaving(true);
    setPwdError('');
    setPwdStatus('');
    try {
      await changePassword({ currentPassword, newPassword });
      setPwdStatus('Sifre guncellendi.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPassword2('');
    } catch (e) {
      setPwdError(getApiErrorMessage(e));
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[screenRootStyle, styles.centered]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.muted}>Profil yukleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={screenRootStyle} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Sofor Profili</Text>
      <Text style={styles.sub}>
        Puan: {averageRating.toFixed(1)} ({totalRatingCount} degerlendirme)
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {status ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{status}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hesap bilgileri</Text>
        <Field label="Ad Soyad" value={fullName} onChangeText={setFullName} editable />
        <Field label="Telefon" value={phone} editable={false} />
        <Field label="E-posta" value={email} onChangeText={setEmail} editable />
        <Field label="T.C. Kimlik" value={tcMasked} editable={false} />
        <Field label="Rol" value={role} editable={false} />
        <Field label="Onay durumu" value={approvalStatus} editable={false} />
        <Field label="IBAN" value={iban} onChangeText={setIban} editable />
        <Field label="Ikametgah" value={homeAddress} onChangeText={setHomeAddress} editable />
        <Field label="Ehliyet sinifi" value={licenseClass} editable={false} />
        <Field label="Plaka" value={vehiclePlate} editable={false} />
        <Field label="Arac tipi" value={vehicleType} editable={false} />

        <Pressable style={[styles.primaryBtn, saving && styles.btnDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.bgDark} />
          ) : (
            <Text style={styles.primaryBtnText}>Kaydet</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sifre Degistir</Text>
        <Field
          label="Mevcut sifre"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          editable
          secure
        />
        <Field label="Yeni sifre" value={newPassword} onChangeText={setNewPassword} editable secure />
        <Field
          label="Yeni sifre (tekrar)"
          value={newPassword2}
          onChangeText={setNewPassword2}
          editable
          secure
        />
        {pwdError ? <Text style={styles.errorText}>{pwdError}</Text> : null}
        {pwdStatus ? <Text style={styles.successText}>{pwdStatus}</Text> : null}
        <Pressable
          style={[styles.goldBtn, pwdSaving && styles.btnDisabled]}
          onPress={handleChangePassword}
          disabled={pwdSaving}
        >
          {pwdSaving ? (
            <ActivityIndicator color={Colors.bgDark} />
          ) : (
            <Text style={styles.primaryBtnText}>Sifreyi Guncelle</Text>
          )}
        </Pressable>
      </View>

      <Pressable style={styles.linkBtn} onPress={() => router.push('/(driver)/documents')}>
        <Text style={styles.linkBtnText}>Belgelerim</Text>
      </Pressable>
      <Pressable style={styles.linkBtn} onPress={() => router.push('/(driver)/history')}>
        <Text style={styles.linkBtnText}>Gecmis Seferlerim</Text>
      </Pressable>
      <Pressable style={styles.linkBtn} onPress={() => router.push('/(driver)/bids')}>
        <Text style={styles.linkBtnText}>Tekliflerim</Text>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  editable,
  secure,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  editable: boolean;
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputReadonly]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secure}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize={secure ? 'none' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 12 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  sub: { color: Colors.textSecondary, fontSize: 14, marginBottom: 4 },
  muted: { color: Colors.textSecondary, fontSize: 13 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: Colors.primaryGold, fontSize: 15, fontWeight: '700', marginBottom: 4 },
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
  inputReadonly: { opacity: 0.7 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  goldBtn: {
    backgroundColor: Colors.primaryGold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: Colors.bgDark, fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  linkBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  logoutText: { color: Colors.textSecondary, fontWeight: '600' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  successBox: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: Colors.error, fontSize: 13 },
  successText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
});
