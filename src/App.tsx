import { Activity, useState } from 'react';
import './App.css';
import { BottomSheet } from './components/BottomSheet';
import { type Tab, TabBar } from './components/TabBar';
import { UndoBar } from './components/UndoBar';
import { DiaryScreen } from './screens/diary/DiaryScreen';
import { installGuide } from './pwa/install';
import { InsightsScreen } from './screens/insights/InsightsScreen';
import { InstallGuide } from './screens/InstallGuide';
import { Intro } from './screens/Intro';
import { NowScreen } from './screens/now/NowScreen';
import { EditSheet } from './sheets/EditSheet';
import { SettingsSheet } from './sheets/SettingsSheet';
import { useNow } from './state/clock';
import { draftTitle } from './state/draft';
import { useStore } from './state/store';
import { useUI } from './state/ui';
import { useThemeSync } from './theme/theme';

export function App() {
  const { settings } = useStore();
  const ui = useUI();
  const now = useNow();
  useThemeSync(settings, now);
  const [tab, setTab] = useState<Tab>('nu');
  const [guide] = useState(installGuide);
  const sheet = ui.sheet;

  if (guide) {
    return (
      <div className="app">
        <InstallGuide platform={guide} />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Hidden tabs keep their state, e.g. which dygn are expanded in Dagbok. */}
      <main className="screen">
        <Activity mode={tab === 'nu' ? 'visible' : 'hidden'}>
          <NowScreen now={now} />
        </Activity>
        <Activity mode={tab === 'dagbok' ? 'visible' : 'hidden'}>
          <DiaryScreen now={now} />
        </Activity>
        <Activity mode={tab === 'insikter' ? 'visible' : 'hidden'}>
          <InsightsScreen now={now} />
        </Activity>
      </main>
      {tab !== 'nu' && <UndoBar placement="tab" />}
      <TabBar tab={tab} onChange={setTab} />
      {sheet && (
        <BottomSheet
          label={sheet.kind === 'draft' ? draftTitle(sheet.draft) : 'Inställningar'}
          onClose={ui.closeSheet}
        >
          {sheet.kind === 'draft' ? (
            <EditSheet key={sheet.draft.id ?? sheet.draft.kind} initial={sheet.draft} />
          ) : (
            <SettingsSheet />
          )}
        </BottomSheet>
      )}
      {!settings.setupDone && <Intro />}
    </div>
  );
}
