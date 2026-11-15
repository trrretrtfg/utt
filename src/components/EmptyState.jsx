import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import Button from './Button';
import { useColors } from '../store/themeStore';

export function Loading({ label = 'جارٍ التحميل…' }) {
  const C = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
      <ActivityIndicator color={C.primary} size="large" />
      <Text muted>{label}</Text>
    </View>
  );
}

export default function EmptyState({ icon = 'image', title, hint, actionTitle, onAction }) {
  const C = useColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: C.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <Icon name={icon} size={30} color={C.primary} />
      </View>
      <Text variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {hint ? (
        <Text muted style={{ textAlign: 'center' }}>
          {hint}
        </Text>
      ) : null}
      {actionTitle ? <Button title={actionTitle} onPress={onAction} style={{ marginTop: 10, minWidth: 180 }} /> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState icon="info" title="تعذّر التحميل" hint={message} actionTitle="إعادة المحاولة" onAction={onRetry} />
  );
}
