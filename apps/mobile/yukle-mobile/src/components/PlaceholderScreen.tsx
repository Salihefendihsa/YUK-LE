import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { screenRootStyle } from '../constants/layout';
import { useAuthStore } from '../store/auth.store';

type Props = {
  title: string;
  showLogout?: boolean;
};

export function PlaceholderScreen({ title, showLogout }: Props) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {showLogout ? (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...screenRootStyle,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  title: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  logoutBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
