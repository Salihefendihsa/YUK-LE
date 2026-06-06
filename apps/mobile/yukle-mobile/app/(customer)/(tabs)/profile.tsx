import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { SecondaryButton } from '../../../src/components/ui/SecondaryButton';
import { StatusPill } from '../../../src/components/ui/StatusPill';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { changePassword, getUserProfile, updateUserProfile } from '../../../src/services/user.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';
import { radius } from '../../../src/theme/radius';
import { useRoleAccent } from '../../../src/theme/useRoleAccent';
import { getApprovalStatusPill } from '../../../src/utils/statusPills';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'K';
}

export default function CustomerProfileTabScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const accent = useRoleAccent();

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
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [role, setRole] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');

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
      setCompanyName(p.companyName ?? '');
      setCompanyAddress(p.companyAddress ?? '');
      setTaxNumber(p.taxNumber ?? '');
      setRole(p.role);
      setApprovalStatus(p.approvalStatus);
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
    if (!email.trim() || !email.includes('@')) {
      setError('Geçerli bir e-posta girin.');
      return;
    }
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await updateUserProfile(authUser.userId, {
        fullName: fullName.trim(),
        email: email.trim(),
        companyName: companyName.trim() || undefined,
        companyAddress: companyAddress.trim() || undefined,
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
      setPwdError('Mevcut ve yeni şifre zorunludur.');
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
        <LoadingState message="Profil yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Profil" subtitle="Hesap, şirket ve güvenlik" />

      {error ? <AlertBanner message={error} tone="error" /> : null}
      {status ? <AlertBanner message={status} tone="success" /> : null}

      <FadeInView>
        <Card variant="hero" padding={5} accent={accent}>
          <View style={styles.heroRow}>
            <View style={[styles.avatar, { backgroundColor: accent.hero.iconBg, borderColor: accent.hero.iconColor }]}>
              <Text style={[styles.avatarText, { color: accent.hero.iconColor }]}>
                {initialsOf(fullName || authUser?.fullName || 'Kullanıcı')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName} numberOfLines={1}>
                {fullName || authUser?.fullName || 'Kullanıcı'}
              </Text>
              {companyName ? (
                <Text style={styles.heroCompany} numberOfLines={1}>
                  {companyName}
                </Text>
              ) : null}
              <View style={styles.heroBadges}>
                <View style={[styles.roleBadge, { backgroundColor: accent.accentMuted, borderColor: accent.accentBorder }]}>
                  <Text style={[styles.roleBadgeText, { color: accent.accentHover }]}>Müşteri</Text>
                </View>
                <StatusPill label={approvalPill.label} tone={approvalPill.tone} />
              </View>
            </View>
          </View>
        </Card>
      </FadeInView>

      <FadeInView delay={50}>
      <Card variant="elevated" padding={4}>
        <Text style={styles.sectionTitle}>Hesap bilgileri</Text>
        <TextField label="Ad Soyad" value={fullName} onChangeText={setFullName} />
        <TextField label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Telefon" value={phone} editable={false} />
        <TextField label="Rol" value={role} editable={false} />
      </Card>
      </FadeInView>

      <FadeInView delay={100}>
      <Card variant="default" padding={4}>
        <Text style={styles.sectionTitle}>Şirket bilgileri</Text>
        <TextField label="Şirket adı" value={companyName} onChangeText={setCompanyName} />
        <TextField label="Vergi numarası" value={taxNumber} editable={false} />
        <TextField
          label="Şirket adresi"
          value={companyAddress}
          onChangeText={setCompanyAddress}
          multiline
          numberOfLines={3}
        />
        <PrimaryButton title="Kaydet" onPress={handleSave} loading={saving} />
      </Card>
      </FadeInView>

      <FadeInView delay={150}>
      <Card variant="default" padding={4}>
        <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
        <TextField label="Mevcut şifre" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <TextField label="Yeni şifre" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <TextField label="Yeni şifre (tekrar)" value={newPassword2} onChangeText={setNewPassword2} secureTextEntry />
        {pwdError ? <AlertBanner message={pwdError} tone="error" /> : null}
        {pwdStatus ? <AlertBanner message={pwdStatus} tone="success" /> : null}
        <PrimaryButton
          title="Şifreyi Güncelle"
          onPress={handleChangePassword}
          loading={pwdSaving}
          style={styles.goldBtn}
        />
      </Card>
      </FadeInView>

      <FadeInView delay={200} style={styles.links}>
        <SecondaryButton title="Ayarlar ve bildirimler" onPress={() => router.push('/(customer)/settings')} />
        <SecondaryButton title="Adreslerim" onPress={() => router.push('/(customer)/(tabs)/addresses')} />
        <SecondaryButton title="Geçmiş Seferlerim" onPress={() => router.push('/(customer)/(tabs)/history')} />
        <SecondaryButton title="Analitik" onPress={() => router.push('/(customer)/(tabs)/analytics')} />
        <SecondaryButton title="Çıkış Yap" onPress={handleLogout} style={styles.logoutBtn} />
      </FadeInView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: typography.h2.fontFamily, fontSize: 22 },
  heroName: { ...typography.h2, fontSize: 19, color: '#F6F8FB' },
  heroCompany: { ...typography.caption, textTransform: 'none', color: palette.textSecondary, marginTop: 2 },
  heroBadges: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm, flexWrap: 'wrap' },
  roleBadge: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.sm + 2, paddingVertical: 3 },
  roleBadgeText: { fontFamily: typography.label.fontFamily, fontSize: 11, letterSpacing: 0.4 },
  sectionTitle: { ...typography.h3, color: palette.gold, marginBottom: spacing[3] },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  fieldHint: { ...typography.caption, textTransform: 'none' },
  goldBtn: { backgroundColor: palette.gold },
  links: { gap: space.sm },
  logoutBtn: { alignSelf: 'flex-start', marginTop: space.sm },
});
