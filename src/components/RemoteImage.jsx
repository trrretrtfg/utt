import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useMediaStore } from '../store/mediaStore';
import { useColors } from '../store/themeStore';

// صورة من التخزين الخاص: تطلب رابطاً موقّعاً ثم تعرضه مع كاش ثابت حسب معرّف الصورة
export default function RemoteImage({ id, variant = 'thumb', style, contentFit = 'cover' }) {
  const C = useColors();
  const entry = useMediaStore((s) => s[variant][id]);
  const ensure = useMediaStore((s) => s.ensure);

  useEffect(() => {
    if (!entry) ensure([id], variant).catch(() => {});
  }, [id, variant, !!entry]);

  if (!entry) return <View style={[{ backgroundColor: C.surfaceAlt }, style]} />;
  return (
    <Image
      source={{ uri: entry.url, cacheKey: `${variant}:${id}` }}
      style={[{ backgroundColor: C.surfaceAlt }, style]}
      contentFit={contentFit}
      transition={180}
    />
  );
}
