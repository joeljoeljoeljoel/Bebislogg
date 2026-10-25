import { ChartLineUp, Clock, type Icon, Notebook } from '@phosphor-icons/react';
import './TabBar.css';

export type Tab = 'nu' | 'dagbok' | 'insikter';

const TABS: { id: Tab; label: string; Icon: Icon }[] = [
  { id: 'nu', label: 'Nu', Icon: Clock },
  { id: 'dagbok', label: 'Dagbok', Icon: Notebook },
  { id: 'insikter', label: 'Insikter', Icon: ChartLineUp },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ id, label, Icon }) => {
        const active = id === tab;
        return (
          <button
            key={id}
            type="button"
            className="tabbar-btn"
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(id)}
          >
            <Icon size={24} weight={active ? 'fill' : 'regular'} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
