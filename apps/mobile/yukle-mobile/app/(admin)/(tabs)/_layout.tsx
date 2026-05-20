import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Colors } from '../../../src/constants/colors';

type TabIcon = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIcon, focused: boolean, color: string) {
  return <Ionicons name={name} size={22} color={focused ? Colors.primary : color} />;
}

export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        sceneStyle: { backgroundColor: Colors.bgDark },
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
