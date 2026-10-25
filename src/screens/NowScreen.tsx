import { ageText } from '../domain/time';
import { useStore } from '../state/store';
import './NowScreen.css';

// Placeholder: the full Nu screen comes in stage 3.
export function NowScreen({ now }: { now: number }) {
  const { settings } = useStore();
  return (
    <div className="now">
      <header className="now-head">
        <div className="now-who">
          <span className="now-name">{settings.name || 'Bebis'}</span>
          <span className="now-age">{ageText(settings.birth, now)}</span>
        </div>
      </header>
      <p className="placeholder">Startsidan byggs i etapp 3.</p>
    </div>
  );
}
