import React from 'react';
import type { Team } from '../../../packages/shared-types/src';
import { TopBar, type DynastyView } from '../components/TopBar';
import type {
  LeaderSummary,
  MatchRow,
  ShotSummary,
  StandingRow,
  TeamSummary,
} from '../hooks/useDynastyDashboard';

type OffseasonPageProps = {
  leagueTeams: Team[];
  schedule: MatchRow[];
  standings: StandingRow[];
  selectedTeam: Team;
  selectedTeamId: string;
  selectedShots: ShotSummary[];
  match: any;
  leader: LeaderSummary | null;
  onSelectTeam: (teamId: string) => void;
  onPlayNextGame: () => void;
  onAdvanceSeason: () => void;
  teamSummaries: TeamSummary[];
  activeView: DynastyView;
  onNavigate: (view: DynastyView) => void;
};

export function OffseasonPage({
  selectedTeam,
  teamSummaries,
  activeView,
  onNavigate,
  onPlayNextGame,
  onAdvanceSeason,
}: OffseasonPageProps) {
  const summary =
    teamSummaries.find((item) => item.teamId === selectedTeam.id) ?? {
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      rosterSize: selectedTeam.players.length,
      averageOverall: 0,
      averagePotential: 0,
      averageAge: 25,
    };

  const priorities = [
    `Free agency: target role players for ${selectedTeam.name}'s rotation`,
    `Draft board: prioritize athletic wings and floor spacing`,
    `Development: play bigger minutes for young upside players`,
    `Contracts: evaluate cap flexibility before the next season`,
  ];

  return (
    <div className="app-shell">
      <TopBar
        teamName={selectedTeam.name}
        seasonLabel="Offseason"
        activeView={activeView}
        onNavigate={onNavigate}
        onPlayNextGame={onPlayNextGame}
        onAdvanceSeason={onAdvanceSeason}
      />

      <main className="content-stack">
        <section className="panel">
          <div className="panel-header">
            <h2>Offseason priorities</h2>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span className="muted">Roster slots</span>
              <strong>{Math.max(0, 12 - summary.rosterSize)}</strong>
            </div>
            <div className="summary-card">
              <span className="muted">Avg OVR</span>
              <strong>{summary.averageOverall}</strong>
            </div>
            <div className="summary-card">
              <span className="muted">Potential</span>
              <strong>{summary.averagePotential}</strong>
            </div>
            <div className="summary-card">
              <span className="muted">Average age</span>
              <strong>{summary.averageAge}</strong>
            </div>
          </div>

          <ul className="checklist">
            {priorities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Front office snapshot</h2>
          </div>

          <table className="mini-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Roster</th>
                <th>Avg OVR</th>
                <th>Potential</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {teamSummaries.map((team) => (
                <tr key={team.teamId} className={selectedTeam.id === team.teamId ? 'selected' : ''}>
                  <td>{team.teamName}</td>
                  <td>{team.rosterSize}</td>
                  <td>{team.averageOverall}</td>
                  <td>{team.averagePotential}</td>
                  <td>{team.averageAge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
