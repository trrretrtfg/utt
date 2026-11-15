import React, { useState } from 'react';
import { ScrollView, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../src/components/Screen';
import Text from '../src/components/Text';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import Icon from '../src/components/Icon';
import { useAuthStore } from '../src/store/authStore';
import { useColors } from '../src/store/themeStore';

export default function Register() {
  const C = useColors();
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (displayName.trim().length < 2) return setError('اكتب اسماً ظاهراً من حرفين على الأقل.');
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
      return setError('اسم المستخدم: ٣–٢٠ حرفاً إنجليزياً أو أرقاماً أو شرطة سفلية.');
    }
    if (password.length < 8) return setError('كلمة المرور قصيرة، الحد الأدنى ٨ أحرف.');
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين.');
    if (!agree) return setError('يجب الموافقة على الشروط وسياسة الخصوصية.');
    try {
      await signUp(username, password, displayName);
      router.replace('/');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Screen title="إنشاء حساب" back>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
          <Input label="الاسم الظاهر" value={displayName} onChangeText={setDisplayName} maxLength={32} placeholder="مثال: علي" />
          <Input
            label="اسم المستخدم (للدخول)"
            value={username}
            onChangeText={(v) => setUsername(v.toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            ltr
            placeholder="username"
          />
          <Input label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" ltr placeholder="٨ أحرف على الأقل" />
          <Input label="تأكيد كلمة المرور" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" ltr placeholder="أعد كتابتها" error={error} />

          <Pressable
            onPress={() => setAgree(!agree)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 8,
                borderWidth: 1.5,
                borderColor: agree ? C.primary : C.border,
                backgroundColor: agree ? C.primary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {agree ? <Icon name="check" size={16} color={C.onPrimary} strokeWidth={2.6} /> : null}
            </View>
            <Text style={{ flex: 1 }}>
              أوافق على{' '}
              <Text color={C.primary} bold onPress={() => router.push('/legal?type=terms')}>
                الشروط
              </Text>{' '}
              و
              <Text color={C.primary} bold onPress={() => router.push('/legal?type=privacy')}>
                سياسة الخصوصية
              </Text>
            </Text>
          </Pressable>

          <Button title="إنشاء الحساب" onPress={submit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
