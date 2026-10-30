import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { LogEvent, Side, Sleep } from '../domain/types';
import { type SleepWarning, checkSleep } from '../domain/sleepCheck';
import * as act from './actions';
import type { ActionResult, TimeField, Undo } from './actions';
import { type Draft, draftEvent, editDraft } from './draft';
import { clockNow, refreshNow } from './clock';
import { type AppData, useStore } from './store';

export type Sheet = { kind: 'draft'; draft: Draft } | { kind: 'settings' } | { kind: 'bvc' };
export type UndoMode = 'base' | 'time' | 'ml';

const UNDO_MS = 6000;

interface UI {
  undo: Undo | null;
  undoMode: UndoMode;
  sheet: Sheet | null;

  toggleSleep: (at?: number) => void;
  logFeed: (side: Side, at?: number) => void;
  logBottle: (ml: number, at?: number) => void;
  logVitd: () => void;

  undoAll: () => void;
  setUndoMode: (mode: UndoMode) => void;
  shiftUndo: (minutes: number) => void;
  switchSide: () => void;
  changeMl: (delta: number) => void;
  undoWake: () => void;
  /** "Mer": open the sheet for the time that was logged */
  undoMore: () => void;

  openSheet: (sheet: Sheet) => void;
  openEdit: (id: string, field?: TimeField) => void;
  closeSheet: () => void;
  /** Saves the sheet. Returns a warning for the sheet to show instead, if any. */
  saveDraft: (draft: Draft, force?: boolean) => SleepWarning | null;
  deleteEvent: (id: string) => void;
  /** Replace all data (restore from file), with undo */
  restoreAll: (data: AppData, msg: string) => void;
}

const UIContext = createContext<UI | null>(null);

const SHEET_STATE = 'bebislogg-sheet';

/** A light tap on Android; iPhone does not vibrate for web apps. */
const haptic = () => navigator.vibrate?.(10);

