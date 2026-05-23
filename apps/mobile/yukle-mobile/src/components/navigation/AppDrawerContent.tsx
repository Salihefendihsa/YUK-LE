import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getDrawerItems,
  isDrawerItemActive,
  ROLE_LABELS,
  type AppRole,
} from '../../navigation/drawerMenus';
import { useAuthStore } from '../../store/auth.store';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = DrawerContentComponentProps & { role: AppRole };

export function AppDrawerContent({ navigation, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const items = getDrawerItems(role);

  const navigate = (href: string) => {
    router.push(href as never);
    navigation.closeDrawer();
  };

  const handleLogout = () => {
    navigation.closeDrawer();
    logout();
    router.replace('/');
  };

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + spacing[2], paddingBottom: insets.bottom + spacing[2] },
      ]}
    >
      <View style={styles.brandBlock}>
        <Text style={styles.logo}>YÜK-LE</Text>
        <View style={styles.accentLine} />
        <Text style={styles.userName} numberOfLines={1}>
          {user?.fullName ?? 'Kullanıcı'}
        </Text>
        <Text style={styles.roleLabel}>{ROLE_LABELS[role]}</Text>
      </View>

      <DrawerContentScrollView
        contentContainerStyle={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        style={styles.menuList}
      >
        {items.map((item) => {
          const active = isDrawerItemActive(pathname, item);
          return (
            <Pressable
              key={item.href}
              onPress={() => navigate(item.href)}
              style={({ pressed }) => [
                styles.item,
                active && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={active ? palette.brand : palette.textSecondary}
              />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]} numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </DrawerContentScrollView>

      <Pressable
        style={({ pressed }) => [styles.logout, pressed && styles.itemPressed]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color={palette.error} />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bgElevated,
    borderRightWidth: 1,
    borderRightColor: palette.borderSubtle,
  },
  brandBlock: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[1],
  },
  logo: {
    fontFamily: fontFamily.bold,
    fontSize: 26,
    color: palette.brand,
    letterSpacing: 1,
  },
  accentLine: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.gold,
    marginVertical: spacing[2],
  },
  userName: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    color: palette.text,
  },
  roleLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: palette.gold,
  },
  menuList: { flex: 1 },
  menuScroll: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[4],
    gap: spacing[1],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
  },
  itemPressed: { opacity: 0.85 },
  itemLabel: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: palette.textSecondary,
  },
  itemLabelActive: {
    fontFamily: fontFamily.semiBold,
    color: palette.brand,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.errorBorder,
    backgroundColor: palette.errorBg,
  },
  logoutText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: palette.error,
  },
});
