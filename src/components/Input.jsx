import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import Text from './Text';
import { useColors } from '../store/themeStore';
import { FONTS, RADIUS } from '../constants/config';

export default function Input({ label, error, multiline, style, inputStyle, ltr, ...rest }) {
  const C = useColors();
  const [focus, setFocus] = useState(false);
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? (
        <Text variant="caption" muted bold>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...rest}
        multiline={multiline}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholderTextColor={C.textMuted}
        style={[
          {
            minHeight: multiline ? 110 : 50,
            borderRadius: RADIUS.button,
            borderWidth: 1.5,
            borderColor: error ? C.danger : focus ? C.primary : C.border,
            backgroundColor: C.surface,
            color: C.text,
            fontFamily: FONTS.regular,
            fontSize: 15,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 8,
            textAlign: ltr ? 'left' : 'right',
            writingDirection: ltr ? 'ltr' : 'rtl',
            textAlignVertical: multiline ? 'top' : 'center',
          },
          inputStyle,
        ]}
      />
      {error ? (
        <Text variant="caption" color={C.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
