import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Colors } from '../../../src/constants/colors';

type TabIcon = keyof typeof Ionicons.glyphMap;

function tabIcon(name: TabIcon, focused: boolean, color: string) {
  return <Ionicons name={name} size={22} color={focused ? Colors.primary : color} />;
}

export default function CustomerTabsLayout() {
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: Colors.bgDark },
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
          title: 'Ilanlarim',
          tabBarIcon: ({ focused, color }) => tabIcon('cube-outline', focused, color),
        }}
      />
      <Tabs.Screen
        name="create-load"
        options={{
          title: 'Ilan Olustur',
          tabBarIcon: ({ focused, color }) => tabIcon('add-circle-outline', focused, color),
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
