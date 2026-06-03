import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { AlertBanner } from '../../../src/components/ui/AlertBanner';
import { Card } from '../../../src/components/ui/Card';
import { FadeInView } from '../../../src/components/ui/FadeInView';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { PrimaryButton } from '../../../src/components/ui/PrimaryButton';
import { TextField } from '../../../src/components/ui/TextField';
import { ScreenContainer, ScreenScroll } from '../../../src/constants/layout';
import { getApiErrorMessage } from '../../../src/services/api.client';
import { changePassword, getUserProfile, updateUserProfile } from '../../../src/services/user.service';
import { useAuthStore } from '../../../src/store/auth.store';
import { palette } from '../../../src/theme/colors';
import { typography } from '../../../src/theme/typography';
import { space, spacing } from '../../../src/theme/spacing';

export default function AdminSettingsScreen() {
  const authUser = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');

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
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [authUser?.userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    if (!authUser?.userId) return;
    if (!fullName.trim()) {
      setError('Ad soyad zorunludur.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Geçerli bir e-posta girin.');
      return;
    }
    setProfileSaving(true);
    setError('');
    setProfileStatus('');
    try {
      await updateUserProfile(authUser.userId, {
        fullName: fullName.trim(),
        email: email.trim(),
      });
      setProfileStatus('Profil kaydedildi.');
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setProfileSaving(false);
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

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingState message="Yönetici bilgileri yükleniyor..." variant="skeleton" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenScroll contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Ayarlar" subtitle="Yönetici hesabı ve güvenlik" />

      {error ? <AlertBanner message={error} tone="error" /> : null}
      {profileStatus ? <AlertBanner message={profileStatus} tone="success" /> : null}

      <FadeInView>
        <Card variant="glass" padding={4}>
          <Text style={styles.sectionTitle}>Hesap bilgileri</Text>
          <TextField label="Ad Soyad" icon="person-outline" value={fullName} onChangeText={setFullName} />
          <TextField
            label="E-posta"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField label="Telefon" icon="call-outline" value={phone} editable={false} />
          <View style={styles.note}>
            <Text style={styles.noteText}>
              Telefon numarası salt okunurdur. Değişiklik için destekle iletişime geçin.
            </Text>
          </View>
          <PrimaryButton title="Kaydet" onPress={handleSaveProfile} loading={profileSaving} />
        </Card>
      </FadeInView>

      <FadeInView delay={60}>
        <Card variant="default" padding={4}>
          <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
          <TextField
            label="Mevcut şifre"
            icon="lock-closed-outline"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextField
            label="Yeni şifre"
            icon="lock-closed-outline"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextField
            label="Yeni şifre (tekrar)"
            icon="lock-closed-outline"
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
      </FadeInView>

      <FadeInView delay={120}>
        <Card variant="default" padding={4}>
          <Text style={styles.sectionTitle}>Bildirim tercihleri</Text>
          <Text style={styles.muted}>
            • Yeni belge / askıya alma uyarıları — yakında{'\n'}
            • Şüpheli aktivite e-postası — yakında{'\n'}
            • İki adımlı doğrulama — yakında
          </Text>
        </Card>
      </FadeInView>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: space.md, paddingBottom: spacing[10], gap: space.md },
  sectionTitle: { ...typography.h3, color: palette.gold, marginBottom: spacing[3] },
  goldBtn: { backgroundColor: palette.gold },
  note: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: palette.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.borderSubtle,
    marginBottom: spacing[3],
  },
  noteText: { ...typography.caption, textTransform: 'none', color: palette.textMuted },
  muted: { ...typography.bodySmall, color: palette.textMuted, lineHeight: 22 },
});
