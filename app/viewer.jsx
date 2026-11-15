import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  FlatList,
  Animated,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../src/components/Text';
import Icon from '../src/components/Icon';
import Avatar from '../src/components/Avatar';
import RemoteImage from '../src/components/RemoteImage';
import { Loading, ErrorState } from '../src/components/EmptyState';
import { showToast } from '../src/components/Toast';
import { useColors } from '../src/store/themeStore';
import { useMediaStore } from '../src/store/mediaStore';
import * as api from '../src/lib/api';
import { timeAgo, fullDate } from '../src/lib/format';
import { FONTS, LIMITS } from '../src/constants/config';

export default function Viewer() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width, height } = useWindowDimensions();
  const ensure = useMediaStore((s) => s.ensure);

  const [mem, setMem] = useState(null);
  const [error, setError] = useState('');
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [anon, setAnon] = useState(false);
  const [sending, setSending] = useState(false);
  const sheet = useRef(new Animated.Value(0)).current; // 0 مغلق، 1 مفتوح
  const likeBusy = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const m = await api.getMemory(id);
      setMem(m);
      ensure(m.media.map((x) => x.id), 'full').catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSheet = (to) => {
    setOpen(to);
    Animated.timing(sheet, { toValue: to ? 1 : 0, duration: 240, useNativeDriver: true }).start();
  };

  const like = async () => {
    if (likeBusy.current || !mem) return;
    likeBusy.current = true;
    const prev = mem;
    setMem({ ...mem, liked: !mem.liked, like_count: mem.like_count + (mem.liked ? -1 : 1) });
    try {
      const r = await api.toggleLike(mem.id);
      setMem((m) => ({ ...m, liked: r.liked, like_count: r.count }));
    } catch (e) {
      setMem(prev);
      showToast(e.message, 'error');
    }
    likeBusy.current = false;
  };

  const send = async () => {
    if (sending || !text.trim()) return;
    setSending(true);
    try {
      await api.addComment(mem.id, text, anon && mem.allow_anonymous);
      setText('');
      await load();
    } catch (e) {
      showToast(e.message, 'error');
    }
    setSending(false);
  };

  const removeComment = (c) =>
    Alert.alert('حذف التعليق', 'هل تريد حذف هذا التعليق؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteComment(c.id);
            await load();
          } catch (e) {
            showToast(e.message, 'error');
          }
        },
      },
    ]);

  const removeMemory = () =>
    Alert.alert('حذف الذكرى', 'سيتم حذف الذكرى وصورها وتعليقاتها.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteMemory(mem.id);
            router.back();
          } catch (e) {
            showToast(e.message, 'error');
          }
        },
      },
    ]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const shell = (child) => <View style={{ flex: 1, backgroundColor: C.black }}>{child}</View>;

  if (!mem && !error) return shell(<Loading label="جارٍ فتح الذكرى…" />);
  if (!mem) return shell(<ErrorState message={error} onRetry={load} />);

  const sheetH = Math.round(height * 0.78);
  const translateY = sheet.interpolate({ inputRange: [0, 1], outputRange: [sheetH, 0] });
  const canDeleteMemory = mem.my_role === 'owner' || mem.my_role === 'moderator' || mem.author_is_me;

  return (
    <View style={{ flex: 1, backgroundColor: C.black }}>
      <FlatList
        data={mem.media}
        keyExtractor={(m) => m.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
            <RemoteImage id={item.id} variant="full" contentFit="contain" style={{ width, height, backgroundColor: C.black }} />
          </View>
        )}
      />

      {/* الشريط العلوي: إغلاق + فقاعة التفاصيل + حذف */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 12,
          right: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          onPress={close}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.overlay, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="close" color={C.white} size={22} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          onPress={() => toggleSheet(true)}
          style={{
            minHeight: 46,
            paddingHorizontal: 20,
            borderRadius: 23,
            backgroundColor: 'rgba(255,255,255,0.82)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.92)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="info" size={18} color="#252525" />
          <Text bold color="#252525">
            التفاصيل
          </Text>
        </Pressable>

<View style={{ width: 46 }} />
      </View>

      {/* لوحة التفاصيل والتعليقات */}
      {open ? <Pressable onPress={() => toggleSheet(false)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: C.overlay }} /> : null}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetH,
          backgroundColor: C.bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY }],
        }}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.border }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar id={mem.author?.avatar_id} size={44} />
              <View style={{ flex: 1 }}>
                <Text bold>{mem.author?.display_name || 'مستخدم'}</Text>
                <Text variant="caption" muted>
                  {mem.room_name} · {fullDate(mem.created_at)}
                </Text>
              </View>
              <Pressable onPress={like} hitSlop={8} style={{ alignItems: 'center', minWidth: 48, minHeight: 48, justifyContent: 'center' }}>
                <Icon name="heart" size={24} color={mem.liked ? C.danger : C.textMuted} filled={mem.liked} />
                <Text variant="caption" muted>{mem.like_count}</Text>
              </Pressable>
              {canDeleteMemory ? <Pressable onPress={removeMemory} hitSlop={8} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={20} color={C.danger} /></Pressable> : null}
            </View>

            <Text variant="heading">{mem.title}</Text>
            {mem.description ? <Text>{mem.description}</Text> : <Text muted>لا توجد تفاصيل لهذه الذكرى.</Text>}

            <View style={{ height: 1, backgroundColor: C.border, marginVertical: 4 }} />
            <Text bold>التعليقات ({mem.comment_count})</Text>

            {mem.comments.length === 0 ? <Text muted>كن أول من يعلّق على هذه الذكرى.</Text> : null}
            {mem.comments.map((c) => (
              <View key={c.id} style={{ flexDirection: 'row', gap: 10 }}>
                {c.author ? (
                  <Avatar id={c.author.avatar_id} size={34} />
                ) : (
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="eye" size={17} color={C.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 12, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text bold variant="caption" style={{ flex: 1 }}>
                      {c.author ? c.author.display_name : 'مجهول'}
                      {c.is_mine && c.is_anonymous ? ' (أنت)' : ''}
                    </Text>
                    <Text variant="caption" muted>
                      {timeAgo(c.created_at)}
                    </Text>
                  </View>
                  <Text>{c.body}</Text>
                  {c.is_mine || mem.my_role === 'owner' || mem.my_role === 'moderator' ? (
                    <Pressable onPress={() => removeComment(c)} hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' }}>
                      <Text variant="caption" color={C.danger} bold>
                        حذف
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ padding: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: C.border, gap: 8 }}>
            {mem.allow_anonymous ? (
              <Pressable onPress={() => setAnon(!anon)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    borderWidth: 1.5,
                    borderColor: anon ? C.primary : C.border,
                    backgroundColor: anon ? C.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {anon ? <Icon name="check" size={14} color={C.onPrimary} strokeWidth={2.8} /> : null}
                </View>
                <Text variant="caption">تعليق مجهول</Text>
              </Pressable>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="اكتب تعليقاً…"
                placeholderTextColor={C.textMuted}
                maxLength={LIMITS.maxComment}
                multiline
                style={{
                  flex: 1,
                  minHeight: 48,
                  maxHeight: 110,
                  borderRadius: 16,
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor: C.border,
                  color: C.text,
                  fontFamily: FONTS.regular,
                  fontSize: 15,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  textAlign: 'right',
                  writingDirection: 'rtl',
                }}
              />
              <Pressable
                onPress={send}
                disabled={sending || !text.trim()}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: C.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: sending || !text.trim() ? 0.45 : 1,
                }}
              >
                <Icon name="check" size={22} color={C.onPrimary} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
