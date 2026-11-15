import React, { useCallback, useState } from 'react';
import { ScrollView, View, Pressable, Alert, useWindowDimensions, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Button from '../../src/components/Button';
import Icon from '../../src/components/Icon';
import Avatar from '../../src/components/Avatar';
import PhotoGrid from '../../src/components/PhotoGrid';
import EmptyState, { Loading, ErrorState } from '../../src/components/EmptyState';
import { showToast } from '../../src/components/Toast';
import { useColors } from '../../src/store/themeStore';
import { useMediaStore } from '../../src/store/mediaStore';
import { useAuthStore } from '../../src/store/authStore';
import * as api from '../../src/lib/api';
import { RADIUS, SPACING } from '../../src/constants/config';

const ROLE = { owner: 'مالك', moderator: 'مشرف', member: 'عضو' };

export default function RoomScreen() {
  const C = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const me = useAuthStore((s) => s.user);
  const ensure = useMediaStore((s) => s.ensure);
  const [info, setInfo] = useState(null);
  const [memories, setMemories] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('photos');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [r, m] = await Promise.all([api.getRoom(id), api.listMemories({ roomId: id, limit: 60 })]);
      setInfo(r);
      setMemories(m);
      ensure(m.flatMap((x) => (x.media || []).slice(0, 1).map((media) => media.id)), 'thumb').catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const act = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) showToast(okMsg, 'success');
      await load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const confirm = (title, msg, onYes) =>
    Alert.alert(title, msg, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', style: 'destructive', onPress: onYes },
    ]);

  if (!info && !error) return <Screen title="الغرفة" back><Loading /></Screen>;
  if (!info) return <Screen title="الغرفة" back><ErrorState message={error} onRetry={load} /></Screen>;

  const room = info.room;
  const isManager = room.my_role === 'owner' || room.my_role === 'moderator';
  const isOwner = room.my_role === 'owner';

  const tabs = [
    { key: 'photos', label: 'الذكريات' },
    { key: 'members', label: `الأعضاء (${info.members.length})` },
    ...(isManager ? [{ key: 'manage', label: info.requests.length ? `الإدارة (${info.requests.length})` : 'الإدارة' }] : []),
  ];

  return (
    <Screen
      title={room.name}
      back
      right={
        <Pressable
          onPress={() => router.push(`/memory/new?roomId=${room.id}`)}
          style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="plus" size={24} color={C.onPrimary} strokeWidth={2.4} />
        </Pressable>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        {tabs.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              minHeight: 44,
              paddingHorizontal: 14,
              borderRadius: 22,
              justifyContent: 'center',
              backgroundColor: tab === t.key ? C.primary : C.surfaceAlt,
            }}
          >
            <Text bold variant="caption" color={tab === t.key ? C.onPrimary : C.text}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28, gap: 12, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        {tab === 'photos' ? (
          memories.length === 0 ? (
            <EmptyState
              icon="camera"
              title="الغرفة فارغة"
              hint={room.description || 'أضف أول ذكرى لهذه الغرفة.'}
              actionTitle="إضافة ذكرى"
              onAction={() => router.push(`/memory/new?roomId=${room.id}`)}
            />
          ) : (
            <PhotoGrid memories={memories} width={width - SPACING * 2} onPress={(m) => router.push(`/viewer?id=${m.id}`)} />
          )
        ) : null}

        {tab === 'members'
          ? info.members.map((m) => (
              <View
                key={m.user_id}
                style={{
                  backgroundColor: C.surface,
                  borderRadius: RADIUS.card,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <Avatar id={m.avatar_id} size={42} />
                <View style={{ flex: 1 }}>
                  <Text bold numberOfLines={1}>
                    {m.display_name}
                  </Text>
                  <Text variant="caption" muted>
                    {ROLE[m.role]}
                  </Text>
                </View>
                {isManager && m.role !== 'owner' && m.user_id !== me?.id && (isOwner || m.role === 'member') ? (
                  <Button
                    title="إزالة"
                    variant="secondary"
                    onPress={() =>
                      confirm('إزالة عضو', `إزالة ${m.display_name} من الغرفة؟`, () =>
                        act(() => api.removeMember(room.id, m.user_id), 'تمت الإزالة'),
                      )
                    }
                  />
                ) : null}
              </View>
            ))
          : null}

        {tab === 'manage' && isManager ? (
          <View style={{ gap: 12 }}>
            <Text bold muted>
              طلبات الانضمام
            </Text>
            {info.requests.length === 0 ? (
              <Text muted>لا توجد طلبات معلّقة.</Text>
            ) : (
              info.requests.map((q) => (
                <View
                  key={q.id}
                  style={{
                    backgroundColor: C.surface,
                    borderRadius: RADIUS.card,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Avatar id={q.avatar_id} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text bold>{q.display_name}</Text>
                      <Text variant="caption" muted style={{ writingDirection: 'ltr' }}>
                        @{q.username}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button title="قبول" onPress={() => act(() => api.reviewRequest(q.id, 'approved'), 'تم قبول العضو')} style={{ flex: 1 }} />
                    <Button title="رفض" variant="secondary" onPress={() => act(() => api.reviewRequest(q.id, 'rejected'), 'تم الرفض')} style={{ flex: 1 }} />
                  </View>
                </View>
              ))
            )}

            <Text bold muted style={{ marginTop: 8 }}>
              رمز الدعوة
            </Text>
            <Text variant="caption" muted>يُعرض رمز الدعوة مرة واحدة عند إنشاء الغرفة. احتفظ به في مكان آمن لمشاركته مع الآخرين.</Text>
          </View>
        ) : null}

      </ScrollView>
    </Screen>
  );
}
