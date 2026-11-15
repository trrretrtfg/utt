import React, { useCallback, useState } from 'react';
import { ScrollView, View, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Button from '../../src/components/Button';
import Icon from '../../src/components/Icon';
import EmptyState, { Loading, ErrorState } from '../../src/components/EmptyState';
import { showToast } from '../../src/components/Toast';
import { useColors } from '../../src/store/themeStore';
import { listMyRooms, listMyRequests, cancelRequest } from '../../src/lib/api';
import { RADIUS } from '../../src/constants/config';

const ROLE = { owner: 'مالك', moderator: 'مشرف', member: 'عضو' };
const STATUS = { pending: 'قيد المراجعة', approved: 'تم القبول', rejected: 'مرفوض', cancelled: 'ملغي' };

export default function Rooms() {
  const C = useColors();
  const router = useRouter();
  const [rooms, setRooms] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [r, q] = await Promise.all([listMyRooms(), listMyRequests()]);
      setRooms(r);
      setRequests(q.filter((x) => x.status === 'pending' || x.status === 'rejected').slice(0, 8));
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const cancel = async (id) => {
    try {
      await cancelRequest(id);
      showToast('تم إلغاء الطلب', 'success');
      load();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const header = (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable
        onPress={() => router.push('/join')}
        style={{ height: 46, paddingHorizontal: 14, borderRadius: 23, backgroundColor: C.surfaceAlt, flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <Icon name="key" size={18} color={C.text} />
        <Text bold>انضمام</Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/room/new')}
        style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="plus" size={24} color={C.onPrimary} strokeWidth={2.4} />
      </Pressable>
    </View>
  );

  let body;
  if (rooms === null && !error) body = <Loading />;
  else if (error && rooms === null) body = <ErrorState message={error} onRetry={load} />;
  else
    body = (
      <ScrollView
        contentContainerStyle={{ gap: 12, paddingBottom: 24, flexGrow: 1 }}
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
        {requests.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text bold muted>
              طلبات الانضمام
            </Text>
            {requests.map((q) => (
              <View
                key={q.id}
                style={{
                  backgroundColor: C.surface,
                  borderRadius: RADIUS.card,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text bold numberOfLines={1}>
                    {q.room_name}
                  </Text>
                  <Text variant="caption" color={q.status === 'rejected' ? C.danger : C.textMuted}>
                    {STATUS[q.status]}
                  </Text>
                </View>
                {q.status === 'pending' ? <Button title="إلغاء" variant="secondary" onPress={() => cancel(q.id)} style={{ minHeight: 48 }} /> : null}
              </View>
            ))}
          </View>
        ) : null}

        {rooms.length === 0 ? (
          <EmptyState
            icon="rooms"
            title="لا توجد غرف بعد"
            hint="أنشئ غرفة جديدة وشارك رمز الدعوة، أو انضم إلى غرفة برمز من صديق."
            actionTitle="إنشاء غرفة"
            onAction={() => router.push('/room/new')}
          />
        ) : (
          rooms.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/room/${r.id}`)}
              style={({ pressed }) => ({
                backgroundColor: C.surface,
                borderRadius: RADIUS.card,
                borderWidth: 1,
                borderColor: C.border,
                padding: 16,
                gap: 6,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
                  {r.name}
                </Text>
                {r.pending_count > 0 ? (
                  <View style={{ backgroundColor: C.danger, borderRadius: 12, paddingHorizontal: 10 }}>
                    <Text variant="caption" bold color={C.white}>
                      {r.pending_count} طلب
                    </Text>
                  </View>
                ) : null}
              </View>
              {r.description ? (
                <Text muted numberOfLines={2}>
                  {r.description}
                </Text>
              ) : null}
              <Text variant="caption" muted>
                {ROLE[r.my_role]} · {r.member_count} عضو
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    );

  return (
    <Screen title="الغرف" right={header} tabs>
      {body}
    </Screen>
  );
}
