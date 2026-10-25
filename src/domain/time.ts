export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const WEEKDAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
export const WEEKDAYS_LONG = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
export const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export const pad = (n: number) => String(n).padStart(2, '0');

/** Clock time, "14:05". */
export function hm(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Duration rounded to whole minutes: "1 h 05 min" or "45 min". */
export function dur(ms: number): string {
  const m = Math.max(0, Math.round(ms / MIN));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${pad(m % 60)} min` : `${m} min`;
}

/** Compact duration for tables: "1:05". */
export function hmm(ms: number): string {
  const m = Math.max(0, Math.round(ms / MIN));
  return `${Math.floor(m / 60)}:${pad(m % 60)}`;
}

export const round5 = (ms: number) => Math.round(ms / (5 * MIN)) * 5 * MIN;

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function average(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Length of the overlap between [a0, a1) and [b0, b1). */
export const overlap = (a0: number, a1: number, b0: number, b1: number) =>
  Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/** "HH:MM" → minutes after midnight. */
export function parseHM(s: string): number {
  const [h = 0, m = 0] = s.split(':').map(Number);
  return h * 60 + m;
}

/** Local date as "YYYY-MM-DD". */
export function dateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" → local midnight. */
export function parseDate(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** "22 okt" */
export function shortDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Local midnight of the calendar day containing ts. */
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Same wall-clock time n calendar days away. A day is 23 or 25 h around DST. */
export function addDays(ts: number, n: number): number {
  const d = new Date(ts);
  d.setDate(d.getDate() + n);
  return d.getTime();
}

/** Wall-clock time (minutes after midnight) on the calendar day of ts. */
export function atTime(ts: number, minutes: number): number {
  const d = new Date(ts);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.getTime();
}

/** Whole calendar days from a to b, positive when b is later. */
export function calendarDaysBetween(a: number, b: number): number {
  const A = new Date(a);
  const B = new Date(b);
  const ua = Date.UTC(A.getFullYear(), A.getMonth(), A.getDate());
  const ub = Date.UTC(B.getFullYear(), B.getMonth(), B.getDate());
  return Math.round((ub - ua) / DAY);
}

/** Calendar label: "Idag", "Igår", "Imorgon" or "tor 22 okt". */
export function calLabel(ts: number, now: number): string {
  const diff = calendarDaysBetween(ts, now);
  if (diff === 0) return 'Idag';
  if (diff === 1) return 'Igår';
  if (diff === -1) return 'Imorgon';
  return `${WEEKDAYS[new Date(ts).getDay()]} ${shortDate(ts)}`;
}

/** "6 veckor och 2 dagar", "1 vecka", "3 dagar". Empty before birth. */
export function ageText(birth: string, now: number): string {
  if (!birth) return '';
  const days = calendarDaysBetween(parseDate(birth), now);
  if (days < 0) return '';
  const w = Math.floor(days / 7);
  const d = days % 7;
  const dayPart = `${d} ${d === 1 ? 'dag' : 'dagar'}`;
  if (!w) return dayPart;
  const weekPart = `${w} ${w === 1 ? 'vecka' : 'veckor'}`;
  return d ? `${weekPart} och ${dayPart}` : weekPart;
}
