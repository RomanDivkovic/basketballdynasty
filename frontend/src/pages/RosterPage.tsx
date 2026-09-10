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
import { computeOverallRating } from '../hooks/useDynastyDashboard';

type RosterPageProps = {
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

export function RosterPage({
  leagueTeams,
  selectedTeam,
  teamSummaries,
  activeView,
  onNavigate,
  onPlayNextGame,
  onAdvanceSeason,
}: RosterPageProps) {
  const summary =
    teamSummaries.find((item) => item.teamId === selectedTeam.id) ?? {
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      rosterSize: selectedTeam.players.length,
      averageOverall: Math.round(
        selectedTeam.players.reduce((sum, player) => sum + computeOverallRating(player), 0) /
          Math.max(selectedTeam.players.length, 1)
      ),
      averagePotential: Math.round(
        selectedTeam.players.reduce((sum, player) => sum + (player.ratings.potential ?? 50), 0) /
          Math.max(selectedTeam.players.length, 1)
      ),
      averageAge: Math.round(
        selectedTeam.players.reduce((sum, player) => sum + (player.age ?? 25), 0) /
          Math.max(selectedTeam.players.length, 1)
      ),
    };

  return (
    <div className="app-shell">
      <TopBar
        teamName={selectedTeam.name}
        seasonLabel="Season 1"
        activeView={activeView}
        onNavigate={onNavigate}
        onPlayNextGame={onPlayNextGame}
        onAdvanceSeason={onAdvanceSeason}
      />

      <main className="content-stack">
        <section className="panel">
          <div className="panel-header">
            <h2>{selectedTeam.name} roster overview</h2>
            <span className="muted">{selectedTeam.players.length} players</span>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <span className="muted">Roster size</span>
              <strong>{summary.rosterSize}</strong>
            </div>
            <div className="summary-card">
              <span className="muted">Avg OVR</span>
              <strong>{summary.averageOverall}</strong>
            </div>
            <div className="summary-card">
              <span className="muted">Avg potential</span>
              <strong>{summary.averagePotential}</strong>
            </div>
            <div className="summary-card">
              <span className="muted">Avg age</span>
              <strong>{summary.averageAge}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Player cards</h2>
          </div>

          <div className="roster-grid">
            {selectedTeam.players.map((player) => (
              <article key={player.id} className="player-card expanded">
                <div className="player-topline">
                  <div>
                    <h3>{player.name}</h3>
                    <span>{player.position}</span>
                  </div>
                  <strong>{computeOverallRating(player)}</strong>
                </div>

                <div className="player-detail-grid">
                  <span>Age</span>
                  <strong>{player.age ?? 25}</strong>
                  <span>Potential</span>
                  <strong>{player.ratings.potential}</strong>
                  <span>3PT</span>
                  <strong>{player.ratings.threePoint}</strong>
                  <span>Playmaking</span>
                  <strong>{player.ratings.passing}</strong>
                  <span>Defense</span>
                  <strong>{player.ratings.interiorDefense}</strong>
                  <span>Rebound</span>
                  <strong>{player.ratings.rebounding}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>League roster snapshot</h2>
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
