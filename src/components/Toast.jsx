import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './Text';
import { useColors } from '../store/themeStore';

const useToastStore = create((set) => ({ msg: null, kind: 'info', n: 0 }));

export function showToast(msg, kind = 'info') {
  useToastStore.setState((s) => ({ msg, kind, n: s.n + 1 }));
}

export function ToastHost() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { msg, kind, n } = useToastStore();
  const op = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!msg) return undefined;
    op.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2600),
      Animated.timing(op, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [n]);

  if (!msg) return null;
  const bg = kind === 'error' ? C.danger : kind === 'success' ? C.success : C.surfaceAlt;
  const fg = kind === 'info' ? C.text : C.white;
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 90, opacity: op }}
    >
      <View style={{ backgroundColor: bg, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16 }}>
        <Text color={fg} bold style={{ textAlign: 'center' }}>
          {msg}
        </Text>
      </View>
    </Animated.View>
  );
}
