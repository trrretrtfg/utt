import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import RemoteImage from './RemoteImage';

const GAP = 4;

// شبكة صور متوازنة تحافظ على نسب الصور، بلا بطاقات أو نصوص فوق الصور.
function buildRows(items, width, target) {
  const rows = [];
  const photos = (items || []).filter((item) => item?.media?.length);
  let current = [];
  let ratioSum = 0;

  photos.forEach((memory) => {
    const cover = memory.media[0];
    const ratio = cover?.width && cover?.height ? cover.width / cover.height : 1;
    const safeRatio = Math.min(Math.max(ratio, 0.6), 2.2);
    current.push({ memory, ratio: safeRatio });
    ratioSum += safeRatio;

    const rowHeight = (width - GAP * (current.length - 1)) / ratioSum;
    if (rowHeight <= target) {
      rows.push({ items: current, height: rowHeight });
      current = [];
      ratioSum = 0;
    }
  });

  if (current.length) {
    rows.push({
      items: current,
      height: Math.min(target, (width - GAP * (current.length - 1)) / ratioSum),
    });
  }
  return rows;
}

export default function PhotoGrid({ memories, width, onPress, target = 150 }) {
  const rows = useMemo(() => buildRows(memories, width, target), [memories, width, target]);
  return (
    <View style={{ gap: GAP }}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', gap: GAP }}>
          {row.items.map(({ memory, ratio }) => (
            <Pressable
              key={memory.id}
              onPress={() => onPress(memory)}
              style={{ width: row.height * ratio, height: row.height }}
            >
              <RemoteImage
                id={memory.media[0].id}
                style={{ width: '100%', height: '100%', borderRadius: 4 }}
              />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
