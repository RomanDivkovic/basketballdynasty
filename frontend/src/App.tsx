import React, { useMemo, useState } from 'react';

type ShotEvent = {
  id: string;
  player: string;
  team: 'A' | 'B';
  shotType: 'inside' | 'midrange' | 'three';
  made: boolean;
  points: number;
  x: number;
  y: number;
};

const sampleEvents: ShotEvent[] = [
  { id: '1', player: 'A. Cole', team: 'A', shotType: 'three', made: true, points: 3, x: 72, y: 18 },
  { id: '2', player: 'B. Miles', team: 'B', shotType: 'midrange', made: false, points: 0, x: 56, y: 42 },
  { id: '3', player: 'A. Grant', team: 'A', shotType: 'inside', made: true, points: 2, x: 62, y: 33 },
  { id: '4', player: 'B. Ross', team: 'B', shotType: 'three', made: true, points: 3, x: 32, y: 12 },
  { id: '5', player: 'A. Cole', team: 'A', shotType: 'three', made: false, points: 0, x: 80, y: 26 },
  { id: '6', player: 'B. Cole', team: 'B', shotType: 'inside', made: true, points: 2, x: 50, y: 30 },
];

export default function App() {
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B'>('A');

  const filtered = useMemo(
    () => sampleEvents.filter((event) => event.team === selectedTeam),
    [selectedTeam]
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Dynasty / Match Viewer</p>
          <h1>Basketball Dynasty Manager</h1>
        </div>
        <div className="scorecard">
          <span className="team-pill team-a">Alpha</span>
          <strong>104</strong>
          <span className="divider">-</span>
          <strong>98</strong>
          <span className="team-pill team-b">Bravo</span>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel match-panel">
          <div className="panel-header">
            <h2>Shot chart</h2>
            <div className="team-tabs">
              <button className={selectedTeam === 'A' ? 'active' : ''} onClick={() => setSelectedTeam('A')}>
                Alpha
              </button>
              <button className={selectedTeam === 'B' ? 'active' : ''} onClick={() => setSelectedTeam('B')}>
                Bravo
              </button>
            </div>
          </div>

          <div className="court-wrap">
            <div className="court" aria-label="Shot chart court">
              <div className="midline" />
              <div className="three-line" />
              <div className="rim" />
              {filtered.map((shot) => (
                <span
                  key={shot.id}
                  className={`shot-dot ${shot.made ? 'made' : 'missed'}`}
                  style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
                  title={`${shot.player} ${shot.shotType} ${shot.made ? 'made' : 'missed'} for ${shot.points}`}
                />
              ))}
            </div>
          </div>
        </section>

        <aside className="panel event-panel">
          <h2>Recent events</h2>
          <ul className="event-list">
            {filtered.map((event) => (
              <li key={event.id}>
                <span className="event-player">{event.player}</span>
                <span className="event-meta">
                  {event.shotType} • {event.made ? 'made' : 'missed'}
                </span>
                <strong>{event.points} pts</strong>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
