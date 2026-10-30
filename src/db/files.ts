// Files in the browser: hand one to the share sheet or download it, and read a backup back.
import type { LogEvent, Settings } from '../domain/types';
import type { AppData } from '../state/store';
import { backupFileName, makeBackup, parseBackup } from './backup';

/**
 * Hands the file to the share sheet (iPhone: "Spara i Filer", Bilder, Meddelanden …),
 * or downloads it where that type cannot be shared. Chrome does not share JSON,
 * so on Android a backup downloads. Returns false if the user cancelled.
 */
export async function shareOrDownload(file: File, title: string): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return true;
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return false;
      // Sharing failed for another reason: download instead.
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  return true;
}

export function exportBackup(events: LogEvent[], settings: Settings, now: number): Promise<boolean> {
  const json = JSON.stringify(makeBackup(events, settings, now), null, 2);
  return shareOrDownload(new File([json], backupFileName(now), { type: 'application/json' }), 'Bebislogg');
}

/** The data in a backup file, or null if it is not a Bebislogg backup. */
export async function readBackup(file: File, now: number): Promise<AppData | null> {
  try {
    return parseBackup(await file.text(), now);
  } catch {
    return null;
  }
}
