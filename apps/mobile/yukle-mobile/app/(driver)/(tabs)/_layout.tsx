import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { palette } from '../../../src/theme/colors';
import { fontFamily } from '../../../src/theme/typography';

type TabIcon = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIcon, focused: boolean, color: string) {
  return <Ionicons name={name} size={22} color={focused ? palette.brand : color} />;
}

export default function DriverTabsLayout() {
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
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused, color }) => tabIcon('home-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="loads"
        options={{
          title: 'Yukler',
          tabBarIcon: ({ focused, color }) => tabIcon('cube-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="active-load"
        options={{
          title: 'Aktif Sefer',
          tabBarIcon: ({ focused, color }) => tabIcon('navigate-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Cuzdan',
          tabBarIcon: ({ focused, color }) => tabIcon('wallet-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => tabIcon('person-outline', focused, color),
        }}
      />
    </Tabs>
  );
}
