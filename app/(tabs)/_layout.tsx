import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CalendarDays, Cloud, Home, ListChecks, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} icon={Home} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} icon={CalendarDays} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: t('tabs.weather'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} icon={Cloud} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: t('tabs.checklists'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} icon={ListChecks} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <IconSymbol size={26} icon={Settings} color={color} />,
        }}
      />
    </Tabs>
  );
}
