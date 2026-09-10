import React from 'react';
import type { GameResult, Team } from '../../../packages/shared-types/src';
import type { ShotSummary } from '../hooks/useDynastyDashboard';

type MatchViewerPanelProps = {
  match: GameResult;
  selectedTeam: Team;
  selectedShots: ShotSummary[];
  teams: Team[];
  selectedTeamId: string;
  onSelectTeam: (teamId: string) => void;
};

export function MatchViewerPanel({
  match,
  selectedTeam,
  selectedShots,
  teams,
  selectedTeamId,
  onSelectTeam,
}: MatchViewerPanelProps) {
  const teamLookup = new Map(teams.map((team) => [team.id, team]));
  const homeTeam = teamLookup.get(match.teamAId) ?? teams[0];
  const awayTeam = teamLookup.get(match.teamBId) ?? teams[1] ?? teams[0];

  return (
    <section className="panel match-panel">
      <div className="panel-header">
        <h2>Live match view</h2>

        <div className="team-tabs">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              className={selectedTeamId === team.id ? 'active' : ''}
              onClick={() => onSelectTeam(team.id)}
            >
              {team.name}
            </button>
          ))}
        </div>
      </div>

      <div className="score-strip">
        <span>{selectedTeam.id === homeTeam.id ? selectedTeam.name : homeTeam.name}</span>
        <strong>{match.finalScoreA}</strong>
        <span>:</span>
        <strong>{match.finalScoreB}</strong>
        <span>{selectedTeam.id === awayTeam.id ? selectedTeam.name : awayTeam.name}</span>
      </div>

      <div className="court-wrap">
        <div className="court" aria-label="Shot chart court">
          <div className="midline" />
          <div className="three-line" />
          <div className="rim" />

          {selectedShots.map((shot) => (
            <span
              key={shot.id}
              className={`shot-dot ${shot.made ? 'made' : 'missed'}`}
              style={{ left: `${shot.x}%`, top: `${shot.y}%` }}
              title={`${shot.player} ${shot.shotType} ${shot.made ? 'made' : 'missed'} for ${shot.points}`}
            />
          ))}
        </div>
      </div>

      <div className="event-list-wrap">
        <h3>Recent shot events</h3>
        <ul className="event-list">
          {selectedShots.slice(-6).reverse().map((event) => (
            <li key={event.id}>
              <span>{event.player}</span>
              <span>{event.shotType}</span>
              <strong>{event.made ? 'made' : 'missed'}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
