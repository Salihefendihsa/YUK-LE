import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/colors';
import { typography } from '../theme/typography';
import { space } from '../theme/spacing';
import { radius } from '../theme/radius';
import { sizes } from '../theme/sizes';
import { NotificationBell } from './NotificationBell';
import { PressableScale } from './ui/PressableScale';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  showMenu?: boolean;
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
          <PressableScale
            onPress={onLeadingPress}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel={showBack ? 'Geri' : 'Menü'}
          >
            <Ionicons
              name={showBack ? 'arrow-back' : 'menu'}
              size={sizes.icon.md}
              color={palette.text}
            />
          </PressableScale>
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
    gap: space.sm,
    marginBottom: space.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    minWidth: 0,
  },
  menuBtn: {
    width: sizes.header.menuHit,
    height: sizes.header.menuHit,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  textCol: { flex: 1, flexShrink: 1, gap: space.xs, minWidth: 0, paddingTop: space.xs },
  title: typography.h2,
  sub: typography.bodySmall,
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
});
