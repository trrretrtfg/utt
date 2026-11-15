const MIN = 60 * 1000;

export function timeAgo(iso) {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  if (diff < MIN) return 'الآن';
  if (diff < 60 * MIN) return `قبل ${Math.floor(diff / MIN)} د`;
  if (diff < 24 * 60 * MIN) return `قبل ${Math.floor(diff / (60 * MIN))} س`;
  if (diff < 7 * 24 * 60 * MIN) return `قبل ${Math.floor(diff / (24 * 60 * MIN))} يوم`;
  return new Date(iso).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fullDate(iso) {
  return new Date(iso).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function plural(n, one, two, few, many) {
  if (n === 0) return `لا ${many}`;
  if (n === 1) return `${one}`;
  if (n === 2) return `${two}`;
  if (n <= 10) return `${n} ${few}`;
  return `${n} ${many}`;
}
