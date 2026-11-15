import React, { useState } from 'react';
import { ScrollView, View, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Avatar from '../../src/components/Avatar';
import Icon from '../../src/components/Icon';
import { showToast } from '../../src/components/Toast';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeStore, useColors } from '../../src/store/themeStore';
import { updateProfile, changePassword } from '../../src/lib/api';
import { RADIUS } from '../../src/constants/config';

function Section({ children }) {
  const C = useColors();
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: RADIUS.card,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
}

function Row({ icon, title, onPress, right, danger }) {
  const C = useColors();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={icon} size={22} color={danger ? C.danger : C.primary} />
      <Text style={{ flex: 1 }} color={danger ? C.danger : undefined} bold={!!danger}>
        {title}
      </Text>
      {right}
    </Pressable>
  );
}

export default function Profile() {
  const C = useColors();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.display_name || '');
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState('');

  const saveName = async () => {
    try {
      const u = await updateProfile({ displayName: name });
      setUser(u);
      setEditName(false);
      showToast('تم حفظ الاسم', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const savePw = async () => {
    setPwError('');
    if (newPw.length < 8) return setPwError('كلمة المرور الجديدة قصيرة، الحد الأدنى ٨ أحرف.');
    try {
      await changePassword(oldPw, newPw);
      setOldPw('');
      setNewPw('');
      setPwOpen(false);
      showToast('تم تغيير كلمة المرور', 'success');
    } catch (e) {
      setPwError(e.message);
    }
  };

  const confirmLogout = () =>
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج من هذا الجهاز؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: () => signOut() },
    ]);

  if (!user) return <Screen title="حسابي" tabs><View /></Screen>;

  return (
    <Screen title="حسابي" tabs>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 28 }}>
        <Section>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable onPress={() => router.push('/avatar')}>
              <Avatar id={user.avatar_id} size={68} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text variant="heading" numberOfLines={1}>
                {user.display_name}
              </Text>
              <Text muted style={{ textAlign: 'left', writingDirection: 'ltr', alignSelf: 'flex-start' }}>
                @{user.username}
              </Text>
            </View>
          </View>
          <Row icon="image" title="تغيير الأفتار" onPress={() => router.push('/avatar')} />
          {editName ? (
            <View style={{ gap: 10 }}>
              <Input label="الاسم الظاهر" value={name} onChangeText={setName} maxLength={32} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="حفظ" onPress={saveName} style={{ flex: 1 }} />
                <Button
                  title="إلغاء"
                  variant="secondary"
                  onPress={() => {
                    setName(user.display_name);
                    setEditName(false);
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <Row icon="edit" title="تعديل الاسم الظاهر" onPress={() => setEditName(true)} />
          )}
        </Section>

        <Section>
          <Row
            icon={mode === 'dark' ? 'moon' : 'sun'}
            title="الوضع الداكن"
            onPress={toggle}
            right={<Switch value={mode === 'dark'} onValueChange={toggle} trackColor={{ true: C.primary, false: C.border }} thumbColor={C.white} />}
          />
        </Section>

        <Section>
          <Row icon="lock" title="تغيير كلمة المرور" onPress={() => setPwOpen(!pwOpen)} />
          {pwOpen ? (
            <View style={{ gap: 10 }}>
              <Input label="كلمة المرور الحالية" value={oldPw} onChangeText={setOldPw} secureTextEntry autoCapitalize="none" ltr />
              <Input label="كلمة المرور الجديدة" value={newPw} onChangeText={setNewPw} secureTextEntry autoCapitalize="none" ltr error={pwError} />
              <Button title="تغيير كلمة المرور" onPress={savePw} />
            </View>
          ) : null}
        </Section>

        <Section>
          <Row icon="info" title="الشروط والأحكام" onPress={() => router.push('/legal?type=terms')} />
          <Row icon="lock" title="سياسة الخصوصية" onPress={() => router.push('/legal?type=privacy')} />
        </Section>

        <Section>
          <Row icon="logout" title="تسجيل الخروج" onPress={confirmLogout} danger />
        </Section>
      </ScrollView>
    </Screen>
  );
}
