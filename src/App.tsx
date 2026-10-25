import { useState } from 'react';
import './App.css';
import { type Tab, TabBar } from './components/TabBar';
import { DiaryScreen } from './screens/DiaryScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { Intro } from './screens/Intro';
import { NowScreen } from './screens/NowScreen';
import { useNow } from './state/clock';
import { useStore } from './state/store';
import { useThemeSync } from './theme/theme';

export function App() {
  const { settings } = useStore();
  const now = useNow();
  useThemeSync(settings, now);
  const [tab, setTab] = useState<Tab>('nu');

  return (
    <div className="app">
      <main className="screen">
        {tab === 'nu' && <NowScreen now={now} />}
        {tab === 'dagbok' && <DiaryScreen />}
        {tab === 'insikter' && <InsightsScreen />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
      {!settings.setupDone && <Intro />}
    </div>
  );
}
