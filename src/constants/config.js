// ===== املأ هاتين القيمتين من مشروع Supabase الجديد: Project Settings → API =====
export const SUPABASE_URL = 'https://zmssushpynpsrlkswltf.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_oZWjUnNbz4aCURnHiGperw_aqNzm3wB';
// ================================================================================

export const SESSION_KEY = 'zikra.session.token';
export const THEME_KEY = 'zikra.theme.mode.v2';

// لوحة ألوان ZIKRA: الوضع الفاتح الهادئ هو الافتراضي.
export const COLORS_DARK = {
  bg: '#0E0F13',
  surface: '#17181E',
  surfaceAlt: '#1F2128',
  border: '#2A2C35',
  text: '#F2F0EA',
  textMuted: '#9A9AA5',
  primary: '#C9A96A',
  onPrimary: '#17130A',
  danger: '#E5675B',
  success: '#6BBF8A',
  overlay: 'rgba(0,0,0,0.62)',
  scrim: 'rgba(14,15,19,0.78)',
  white: '#FFFFFF',
  black: '#000000',
};

export const COLORS_LIGHT = {
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F2',
  border: '#EAE9E4',
  text: '#1B1B1F',
  textMuted: '#6C6C76',
  primary: '#8A6A2B',
  onPrimary: '#FFFFFF',
  danger: '#C94A3F',
  success: '#2F8F5B',
  overlay: 'rgba(0,0,0,0.5)',
  scrim: 'rgba(246,244,239,0.82)',
  white: '#FFFFFF',
  black: '#000000',
};

// الاسم المطلوب في الدليل: COLORS (الافتراضي)
export const COLORS = COLORS_LIGHT;

export const FONTS = { regular: 'Cairo_400Regular', bold: 'Cairo_700Bold' };
export const RADIUS = { card: 18, button: 14, pill: 999 };
export const SPACING = 16;

// الأفتارات: لون + رمز
export const AVATARS = [
  { id: 'avatar_01', bg: '#C9A96A', icon: 'heart' },
  { id: 'avatar_02', bg: '#6BBF8A', icon: 'leaf' },
  { id: 'avatar_03', bg: '#6F9BE0', icon: 'moon' },
  { id: 'avatar_04', bg: '#E5675B', icon: 'sun' },
  { id: 'avatar_05', bg: '#A47BD6', icon: 'star' },
  { id: 'avatar_06', bg: '#E0A24E', icon: 'camera' },
  { id: 'avatar_07', bg: '#4DB6B0', icon: 'home' },
  { id: 'avatar_08', bg: '#D879A8', icon: 'flower' },
  { id: 'avatar_09', bg: '#8E9AAF', icon: 'cloud' },
  { id: 'avatar_10', bg: '#B5895C', icon: 'coffee' },
  { id: 'avatar_11', bg: '#7FA650', icon: 'mountain' },
  { id: 'avatar_12', bg: '#5C7BD0', icon: 'music' },
];

export const LIMITS = { maxImages: 10, maxTitle: 100, maxDescription: 2900, maxComment: 1000 };
