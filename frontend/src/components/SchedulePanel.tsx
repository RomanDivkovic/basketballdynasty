import React from 'react';
import type { Team } from '../../../packages/shared-types/src';
import type { MatchRow } from '../hooks/useDynastyDashboard';

type SchedulePanelProps = {
  games: MatchRow[];
  teams: Team[];
};

export function SchedulePanel({ games, teams }: SchedulePanelProps) {
  const teamLookup = new Map(teams.map((team) => [team.id, team]));

  return (
    <section className="panel schedule-panel">
      <div className="panel-header">
        <h2>Schedule</h2>
      </div>

      <div className="schedule-list">
        {games.slice(0, 4).map((game) => {
          const home = teamLookup.get(game.homeTeamId)!;
          const away = teamLookup.get(game.awayTeamId)!;

          return (
            <div key={game.id} className="schedule-row">
              <span>{home.name}</span>
              <strong>
                {game.homeScore} - {game.awayScore}
              </strong>
              <span>{away.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
