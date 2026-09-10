import React from 'react';
import type { Team } from '../../../packages/shared-types/src';
import { computeOverallRating } from '../hooks/useDynastyDashboard';

type RosterPanelProps = {
  team: Team;
};

export function RosterPanel({ team }: RosterPanelProps) {
  return (
    <section className="panel roster-panel">
      <div className="panel-header">
        <h2>Roster</h2>
      </div>

      <div className="roster-grid">
        {team.players.map((player) => (
          <article key={player.id} className="player-card">
            <div className="player-topline">
              <div>
                <h3>{player.name}</h3>
                <span>{player.position}</span>
              </div>
              <strong>{computeOverallRating(player)}</strong>
            </div>

            <div className="player-meta">
              <span>Ovr</span>
              <span>{player.ratings.threePoint}</span>
              <span>{player.ratings.insideScoring}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
