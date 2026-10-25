import { DropHalfBottom } from '@phosphor-icons/react';
import type { Side } from '../../domain/types';
import type { Model } from '../../domain/model';
import { lastFeedText, nextSide } from '../../domain/status';
import { clockNow } from '../../state/clock';
import { quickDraft } from '../../state/draft';
import { useUI } from '../../state/ui';
import { usePress } from '../../state/usePress';

const DEFAULT_ML = 120;

/** V/H and/or Flaska, depending on the feeding mode. A long press picks the time first. */
export function FeedCard({ m, asleep }: { m: Model; asleep: boolean }) {
  const ui = useUI();
  const next = nextSide(m);
  const ml = m.bottles.at(-1)?.ml ?? DEFAULT_ML;
  const quick = (type: 'feed' | 'bottle', side: Side) =>
    ui.openSheet({ kind: 'draft', draft: quickDraft(type, clockNow(), { asleep, side, ml }) });

  return (
    <section className="feed-card">
      <div className="feed-buttons">
        {m.useBreast &&
          (['V', 'H'] as const).map((side) => (
            <SideButton
              key={side}
              side={side}
              next={next === side}
              onTap={() => ui.logFeed(side)}
              onLong={() => quick('feed', side)}
            />
          ))}
        {m.useBottle && (
          <BottleButton ml={ml} onTap={() => ui.logBottle(ml)} onLong={() => quick('bottle', next ?? 'V')} />
        )}
      </div>
      <span className="feed-last">{lastFeedText(m)}</span>
    </section>
  );
}

interface PressProps {
  onTap: () => void;
  onLong: () => void;
}

function SideButton({ side, next, onTap, onLong }: PressProps & { side: Side; next: boolean }) {
  const press = usePress(onTap, onLong);
  const name = side === 'V' ? 'Vänster' : 'Höger';
  return (
    <button
      type="button"
      className={`press feed-btn feed-side feed-side-${side}`}
      data-next={next}
      aria-label={`Amning ${name.toLowerCase()}${next ? ', nästa' : ''}`}
      {...press}
    >
      <span className="feed-top">
        <span className="feed-letter">{side}</span>
        <span className="tag feed-next">Nästa</span>
      </span>
      <span className="feed-label">{name}</span>
    </button>
  );
}

function BottleButton({ ml, onTap, onLong }: PressProps & { ml: number }) {
  const press = usePress(onTap, onLong);
  return (
    <button type="button" className="press feed-btn feed-bottle" aria-label={`Flaska ${ml} ml`} {...press}>
      <span className="feed-top">
        <DropHalfBottom size={28} weight="fill" />
        <span className="feed-ml">{ml} ml</span>
      </span>
      <span className="feed-label">Flaska</span>
    </button>
  );
}
