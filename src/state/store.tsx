import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { LogEvent, Settings } from '../domain/types';
import { defaultSettings } from '../domain/settings';
import { loadData, saveSettings, syncEvents } from '../db/db';
import { toEvents, toSettings } from '../db/validate';
import { clockNow } from './clock';

export interface AppData {
  events: LogEvent[];
  settings: Settings;
}

interface Store extends AppData {
  setEvents: (update: LogEvent[] | ((prev: LogEvent[]) => LogEvent[])) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  /** Replace everything, e.g. when restoring a backup. */
  restore: (data: AppData) => void;
}

const StoreContext = createContext<Store | null>(null);

export async function loadInitialData(): Promise<AppData> {
  const fallback = defaultSettings(clockNow());
  try {
    const { events, settings } = await loadData();
    return { events: toEvents(events), settings: toSettings(settings, fallback) };
  } catch (err) {
    console.error('Kunde inte läsa sparad data', err);
    return { events: [], settings: fallback };
  }
}

// Writes run one at a time, in order.
let queue = Promise.resolve();
function persist(task: () => Promise<void>) {
  queue = queue.then(task).catch((err) => console.error('Kunde inte spara', err));
}

/** Holds events and settings, and saves every change to IndexedDB. */
export function StoreProvider({ initial, children }: { initial: AppData; children: ReactNode }) {
  const [events, setEvents] = useState(initial.events);
  const [settings, setSettings] = useState(initial.settings);
  const saved = useRef(initial);

  useEffect(() => {
    const prev = saved.current.events;
    if (prev === events) return;
    saved.current = { ...saved.current, events };
    persist(() => syncEvents(prev, events));
  }, [events]);

  useEffect(() => {
    if (saved.current.settings === settings) return;
    saved.current = { ...saved.current, settings };
    persist(() => saveSettings(settings));
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const restore = useCallback((data: AppData) => {
    setEvents(data.events);
    setSettings(data.settings);
  }, []);

  const value = useMemo(
    () => ({ events, settings, setEvents, updateSettings, restore }),
    [events, settings, updateSettings, restore],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore outside StoreProvider');
  return store;
}
