import React, { useRef, useState } from 'react';
import { Pressable, ActivityIndicator, View } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import { useColors } from '../store/themeStore';
import { RADIUS } from '../constants/config';

// variant: primary | secondary | danger | ghost
export default function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style }) {
  const C = useColors();
  const busy = useRef(false);
  const [internal, setInternal] = useState(false);
  const isLoading = loading || internal;

  const bg = { primary: C.primary, secondary: C.surfaceAlt, danger: C.danger, ghost: 'transparent' }[variant];
  const fg = { primary: C.onPrimary, secondary: C.text, danger: C.white, ghost: C.primary }[variant];

  // يمنع الضغط المزدوج: لا يُنفَّذ الإجراء مرتين حتى ينتهي الأول
  const handle = async () => {
    if (busy.current || disabled || isLoading) return;
    busy.current = true;
    setInternal(true);
    try {
      await onPress?.();
    } finally {
      busy.current = false;
      setInternal(false);
    }
  };

  return (
    <Pressable
      onPress={handle}
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        {
          minHeight: 50,
          borderRadius: RADIUS.button,
          backgroundColor: bg,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <Text bold color={fg} style={{ textAlign: 'center' }}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
