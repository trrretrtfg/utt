import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../src/components/Icon';
import Text from '../../src/components/Text';
import { useColors } from '../../src/store/themeStore';
import { useDataStore } from '../../src/store/dataStore';
import { FONTS } from '../../src/constants/config';

function TabIcon({ name, color, badge }) {
  const C = useColors();
  return (
    <View>
      <Icon name={name} color={color} size={24} />
      {badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: C.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          }}
        >
          <Text variant="caption" color={C.white} bold style={{ lineHeight: 16, fontSize: 11, textAlign: 'center' }}>
            {badge > 9 ? '9+' : badge}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TabsLayout() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const unread = useDataStore((s) => s.unread);
  const refreshUnread = useDataStore((s) => s.refreshUnread);

  useEffect(() => {
    refreshUnread();
    const id = setInterval(refreshUnread, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: { fontFamily: FONTS.bold, fontSize: 11.5 },
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'الرئيسية', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
      <Tabs.Screen name="rooms" options={{ title: 'الغرف', tabBarIcon: ({ color }) => <TabIcon name="rooms" color={color} /> }} />
      <Tabs.Screen
        name="notifications"
        options={{ title: 'الإشعارات', tabBarIcon: ({ color }) => <TabIcon name="bell" color={color} badge={unread} /> }}
      />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: ({ color }) => <TabIcon name="user" color={color} /> }} />
    </Tabs>
  );
}
