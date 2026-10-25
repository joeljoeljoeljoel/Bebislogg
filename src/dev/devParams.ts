// Development-only URL switches, left out of production builds:
//   ?demo        replace all data with 24 days of generated data
//   ?demo=7      7 days (0 = empty, which shows the intro)
//   ?time=03:10  pretend the clock shows 03:10 (stays in the URL)
import { defaultSettings } from '../domain/settings';
import { atTime, parseHM } from '../domain/time';
import { replaceAll } from '../db/db';
import { clockNow, setClockOffset } from '../state/clock';
import { mirrorThemeSettings } from '../theme/theme';
import { demoEvents, demoSettings } from './demo';

export async function applyDevParams() {
  const url = new URL(location.href);
  const time = url.searchParams.get('time');
  if (time && /^\d{1,2}:\d{2}$/.test(time)) {
    const real = Date.now();
    setClockOffset(atTime(real, parseHM(time)) - real);
  }

  const demo = url.searchParams.get('demo');
  if (demo === null) return;
  const days = demo === '' ? 24 : Math.max(0, Number(demo) || 0);
  const now = clockNow();
  const settings = days ? demoSettings(now) : defaultSettings(now);
  await replaceAll(demoEvents(now, days, settings), settings);
  mirrorThemeSettings(settings);
  url.searchParams.delete('demo');
  history.replaceState(null, '', url);
}
