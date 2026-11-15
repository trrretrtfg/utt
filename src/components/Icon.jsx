import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const P = {
  heart: 'M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5.5 6.2 5.5c2 0 3.4 1.1 5.8 3.5 2.4-2.4 3.8-3.5 5.8-3.5 3.2 0 5 3.1 3.7 6.3C19.5 16.4 12 21 12 21z',
  comment: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M9 6l6 6-6 6',
  chevron: 'M15 6l-6 6 6 6',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  rooms: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.3M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  bell: 'M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9zM10 20a2 2 0 0 0 4 0',
  user: 'M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  camera: 'M4 8h3l1.5-2h7L17 8h3v11H4V8zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  image: 'M4 5h16v14H4V5zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  copy: 'M9 9h11v11H9V9zM5 15V4h11',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  leaf: 'M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c2-5 5-8 9-10',
  flower: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 9V3M12 15v6M9 12H3M21 12h-6M9.9 9.9L5.6 5.6M18.4 18.4l-4.3-4.3M9.9 14.1l-4.3 4.3M18.4 5.6l-4.3 4.3',
  cloud: 'M7 18a4 4 0 0 1-.6-7.96A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9H7z',
  coffee: 'M4 9h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9zM17 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3',
  mountain: 'M3 19l6-10 4 6 2-3 6 7H3z',
  music: 'M9 18V6l10-2v12M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  lock: 'M6 11h12v9H6v-9zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  key: 'M14 10a4 4 0 1 1-1.2-2.8L21 15v3h-3v-2h-2v-2h-2l-1.4-1.4',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  refresh: 'M20 11a8 8 0 0 0-14.5-3M4 5v4h4M4 13a8 8 0 0 0 14.5 3M20 19v-4h-4',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
};

export default function Icon({ name, size = 22, color, filled = false, strokeWidth = 1.8 }) {
  const d = P[name] || P.info;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
