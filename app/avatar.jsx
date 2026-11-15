import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../src/components/Screen';
import Text from '../src/components/Text';
import Button from '../src/components/Button';
import Avatar from '../src/components/Avatar';
import { showToast } from '../src/components/Toast';
import { useAuthStore } from '../src/store/authStore';
import { useColors } from '../src/store/themeStore';
import { updateProfile } from '../src/lib/api';
import { AVATARS } from '../src/constants/config';

export default function AvatarPicker() {
  const C = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [sel, setSel] = useState(user?.avatar_id || 'avatar_01');

  const save = async () => {
    try {
      const u = await updateProfile({ avatarId: sel });
      setUser(u);
      showToast('تم تغيير الأفتار', 'success');
      router.back();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <Screen title="اختر أفتارك" back>
      <View style={{ alignItems: 'center', marginVertical: 18 }}>
        <Avatar id={sel} size={96} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
        {AVATARS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setSel(a.id)}
            style={{
              padding: 4,
              borderRadius: 40,
              borderWidth: 2.5,
              borderColor: sel === a.id ? C.primary : 'transparent',
            }}
          >
            <Avatar id={a.id} size={64} />
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Button title="حفظ" onPress={save} style={{ marginBottom: 16 }} />
    </Screen>
  );
}
