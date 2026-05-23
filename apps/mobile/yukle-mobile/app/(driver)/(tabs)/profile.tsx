import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, ScreenScroll, useScreenInsets } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { changePassword, getUserProfile, updateUserProfile } from '../../../src/services/user.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { fontFamily, typography } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { getApprovalStatusPill } from '../../../src/utils/statusPills';

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

  const approvalPill = getApprovalStatusPill(approvalStatus);

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
      setPwdError('Yeni şifreler eşleşmiyor.');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('Yeni şifre en az 8 karakter olmalıdır.');
      return;
    }
    setPwdSaving(true);
    setPwdError('');
    setPwdStatus('');
    try {
      await changePassword({ currentPassword, newPassword });
      setPwdStatus('Şifre güncellendi.');
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
      <ScreenContainer>
        <LoadingState message="Profil yükleniyor..." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader
        title="Profil"
        subtitle={`Puan: ${averageRating.toFixed(1)} (${totalRatingCount} değerlendirme)`}
      />

      {error ? <AlertBanner message={error} tone="error" /> : null}
      {status ? <AlertBanner message={status} tone="success" /> : null}

      <Card variant="glass" padding={4}>
        <Text style={styles.sectionTitle}>Hesap bilgileri</Text>
        <View style={styles.approvalRow}>
          <Text style={styles.fieldHint}>Onay durumu</Text>
          <StatusPill label={approvalPill.label} tone={approvalPill.tone} />
        </View>

        <TextField label="Ad Soyad" value={fullName} onChangeText={setFullName} />
        <TextField label="Telefon" value={phone} editable={false} />
        <TextField label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="T.C. Kimlik" value={tcMasked} editable={false} />
        <TextField label="Rol" value={role} editable={false} />
        <TextField label="IBAN" value={iban} onChangeText={setIban} autoCapitalize="characters" />
        <TextField label="Ikametgah" value={homeAddress} onChangeText={setHomeAddress} />
        <TextField label="Ehliyet sinifi" value={licenseClass} editable={false} />
        <TextField label="Plaka" value={vehiclePlate} editable={false} />
        <TextField label="Arac tipi" value={vehicleType} editable={false} />

        <PrimaryButton title="Kaydet" onPress={handleSave} loading={saving} />
      </Card>

      <Card variant="default" padding={4}>
        <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
        <TextField
          label="Mevcut şifre"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <TextField label="Yeni şifre" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <TextField
          label="Yeni şifre (tekrar)"
          value={newPassword2}
          onChangeText={setNewPassword2}
          secureTextEntry
        />
        {pwdError ? <AlertBanner message={pwdError} tone="error" /> : null}
        {pwdStatus ? <AlertBanner message={pwdStatus} tone="success" /> : null}
        <PrimaryButton
          title="Şifreyi Güncelle"
          onPress={handleChangePassword}
          loading={pwdSaving}
          style={styles.goldBtn}
        />
      </Card>

      <SecondaryButton title="Belgelerim" onPress={() => router.push('/(driver)/(tabs)/documents')} />
      <SecondaryButton title="Geçmiş Seferlerim" onPress={() => router.push('/(driver)/(tabs)/history')} />
      <SecondaryButton title="Tekliflerim" onPress={() => router.push('/(driver)/(tabs)/bids')} />

      <SecondaryButton title="Çıkış Yap" onPress={handleLogout} style={styles.logoutBtn} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  title: { ...typography.h1 },
  sub: { ...typography.caption, textTransform: 'none' },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: palette.gold,
    marginBottom: spacing[3],
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  fieldHint: { ...typography.caption, textTransform: 'none' },
  goldBtn: { backgroundColor: palette.gold },
  logoutBtn: { alignSelf: 'flex-start', marginTop: spacing[2] },
});
