import React from 'react';
import type { Team } from '../../../packages/shared-types/src';
import type { StandingRow } from '../hooks/useDynastyDashboard';

type StandingsTableProps = {
  standings: StandingRow[];
  selectedTeamId: string;
  teams: Team[];
};

export function StandingsTable({ standings, selectedTeamId, teams }: StandingsTableProps) {
  return (
    <section className="panel standings-panel">
      <div className="panel-header">
        <h2>Standings</h2>
      </div>

      <table>
        <thead>
          <tr>
            <th>Team</th>
            <th>W</th>
            <th>L</th>
            <th>PF</th>
            <th>PA</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => (
            <tr key={team.teamId} className={selectedTeamId === team.teamId ? 'selected' : ''}>
              <td>{team.teamName}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
              <td>{team.pointsFor}</td>
              <td>{team.pointsAgainst}</td>
              <td>{team.net}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
