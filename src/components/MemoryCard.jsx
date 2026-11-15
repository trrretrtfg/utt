import React from 'react';
import { View, Pressable } from 'react-native';
import Text from './Text';
import Icon from './Icon';
import Avatar from './Avatar';
import RemoteImage from './RemoteImage';
import { useColors } from '../store/themeStore';
import { RADIUS } from '../constants/config';
import { timeAgo } from '../lib/format';

export default function MemoryCard({ memory, width, onPress }) {
  const C = useColors();
  const cover = memory.media[0];
  const ratio = cover ? Math.min(Math.max(cover.width / cover.height, 0.75), 1.6) : 1.3;
  return (
    <Pressable
      onPress={() => onPress(memory)}
      style={({ pressed }) => ({
        backgroundColor: C.surface,
        borderRadius: RADIUS.card,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: C.border,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}>
        <Avatar id={memory.author.avatar_id} size={36} />
        <View style={{ flex: 1 }}>
          <Text bold numberOfLines={1}>
            {memory.author.display_name}
          </Text>
          <Text variant="caption" muted numberOfLines={1}>
            {memory.room_name} · {timeAgo(memory.created_at)}
          </Text>
        </View>
      </View>
      {cover ? <RemoteImage id={cover.id} style={{ width, height: (width - 2) / ratio }} /> : null}
      {memory.media.length > 1 ? (
        <View
          style={{
            position: 'absolute',
            top: 64,
            left: 12,
            backgroundColor: C.scrim,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 2,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Icon name="image" size={14} color={C.text} />
          <Text variant="caption" bold>
            {memory.media.length}
          </Text>
        </View>
      ) : null}
      <View style={{ padding: 14, gap: 8 }}>
        <Text variant="heading" numberOfLines={2}>
          {memory.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="heart" size={18} color={memory.liked ? C.danger : C.textMuted} filled={memory.liked} />
            <Text variant="caption" muted>
              {memory.like_count}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="comment" size={18} color={C.textMuted} />
            <Text variant="caption" muted>
              {memory.comment_count}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
