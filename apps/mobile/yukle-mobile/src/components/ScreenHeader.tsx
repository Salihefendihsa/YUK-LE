import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/colors';
import { fontFamily } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { NotificationBell } from './NotificationBell';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /** Drawer ekranlarında hamburger (varsayılan: true) */
  showMenu?: boolean;
  /** Stack detay ekranlarında geri */
  showBack?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  right,
  showMenu = true,
  showBack = false,
}: Props) {
  const navigation = useNavigation();

  const onLeadingPress = () => {
    if (showBack) {
      navigation.goBack();
      return;
    }
    if (showMenu) {
      navigation.dispatch(DrawerActions.toggleDrawer());
    }
  };

  const showLeading = showBack || showMenu;

  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        {showLeading ? (
          <Pressable
            onPress={onLeadingPress}
            style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={showBack ? 'Geri' : 'Menü'}
          >
            <Ionicons
              name={showBack ? 'arrow-back' : 'menu'}
              size={24}
              color={palette.text}
            />
          </Pressable>
        ) : null}
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.sub} numberOfLines={2} ellipsizeMode="tail">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        {right}
        <NotificationBell />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    minWidth: 0,
  },
  menuBtn: {
    padding: spacing[1],
    marginTop: 2,
    borderRadius: 8,
  },
  menuBtnPressed: { opacity: 0.7 },
  textCol: { flex: 1, flexShrink: 1, gap: spacing[1], minWidth: 0 },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: palette.text,
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: palette.textSecondary,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
