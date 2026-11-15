import React from 'react';
import { Text as RNText } from 'react-native';
import { FONTS } from '../constants/config';
import { useColors } from '../store/themeStore';

// variant: title | heading | body | caption
const SIZES = { title: 26, heading: 18, body: 15, caption: 12.5 };

export default function Text({ variant = 'body', bold, muted, color, style, ...rest }) {
  const C = useColors();
  const size = SIZES[variant] || SIZES.body;
  const isBold = bold || variant === 'title' || variant === 'heading';
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: isBold ? FONTS.bold : FONTS.regular,
          fontSize: size,
          lineHeight: Math.round(size * 1.55),
          color: color || (muted ? C.textMuted : C.text),
          textAlign: 'right',
          writingDirection: 'rtl',
        },
        style,
      ]}
    />
  );
}
