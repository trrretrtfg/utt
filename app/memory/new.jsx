import React, { useEffect, useState } from 'react';
import { ScrollView, View, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Icon from '../../src/components/Icon';
import EmptyState, { Loading } from '../../src/components/EmptyState';
import { showToast } from '../../src/components/Toast';
import { useColors } from '../../src/store/themeStore';
import { listMyRooms, createMemory, deleteMemory } from '../../src/lib/api';
import { pickImages, uploadMemoryImages } from '../../src/lib/images';
import { LIMITS, RADIUS } from '../../src/constants/config';

export default function NewMemory() {
  const C = useColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rooms, setRooms] = useState(null);
  const [roomId, setRoomId] = useState(params.roomId || null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [assets, setAssets] = useState([]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    listMyRooms()
      .then((r) => {
        setRooms(r);
        if (!roomId && r.length === 1) setRoomId(r[0].id);
      })
      .catch((e) => {
        setRooms([]);
        setError(e.message);
      });
  }, []);

  const choose = async () => {
    const res = await pickImages(LIMITS.maxImages - assets.length);
    if (res.denied) return showToast('اسمح للتطبيق بالوصول إلى الصور من إعدادات الجهاز.', 'error');
    if (res.assets.length) setAssets((a) => [...a, ...res.assets].slice(0, LIMITS.maxImages));
  };

  const submit = async () => {
    setError('');
    if (!roomId) return setError('اختر الغرفة أولاً.');
    if (title.trim().length < 1) return setError('اكتب عنواناً للذكرى.');
    if (assets.length === 0) return setError('أضف صورة واحدة على الأقل.');
    let memoryId = null;
    try {
      setProgress(0);
      const m = await createMemory(roomId, title, desc);
      memoryId = m.id;
      await uploadMemoryImages(memoryId, assets, (d, t) => setProgress(d / t));
      showToast('تمت إضافة الذكرى', 'success');
      router.replace(`/room/${roomId}`);
    } catch (e) {
      // لا نترك ذكرى ناقصة: نحذفها ليعيد المستخدم المحاولة بنفس الصور
      if (memoryId) deleteMemory(memoryId).catch(() => {});
      setError(e.message);
      setProgress(null);
    }
  };

  if (rooms === null) return <Screen title="ذكرى جديدة" back><Loading /></Screen>;
  if (rooms.length === 0) {
    return (
      <Screen title="ذكرى جديدة" back>
        <EmptyState
          icon="rooms"
          title="تحتاج غرفة أولاً"
          hint="الذكريات تُحفظ داخل الغرف. أنشئ غرفة أو انضم إلى واحدة."
          actionTitle="الذهاب إلى الغرف"
          onAction={() => router.replace('/(tabs)/rooms')}
        />
      </Screen>
    );
  }

  const uploading = progress !== null;

  return (
    <Screen title="ذكرى جديدة" back>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ gap: 14, paddingVertical: 12 }} keyboardShouldPersistTaps="handled">
          {rooms.length > 1 ? (
            <View style={{ gap: 6 }}>
              <Text variant="caption" muted bold>
                الغرفة
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {rooms.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => setRoomId(r.id)}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 16,
                      borderRadius: 22,
                      justifyContent: 'center',
                      backgroundColor: roomId === r.id ? C.primary : C.surfaceAlt,
                    }}
                  >
                    <Text bold variant="caption" color={roomId === r.id ? C.onPrimary : C.text}>
                      {r.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Pressable
            onPress={choose}
            disabled={uploading || assets.length >= LIMITS.maxImages}
            style={{
              minHeight: 120,
              borderRadius: RADIUS.card,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: C.primary,
              backgroundColor: C.surface,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              opacity: assets.length >= LIMITS.maxImages ? 0.5 : 1,
            }}
          >
            <Icon name="image" size={30} color={C.primary} />
            <Text bold>{assets.length ? 'إضافة المزيد من الصور' : 'اختر الصور'}</Text>
            <Text variant="caption" muted>
              حتى {LIMITS.maxImages} صور · {assets.length} مختارة
            </Text>
          </Pressable>

          {assets.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {assets.map((a, i) => (
                <View key={a.uri + i} style={{ width: 92, height: 92 }}>
                  <Image source={{ uri: a.uri }} style={{ width: 92, height: 92, borderRadius: 12 }} contentFit="cover" />
                  {!uploading ? (
                    <Pressable
                      onPress={() => setAssets((x) => x.filter((_, j) => j !== i))}
                      hitSlop={6}
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: C.scrim,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name="close" size={14} color={C.text} strokeWidth={2.4} />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <Input label="العنوان" value={title} onChangeText={setTitle} maxLength={LIMITS.maxTitle} placeholder="مثال: غروب الشاطئ" />
          <Input
            label="التفاصيل (اختياري)"
            value={desc}
            onChangeText={setDesc}
            maxLength={LIMITS.maxDescription}
            multiline
            placeholder="احكِ القصة وراء هذه اللحظة…"
            error={error}
          />

          {uploading ? (
            <View style={{ gap: 8 }}>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: C.surfaceAlt, overflow: 'hidden' }}>
                <View style={{ height: 8, width: `${Math.round(progress * 100)}%`, backgroundColor: C.primary }} />
              </View>
              <Text variant="caption" muted style={{ textAlign: 'center' }}>
                جارٍ رفع الصور… لا تغلق التطبيق
              </Text>
            </View>
          ) : null}

          <Button title="نشر الذكرى" onPress={submit} disabled={uploading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
