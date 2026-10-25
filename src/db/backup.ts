import type { LogEvent, Settings } from '../domain/types';
import { defaultSettings } from '../domain/settings';
import { dateStr } from '../domain/time';
import { toEvents, toSettings } from './validate';

export interface Backup {
  app: 'bebislogg';
  version: 1;
  exportedAt: string;
  settings: Settings;
  events: LogEvent[];
}

export function makeBackup(events: LogEvent[], settings: Settings, now: number): Backup {
  return { app: 'bebislogg', version: 1, exportedAt: new Date(now).toISOString(), settings, events };
}

export const backupFileName = (now: number) => `bebislogg-${dateStr(now)}.json`;

/**
 * Reads a backup file. Returns null if it is not a Bebislogg backup. The app
 * counts as set up after a restore, and the file itself counts as the latest
 * backup.
 */
export function parseBackup(text: string, now: number): { events: LogEvent[]; settings: Settings } | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;
  if (d.app !== 'bebislogg' || !Array.isArray(d.events)) return null;

  const settings = toSettings(d.settings, { ...defaultSettings(now), name: 'Bebis' });
  const exportedAt = typeof d.exportedAt === 'string' ? Date.parse(d.exportedAt) : NaN;
  const lastBackup = Math.max(settings.lastBackup ?? 0, Number.isFinite(exportedAt) ? exportedAt : 0) || null;
  return {
    events: toEvents(d.events),
    settings: { ...settings, setupDone: true, lastBackup },
  };
}
