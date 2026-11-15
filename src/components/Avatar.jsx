import React from 'react';
import { View } from 'react-native';
import Icon from './Icon';
import { AVATARS } from '../constants/config';
import { useColors } from '../store/themeStore';

export default function Avatar({ id, size = 40 }) {
  const C = useColors();
  const a = AVATARS.find((x) => x.id === id) || AVATARS[0];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: a.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={a.icon} size={size * 0.5} color={C.black} strokeWidth={2} />
    </View>
  );
}
