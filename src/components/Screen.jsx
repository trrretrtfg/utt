import React from 'react';
import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Text from './Text';
import Icon from './Icon';
import { useColors } from '../store/themeStore';
import { SPACING } from '../constants/config';

// غلاف موحّد للشاشات: خلفية + مساحة آمنة + عنوان اختياري مع زر رجوع
export default function Screen({ title, back, right, children, padded = true, tabs = false }) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      {title || back ? (
        <View
          style={{
            minHeight: 56,
            paddingHorizontal: SPACING,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {back ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={10}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="back" color={C.text} />
            </Pressable>
          ) : null}
          <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      <View style={{ flex: 1, paddingHorizontal: padded ? SPACING : 0, paddingBottom: tabs ? 0 : insets.bottom }}>
        {children}
      </View>
    </View>
  );
}
