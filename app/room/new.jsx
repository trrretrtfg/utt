import React, { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Icon from '../../src/components/Icon';
import { showToast } from '../../src/components/Toast';
import { useColors } from '../../src/store/themeStore';
import { createRoom } from '../../src/lib/api';
import { RADIUS } from '../../src/constants/config';

export default function NewRoom() {
  const C = useColors();
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [anon, setAnon] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const submit = async () => {
    setError('');
    if (name.trim().length < 2) return setError('اسم الغرفة حرفان على الأقل.');
    try {
      const res = await createRoom(name, desc, anon);
      setCreated(res);
    } catch (e) {
      setError(e.message);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(created.join_code);
    showToast('تم نسخ الرمز', 'success');
  };

  if (created) {
    return (
      <Screen title="تم إنشاء الغرفة" back>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <Text variant="heading" style={{ textAlign: 'center' }}>
            «{created.room.name}»
          </Text>
          <Text muted style={{ textAlign: 'center' }}>
            شارك رمز الدعوة مع من تريد. كل طلب انضمام يحتاج موافقتك.
          </Text>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: RADIUS.card,
              borderWidth: 1.5,
              borderColor: C.primary,
              paddingVertical: 20,
              paddingHorizontal: 28,
            }}
          >
            <Text variant="title" color={C.primary} style={{ letterSpacing: 4, textAlign: 'center', writingDirection: 'ltr' }} selectable>
              {created.join_code}
            </Text>
          </View>
          <Text variant="caption" muted style={{ textAlign: 'center' }}>
            الرمز لا يُعرض مرة ثانية، لكن يمكنك إنشاء رمز جديد من صفحة الغرفة.
          </Text>
          <Button title="نسخ الرمز" icon="copy" onPress={copy} style={{ minWidth: 200 }} />
          <Button title="فتح الغرفة" variant="secondary" onPress={() => router.replace(`/room/${created.room.id}`)} style={{ minWidth: 200 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="غرفة جديدة" back>
      <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
        <Input label="اسم الغرفة" value={name} onChangeText={setName} maxLength={60} placeholder="مثال: رحلة الصيف" error={error} />
        <Input label="وصف (اختياري)" value={desc} onChangeText={setDesc} maxLength={500} multiline placeholder="عمّ تدور هذه الغرفة؟" />
        <Pressable
          onPress={() => setAnon(!anon)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              borderWidth: 1.5,
              borderColor: anon ? C.primary : C.border,
              backgroundColor: anon ? C.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {anon ? <Icon name="check" size={16} color={C.onPrimary} strokeWidth={2.6} /> : null}
          </View>
          <Text style={{ flex: 1 }}>السماح بالتعليقات المجهولة</Text>
        </Pressable>
        <Button title="إنشاء الغرفة" onPress={submit} />
      </ScrollView>
    </Screen>
  );
}
