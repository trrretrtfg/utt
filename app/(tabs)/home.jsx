import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, View, Pressable, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Screen from '../../src/components/Screen';
import Text from '../../src/components/Text';
import Icon from '../../src/components/Icon';
import PhotoGrid from '../../src/components/PhotoGrid';
import EmptyState, { Loading, ErrorState } from '../../src/components/EmptyState';
import { useColors } from '../../src/store/themeStore';
import { useMediaStore } from '../../src/store/mediaStore';
import { listMemories, listMyRooms } from '../../src/lib/api';
import { SPACING } from '../../src/constants/config';

export default function Home() {
  const C = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const ensure = useMediaStore((s) => s.ensure);
  const [items, setItems] = useState(null);
  const [hasRooms, setHasRooms] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [mem, rooms] = await Promise.all([listMemories({ limit: 30 }), listMyRooms()]);
      setItems(mem);
      setHasRooms(rooms.length > 0);
      ensure(mem.flatMap((m) => m.media.slice(0, 1).map((x) => x.id)), 'thumb').catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = (m) => router.push(`/viewer?id=${m.id}`);

  const addButton = (
    <Pressable
      onPress={() => router.push('/memory/new')}
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name="plus" color={C.onPrimary} size={24} strokeWidth={2.4} />
    </Pressable>
  );

  let body;
  if (items === null && !error) body = <Loading />;
  else if (error && items === null) body = <ErrorState message={error} onRetry={load} />;
  else if (items.filter((memory) => memory.media?.length).length === 0) {
    body = hasRooms ? (
      <EmptyState
        icon="camera"
        title="لا توجد ذكريات بعد"
        hint="أضف أول ذكرى بصور من لحظة تحبها، وستظهر لأعضاء الغرفة."
        actionTitle="إضافة ذكرى"
        onAction={() => router.push('/memory/new')}
      />
    ) : (
      <EmptyState
        icon="rooms"
        title="ابدأ بغرفة"
        hint="الذكريات تعيش داخل غرف خاصة. أنشئ غرفتك أو انضم برمز دعوة من صديق."
        actionTitle="الذهاب إلى الغرف"
        onAction={() => router.push('/(tabs)/rooms')}
      />
    );
  } else {
    body = (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />}
      >
        <PhotoGrid memories={items.filter((memory) => memory.media?.length)} width={width - SPACING * 2} onPress={open} target={142} />
      </ScrollView>
    );
  }

  return (
    <Screen title="ذِكرى" right={addButton} tabs>
      {body}
    </Screen>
  );
}
