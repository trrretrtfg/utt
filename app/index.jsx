import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

// نقطة الدخول: الحارس في _layout يحوّل غير المسجّلين إلى شاشة الدخول
export default function Index() {
  const signedIn = useAuthStore((s) => !!(s.user || s.token));
  return <Redirect href={signedIn ? '/(tabs)/home' : '/login'} />;
}