export function UIProvider({ children }: { children: ReactNode }) {
  const { events, settings, setEvents, restore } = useStore();
  const [undo, setUndo] = useState<Undo | null>(null);
  const [undoMode, setUndoModeState] = useState<UndoMode>('base');
  const [sheet, setSheet] = useState<Sheet | null>(null);

  // Handlers read the latest state through refs, so they stay stable.
  const latest = useRef({ events, settings, undo, sheet });
  useLayoutEffect(() => {
    latest.current = { events, settings, undo, sheet };
  });

  const timer = useRef(0);
  const armUndo = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setUndo(null);
      setUndoModeState('base');
    }, UNDO_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const showUndo = useCallback(
    (u: Undo) => {
      setUndo(u);
      setUndoModeState('base');
      armUndo();
    },
    [armUndo],
  );

  const apply = useCallback(
    (r: ActionResult) => {
      setEvents(r.events);
      showUndo(r.undo);
      refreshNow();
      haptic();
    },
    [setEvents, showUndo],
  );

  /** Updates events while the undo bar stays (and restarts its timer). */
  const edit = useCallback(
    (fn: (events: LogEvent[], undo: Undo) => LogEvent[]) => {
      const u = latest.current.undo;
      if (!u) return;
      setEvents(fn(latest.current.events, u));
      armUndo();
    },
    [setEvents, armUndo],
  );

  // Sheets push a history entry so Android's back gesture closes them.
  useEffect(() => {
    const onPop = () => setSheet(null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openSheet = useCallback((s: Sheet) => {
    if (!latest.current.sheet && history.state !== SHEET_STATE) history.pushState(SHEET_STATE, '');
    latest.current.sheet = s;
    setSheet(s);
  }, []);

  const closeSheet = useCallback(() => {
    latest.current.sheet = null;
    if (history.state === SHEET_STATE) history.back();
    else setSheet(null);
  }, []);

  const openEdit = useCallback(
    (id: string, field?: TimeField) => {
      const e = latest.current.events.find((x) => x.id === id);
      if (e) openSheet({ kind: 'draft', draft: editDraft(e, field) });
    },
    [openSheet],
  );

  const value = useMemo<UI>(() => {
    const ev = () => latest.current.events;
    return {
      undo,
      undoMode,
      sheet,

      toggleSleep: (at = clockNow()) => apply(act.toggleSleep(ev(), at, act.newId())),
      logFeed: (side, at = clockNow()) => apply(act.logFeed(ev(), side, at, act.newId())),
      logBottle: (ml, at = clockNow()) => apply(act.logBottle(ev(), ml, at, act.newId())),
      logVitd: () => apply(act.logVitd(ev(), clockNow(), act.newId())),

      undoAll: () => {
        const u = latest.current.undo;
        if (!u) return;
        window.clearTimeout(timer.current);
        if (u.prevSettings) restore({ events: u.prev, settings: u.prevSettings });
        else setEvents(u.prev);
        setUndo(null);
        refreshNow();
      },
      setUndoMode: (mode) => {
        setUndoModeState(mode);
        armUndo();
      },
      shiftUndo: (minutes) => edit((events, u) => act.shiftTargets(events, u, minutes)),
      switchSide: () => edit(act.switchSide),
      changeMl: (delta) => edit((events, u) => act.changeMl(events, u, delta)),
      undoWake: () => {
        const u = latest.current.undo;
        if (!u) return;
        const r = act.undoWake(ev(), u);
        setEvents(r.events);
        setUndo(r.undo);
        armUndo();
      },
      undoMore: () => {
        const tg = latest.current.undo?.targets.at(-1);
        window.clearTimeout(timer.current);
        setUndo(null);
        if (tg) openEdit(tg.id, tg.field);
      },

      openSheet,
      openEdit,
      closeSheet,
      saveDraft: (d, force = false) => {
        const events = ev();
        if (d.kind === 'quick') {
          closeSheet();
          if (d.type === 'sleep') apply(act.toggleSleep(events, d.quickWake ? d.end! : d.start, act.newId()));
          else if (d.type === 'feed') apply(act.logFeed(events, d.side, d.t, act.newId()));
          else if (d.type === 'bottle') apply(act.logBottle(events, d.ml, d.t, act.newId()));
          return null;
        }
        if (d.type === 'sleep') {
          const sleeps = events.filter((e): e is Sleep => e.type === 'sleep');
          const warning = checkSleep({ id: d.id, start: d.start, end: d.end }, sleeps, clockNow());
          if (warning && (warning.kind === 'order' || !force)) return warning;
        }
        const saved = draftEvent(d, d.id ?? act.newId());
        const next = d.kind === 'edit' ? events.map((e) => (e.id === d.id ? saved : e)) : [...events, saved];
        closeSheet();
        setEvents(next);
        showUndo({ prev: events, targets: [], msg: `${d.kind === 'edit' ? 'Ändrat' : 'Tillagt'}: ${act.describeEvent(saved)}` });
        refreshNow();
        return null;
      },
      deleteEvent: (id) => {
        const events = ev();
        const e = events.find((x) => x.id === id);
        if (!e) return;
        if (latest.current.sheet) closeSheet();
        setEvents(events.filter((x) => x.id !== id));
        showUndo({ prev: events, targets: [], msg: `Borttagen: ${act.describeEvent(e)}` });
        refreshNow();
      },
      restoreAll: (data, msg) => {
        const { events, settings } = latest.current;
        restore(data);
        showUndo({ prev: events, prevSettings: settings, targets: [], msg });
      },
    };
  }, [undo, undoMode, sheet, apply, armUndo, edit, setEvents, showUndo, openSheet, openEdit, closeSheet, restore]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UI {
  const ui = useContext(UIContext);
  if (!ui) throw new Error('useUI outside UIProvider');
  return ui;
}
