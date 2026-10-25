import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { LogEvent, Settings } from '../domain/types';

// Events are stored one record per event, so a tap writes a single record.
interface Schema extends DBSchema {
  events: { key: string; value: LogEvent };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'bebislogg';
const SETTINGS_KEY = 'settings';

let connection: Promise<IDBPDatabase<Schema>> | null = null;

function db() {
  connection ??= openDB<Schema>(DB_NAME, 1, {
    upgrade(d) {
      d.createObjectStore('events', { keyPath: 'id' });
      d.createObjectStore('meta');
    },
  });
  return connection;
}

/** Raw stored data; validate before use. */
export async function loadData(): Promise<{ events: unknown[]; settings: unknown }> {
  const d = await db();
  const [events, settings] = await Promise.all([d.getAll('events'), d.get('meta', SETTINGS_KEY)]);
  return { events, settings: settings ?? null };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await (await db()).put('meta', settings, SETTINGS_KEY);
}

/** Writes only what changed between two versions of the event list (compared by identity). */
export async function syncEvents(prev: LogEvent[], next: LogEvent[]): Promise<void> {
  const before = new Map(prev.map((e) => [e.id, e]));
  const nextIds = new Set(next.map((e) => e.id));
  const tx = (await db()).transaction('events', 'readwrite');
  for (const e of next) if (before.get(e.id) !== e) void tx.store.put(e);
  for (const e of prev) if (!nextIds.has(e.id)) void tx.store.delete(e.id);
  await tx.done;
}

/** Replaces everything stored. */
export async function replaceAll(events: LogEvent[], settings: Settings): Promise<void> {
  const tx = (await db()).transaction(['events', 'meta'], 'readwrite');
  const store = tx.objectStore('events');
  void store.clear();
  for (const e of events) void store.put(e);
  void tx.objectStore('meta').put(settings, SETTINGS_KEY);
  await tx.done;
}
