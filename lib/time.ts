import type { Lang } from './types';

// Western digits in both languages, to match phone numbers and counts elsewhere on the site.
const locale = (lang: Lang) => (lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB');

/** "منذ 3 ساعات" / "3 hours ago" for the last week, then a plain date. */
export function timeAgo(iso: string, lang: Lang): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const sec = (t - Date.now()) / 1000;
  const abs = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  if (abs < 7 * 86400) return rtf.format(Math.round(sec / 86400), 'day');
  return new Intl.DateTimeFormat(locale(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(t);
}

/** Full date and time, for tooltips. */
export function fullDate(iso: string, lang: Lang): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: 'full', timeStyle: 'short' }).format(t);
}
