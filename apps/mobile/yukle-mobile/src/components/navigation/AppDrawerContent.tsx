import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getDrawerItems,
  isDrawerItemActive,
  ROLE_LABELS,
  type AppRole,
} from '../../navigation/drawerMenus';
import { Logo } from '../brand/Logo';
import { PressableScale } from '../ui/PressableScale';
import { useAuthStore } from '../../store/auth.store';
import { palette } from '../../theme/colors';
import { fontFamily } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

type Props = DrawerContentComponentProps & { role: AppRole };

/** fullName -> en fazla 2 harfli bas-harf rumuzu (avatar icin). */
function getInitials(fullName?: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return initials || 'K';
}

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
    <View style={[styles.root, { paddingBottom: insets.bottom + spacing[2] }]}>
      {/* Gradient baslik — ambient turuncu isima + Logo + rol paneli rozeti */}
      <LinearGradient
        colors={['rgba(255,122,26,0.18)', 'rgba(255,122,26,0.04)', 'transparent']}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + spacing[4] }]}
      >
        <Logo variant="full" size="md" theme="dark" />
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{ROLE_LABELS[role]} Paneli</Text>
        </View>
      </LinearGradient>

      {/* Kullanici blogu — bas-harf avatari + ad + rol */}
      <View style={styles.userRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.fullName)}</Text>
        </View>
        <View style={styles.userMeta}>
          <Text style={styles.userName} numberOfLines={1}>
            {user?.fullName ?? 'Kullanıcı'}
          </Text>
          <Text style={styles.roleLabel}>{ROLE_LABELS[role]}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <DrawerContentScrollView
        contentContainerStyle={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        style={styles.menuList}
      >
        {items.map((item) => {
          const active = isDrawerItemActive(pathname, item);
          return (
            <PressableScale
              key={item.href}
              onPress={() => navigate(item.href)}
              style={[styles.item, active && styles.itemActive]}
            >
              <View style={[styles.itemBar, active && styles.itemBarOn]} />
              <Ionicons
                name={item.icon}
                size={21}
                color={active ? palette.brand : palette.textSecondary}
              />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]} numberOfLines={2}>
                {item.label}
              </Text>
            </PressableScale>
          );
        })}
      </DrawerContentScrollView>

      {/* Alt — ayrac + cikis + marka satiri */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <PressableScale style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={palette.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </PressableScale>
        <Text style={styles.brandFoot}>Navlonix · Lojistik Pazaryeri</Text>
      </View>
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
  header: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.brandMuted,
    borderWidth: 1,
    borderColor: palette.brandBorder,
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  rolePillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: palette.brand,
    textTransform: 'uppercase',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  userMeta: { flex: 1, gap: 2 },
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
  divider: {
    height: 1,
    backgroundColor: palette.borderSubtle,
    marginHorizontal: spacing[5],
  },
  menuList: { flex: 1 },
  menuScroll: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingRight: spacing[3],
    paddingLeft: spacing[2],
    borderRadius: 12,
  },
  itemActive: {
    backgroundColor: palette.brandMuted,
  },
  itemBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  itemBarOn: {
    backgroundColor: palette.brand,
  },
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
  footer: { gap: spacing[3], paddingTop: spacing[1] },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginHorizontal: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.errorBorder,
    backgroundColor: palette.errorBg,
  },
  logoutText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    color: palette.error,
  },
  brandFoot: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: palette.textFaint,
    textAlign: 'center',
  },
});
