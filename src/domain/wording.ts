import type { FeedMode, Side } from './types';

export interface Words {
  /** amning / flaska / matning */
  one: string;
  /** amningar / flaskor / matningar */
  many: string;
  /** Week table column: Amn. / Fl. / Mat. */
  tableHead: string;
  /** Kicker of the evening-feeding insight */
  eveningKicker: string;
}

export function words(mode: FeedMode): Words {
  switch (mode) {
    case 'Amning':
      return { one: 'amning', many: 'amningar', tableHead: 'Amn.', eveningKicker: 'Tätamning' };
    case 'Flaska':
      return { one: 'flaska', many: 'flaskor', tableHead: 'Fl.', eveningKicker: 'Kvällsmatning' };
    case 'Båda':
      return { one: 'matning', many: 'matningar', tableHead: 'Mat.', eveningKicker: 'Kvällsmatning' };
  }
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const sideName = (s: Side) => (s === 'V' ? 'vänster' : 'höger');

/** Hint in the status card before anything is logged. */
export function emptyHint(mode: FeedMode): string {
  switch (mode) {
    case 'Amning':
      return 'Tryck Somnade nu eller välj ett bröst för att börja.';
    case 'Flaska':
      return 'Tryck Somnade nu eller Flaska för att börja.';
    case 'Båda':
      return 'Tryck Somnade nu, välj ett bröst eller Flaska för att börja.';
  }
}
