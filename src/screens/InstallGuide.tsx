import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  DeviceMobile,
  DotsThreeVertical,
  DownloadSimple,
  Export,
  PlusSquare,
} from '@phosphor-icons/react';
import { AppIcon } from '../components/AppIcon';
import { promptInstall, useInstallState } from '../pwa/install';
import './InstallGuide.css';

/** Shown instead of the app in a phone browser. iPhone says hemskärm, Android startskärm. */
export function InstallGuide({ platform }: { platform: 'ios' | 'android' }) {
  return platform === 'ios' ? <IosGuide /> : <AndroidGuide />;
}

function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="guide-step">
      <span className="guide-step-n">{n}</span>
      <span className="guide-step-text">{children}</span>
      {icon}
    </li>
  );
}

function IosGuide() {
  return (
    <div className="guide">
      <div className="guide-body guide-body-ios">
        <AppIcon size={72} radius={16} />
        <h3>Lägg till Bebislogg på hemskärmen</h3>
        <p>Det som loggas här i Safari syns inte i hemskärmsappen. Lägg till appen först, så hamnar allt på ett ställe.</p>
        <ol className="guide-steps">
          <Step n={1} icon={<Export size={24} />}>
            Tryck på Dela längst ned
          </Step>
          <Step n={2} icon={<PlusSquare size={24} />}>
            Välj Lägg till på hemskärmen
          </Step>
          <Step n={3} icon={<DeviceMobile size={24} />}>
            Öppna Bebislogg från hemskärmen
          </Step>
        </ol>
      </div>
      <div className="guide-hint guide-hint-down">
        <span>Dela finns här</span>
        <ArrowDown size={20} />
      </div>
    </div>
  );
}

function AndroidGuide() {
  const { canPrompt, installed } = useInstallState();
  return (
    <div className="guide">
      <div className="guide-hint guide-hint-up">
        <ArrowUp size={20} />
        <span>Menyn finns här</span>
      </div>
      <div className="guide-body guide-body-android">
        <AppIcon size={72} radius={16} />
        <h3>Installera Bebislogg på startskärmen</h3>
        <p>
          Det som loggas här i Chrome syns inte i den installerade appen. Installera först, så hamnar allt på ett ställe.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-block guide-install"
          data-installed={installed}
          disabled={installed || !canPrompt}
          onClick={promptInstall}
        >
          {installed ? <Check size={18} /> : <DownloadSimple size={18} />}
          {installed ? 'Installerad. Öppna från startskärmen' : 'Installera Bebislogg'}
        </button>
        <span className="guide-fallback">Om knappen inte fungerar:</span>
        <ol className="guide-steps">
          <Step n={1} icon={<DotsThreeVertical size={24} weight="bold" />}>
            Tryck på ⋮ uppe till höger
          </Step>
          <Step n={2} icon={<DownloadSimple size={24} />}>
            Välj Installera app eller Lägg till på startskärmen
          </Step>
          <Step n={3} icon={<DeviceMobile size={24} />}>
            Öppna Bebislogg från startskärmen
          </Step>
        </ol>
      </div>
    </div>
  );
}
