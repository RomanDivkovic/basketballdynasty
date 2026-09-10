import React from 'react';

export type DynastyView = 'overview' | 'roster' | 'offseason';

type TopBarProps = {
  teamName: string;
  seasonLabel: string;
  activeView: DynastyView;
  onNavigate: (view: DynastyView) => void;
  onPlayNextGame?: () => void;
  onAdvanceSeason?: () => void;
};

const navItems: Array<{ value: DynastyView; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'roster', label: 'Roster' },
  { value: 'offseason', label: 'Offseason' },
];

export function TopBar({
  teamName,
  seasonLabel,
  activeView,
  onNavigate,
  onPlayNextGame,
  onAdvanceSeason,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Dynasty dashboard</p>
        <h1>Basketball Dynasty Manager</h1>
      </div>

      <div className="top-actions">
        <nav className="page-tabs" aria-label="Dynasty pages">
          {navItems.map((item) => (
            <button
              key={item.value}
              type="button"
              className={activeView === item.value ? 'primary active' : 'ghost'}
              onClick={() => onNavigate(item.value)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="ghost" type="button" onClick={onPlayNextGame}>
          Play next game
        </button>
        <button className="primary" type="button" onClick={onAdvanceSeason}>
          Advance season
        </button>
        <button className="ghost" type="button">
          {seasonLabel}
        </button>
        <button className="primary" type="button">
          User team: {teamName}
        </button>
      </div>
    </header>
  );
}
