import { Moon, Sun } from '@phosphor-icons/react';
import { clockNow } from '../../state/clock';
import { quickDraft } from '../../state/draft';
import { useUI } from '../../state/ui';
import { usePress } from '../../state/usePress';

/** The biggest button: "Somnade nu" while awake, "Vaknade nu" while asleep. */
export function SleepButton({ asleep }: { asleep: boolean }) {
  const ui = useUI();
  const press = usePress(
    () => ui.toggleSleep(),
    () => ui.openSheet({ kind: 'draft', draft: quickDraft('sleep', clockNow(), { asleep, side: 'V', ml: 0 }) }),
  );
  return (
    <button type="button" className="press sleep-btn" data-asleep={asleep} {...press}>
      {asleep ? <Sun size={26} /> : <Moon size={26} />}
      {asleep ? 'Vaknade nu' : 'Somnade nu'}
    </button>
  );
}
