import React, { useState } from 'react';
import { ScrollView, View, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../src/components/Screen';
import Text from '../src/components/Text';
import Input from '../src/components/Input';
import Button from '../src/components/Button';
import Icon from '../src/components/Icon';
import { showToast } from '../src/components/Toast';
import { useAuthStore } from '../src/store/authStore';
import { useColors } from '../src/store/themeStore';

export default function Login() {
  const C = useColors();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('أدخل اسم المستخدم وكلمة المرور.');
      return;
    }
    try {
      await signIn(username, password);
      router.replace('/');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 16, paddingVertical: 24 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: C.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="heart" size={34} color={C.primary} filled />
            </View>
            <Text variant="title">ذِكرى</Text>
            <Text muted style={{ textAlign: 'center' }}>
              ذكرياتك مع من تحب، في مكان خاص بكم.
            </Text>
          </View>

          <Input
            label="اسم المستخدم"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            ltr
            placeholder="username"
          />
          <Input
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            ltr
            placeholder="••••••••"
            error={error}
          />
          <Button title="تسجيل الدخول" onPress={submit} />
          <Pressable onPress={() => router.push('/register')} style={{ minHeight: 48, justifyContent: 'center' }}>
            <Text color={C.primary} bold style={{ textAlign: 'center' }}>
              ليس لديك حساب؟ أنشئ حساباً
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
