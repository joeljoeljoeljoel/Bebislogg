// Backup files in the browser: export via the share sheet or a download, and reading one back.
import type { LogEvent, Settings } from '../domain/types';
import type { AppData } from '../state/store';
import { backupFileName, makeBackup, parseBackup } from './backup';

/**
 * Hands the backup to the share sheet (iPhone: "Spara i Filer"), or downloads
 * it where files cannot be shared. Chrome does not share JSON, so Android
 * downloads. Returns false if the user cancelled.
 */
export async function exportBackup(events: LogEvent[], settings: Settings, now: number): Promise<boolean> {
  const json = JSON.stringify(makeBackup(events, settings, now), null, 2);
  const name = backupFileName(now);
  const file = new File([json], name, { type: 'application/json' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Bebislogg' });
      return true;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return false;
      // Sharing failed for another reason: download instead.
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}

/** The data in a backup file, or null if it is not a Bebislogg backup. */
export async function readBackup(file: File, now: number): Promise<AppData | null> {
  try {
    return parseBackup(await file.text(), now);
  } catch {
    return null;
  }
}
