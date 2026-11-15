import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, View, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Icon from '../../src/components/Icon';
import EmptyState, { Loading, ErrorState } from '../../src/components/EmptyState';
import { useColors } from '../../src/store/themeStore';
import { useDataStore } from '../../src/store/dataStore';
import { listNotifications, markAllRead, markRead } from '../../src/lib/api';
import { timeAgo } from '../../src/lib/format';
import { RADIUS } from '../../src/constants/config';

const ICONS = {
  room_join_request: 'rooms',
  room_join_approved: 'check',
  room_join_rejected: 'close',
  room_member_removed: 'logout',
  memory_comment: 'comment',
};

export default function Notifications() {
  const C = useColors();
  const router = useRouter();
  const setUnread = useDataStore((s) => s.setUnread);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await listNotifications();
      setData(res.items);
      setUnread(res.unread);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const readAll = async () => {
    try {
      await markAllRead();
      setUnread(0);
      setData((d) => d.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch (e) {
      setError(e.message);
    }
  };

  const open = async (n) => {
    if (!n.read_at) {
      markRead(n.id).catch(() => {});
      setData((d) => d.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread(Math.max(0, (useDataStore.getState().unread || 0) - 1));
    }
    if (n.payload?.memory_id) router.push(`/viewer?id=${n.payload.memory_id}`);
    else if (n.room_id && n.type !== 'room_member_removed' && n.type !== 'room_join_rejected') router.push(`/room/${n.room_id}`);
  };

  const hasUnread = data?.some((n) => !n.read_at);
  const right = hasUnread ? (
    <Pressable onPress={readAll} hitSlop={8} style={{ minHeight: 46, justifyContent: 'center' }}>
      <Text bold color={C.primary}>
        قراءة الكل
      </Text>
    </Pressable>
  ) : null;

  let body;
  if (data === null && !error) body = <Loading />;
  else if (error && data === null) body = <ErrorState message={error} onRetry={load} />;
  else if (data.length === 0) {
    body = <EmptyState icon="bell" title="لا توجد إشعارات" hint="ستظهر هنا طلبات الانضمام والتعليقات على ذكرياتك." />;
  } else {
    body = (
      <FlatList
        data={data}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 24 }}
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
        renderItem={({ item: n }) => (
          <Pressable
            onPress={() => open(n)}
            style={{
              backgroundColor: n.read_at ? C.surface : C.surfaceAlt,
              borderRadius: RADIUS.card,
              borderWidth: 1,
              borderColor: n.read_at ? C.border : C.primary,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: C.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={ICONS[n.type] || 'bell'} size={20} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text bold={!n.read_at}>{n.payload?.text || 'إشعار جديد'}</Text>
              <Text variant="caption" muted>
                {timeAgo(n.created_at)}
              </Text>
            </View>
          </Pressable>
        )}
      />
    );
  }

  return (
    <Screen title="الإشعارات" right={right} tabs>
      {body}
    </Screen>
  );
}
