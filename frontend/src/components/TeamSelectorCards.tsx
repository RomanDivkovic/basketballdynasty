import React from 'react';
import type { GameResult, Team } from '../../../packages/shared-types/src';
import type { StandingRow } from '../hooks/useDynastyDashboard';

type TeamSelectorCardsProps = {
  teams: Team[];
  standings: StandingRow[];
  selectedTeamId: string;
  match: GameResult;
  onSelectTeam: (teamId: string) => void;
};

export function TeamSelectorCards({
  teams,
  standings,
  selectedTeamId,
  match,
  onSelectTeam,
}: TeamSelectorCardsProps) {
  return (
    <section className="hero-grid">
      {teams.map((team) => {
        const teamStanding = standings.find((item) => item.teamId === team.id);
        const teamScore = team.id === match.teamAId ? match.finalScoreA : match.finalScoreB;

        return (
          <button
            key={team.id}
            type="button"
            className={`team-card ${selectedTeamId === team.id ? 'active' : ''}`}
            onClick={() => onSelectTeam(team.id)}
          >
            <span className="team-label">{team.name}</span>
            <strong>{teamScore}</strong>
            <small>
              {teamStanding ? `${teamStanding.wins}-${teamStanding.losses}` : '0-0'}
            </small>
          </button>
        );
      })}
    </section>
  );
}
