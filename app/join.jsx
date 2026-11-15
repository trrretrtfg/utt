import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../src/components/Screen';
import Text from '../src/components/Text';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import Icon from '../src/components/Icon';
import { useColors } from '../src/store/themeStore';
import { joinRoom } from '../src/lib/api';

export default function Join() {
  const C = useColors();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const submit = async () => {
    setError('');
    if (code.trim().length < 6) return setError('أدخل رمز الدعوة كاملاً.');
    try {
      const res = await joinRoom(code);
      setDone(true);
    } catch (e) {
      setError(e.message);
    }
  };

  if (done) {
    return (
      <Screen title="الانضمام إلى غرفة" back>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={38} color={C.success} strokeWidth={2.4} />
          </View>
          <Text variant="heading" style={{ textAlign: 'center' }}>
            أُرسل طلب الانضمام
          </Text>
          <Text muted style={{ textAlign: 'center' }}>
            تم إرسال طلب الانضمام إلى مدير الغرفة. ستظهر لك نتيجة الطلب هنا عند تحديث القائمة، وسيصلك إشعار داخل التطبيق عند اتخاذ القرار.
          </Text>
          <Button title="العودة إلى الغرف" onPress={() => router.replace('/(tabs)/rooms')} style={{ marginTop: 12, minWidth: 200 }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="الانضمام إلى غرفة" back>
      <View style={{ gap: 16, paddingTop: 16 }}>
        <Text muted>اكتب رمز الدعوة الذي أرسله لك مدير الغرفة. سيراجع الطلب قبل قبولك.</Text>
        <Input
          label="رمز الدعوة"
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          ltr
          placeholder="ABCD234XYZ"
          error={error}
        />
        <Button title="إرسال طلب الانضمام" onPress={submit} />
      </View>
    </Screen>
  );
}
