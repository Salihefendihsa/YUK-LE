import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { useNotificationsStore } from '../store/notifications.store';

type Props = {
  size?: number;
};

export function NotificationBell({ size = 24 }: Props) {
  const router = useRouter();
  const unread = useNotificationsStore((s) => s.unreadCount);

  return (
    <Pressable
      style={styles.wrap}
      onPress={() => router.push('/notifications')}
      accessibilityLabel="Bildirimler"
    >
      <Ionicons name="notifications-outline" size={size} color={Colors.textPrimary} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#050608', fontSize: 10, fontWeight: '800' },
});
