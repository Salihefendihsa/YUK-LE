import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { palette } from '../../../src/theme/colors';
import { fontFamily } from '../../../src/theme/typography';

type TabIcon = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIcon, focused: boolean, color: string) {
  return <Ionicons name={name} size={22} color={focused ? palette.brand : color} />;
}

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.borderSubtle,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarLabelStyle: {
          fontFamily: fontFamily.semiBold,
          fontSize: 10,
        },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Genel Bakis',
          tabBarIcon: ({ focused, color }) => tabIcon('grid-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Belgeler',
          tabBarIcon: ({ focused, color }) => tabIcon('document-text-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Kullanicilar',
          tabBarIcon: ({ focused, color }) => tabIcon('people-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Odemeler',
          tabBarIcon: ({ focused, color }) => tabIcon('card-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="system"
        options={{
          title: 'Sistem',
          tabBarIcon: ({ focused, color }) => tabIcon('settings-outline', focused, color),
        }}
      />
    </Tabs>
  );
}
