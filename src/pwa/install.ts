// Chrome's install prompt ("Installera Bebislogg" on Android).
import { useSyncExternalStore } from 'react';
import { type Platform, detectPlatform, isStandalone } from '../platform';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let snapshot = { canPrompt: false, installed: false };
const listeners = new Set<() => void>();

function update(patch: Partial<typeof snapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((l) => l());
}

/** Call before the app renders, so the event is not missed. */
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    update({ canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    update({ canPrompt: false, installed: true });
  });
}

export async function promptInstall() {
  const e = deferred;
  if (!e) return;
  deferred = null;
  update({ canPrompt: false });
  await e.prompt();
  if ((await e.userChoice).outcome === 'accepted') update({ installed: true });
}

export function useInstallState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
  );
}

let guideOverride: Platform | 'off' | null = null;

/** Development only: show (or hide) a guide regardless of device. */
export function setGuideOverride(value: Platform | 'off' | null) {
  guideOverride = value;
}

/**
 * Which install guide to show instead of the app. A browser tab on a phone
 * has separate storage from the installed app, so logging there would be
 * lost; on a computer the app is shown directly.
 */
export function installGuide(): 'ios' | 'android' | null {
  if (guideOverride === 'off') return null;
  if (guideOverride === 'ios' || guideOverride === 'android') return guideOverride;
  if (isStandalone()) return null;
  const p = detectPlatform();
  return p === 'desktop' ? null : p;
}
