import React from 'react';
import type { Team } from '../../../packages/shared-types/src';
import { LeagueLeaderStrip } from '../components/LeagueLeaderStrip';
import { MatchViewerPanel } from '../components/MatchViewerPanel';
import { RosterPanel } from '../components/RosterPanel';
import { SchedulePanel } from '../components/SchedulePanel';
import { StandingsTable } from '../components/StandingsTable';
import { TeamSelectorCards } from '../components/TeamSelectorCards';
import { TopBar, type DynastyView } from '../components/TopBar';
import type { LeaderSummary, MatchRow, ShotSummary, StandingRow } from '../hooks/useDynastyDashboard';

type DynastyDashboardPageProps = {
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
  activeView: DynastyView;
  onNavigate: (view: DynastyView) => void;
};

export function DynastyDashboardPage({
  leagueTeams,
  schedule,
  standings,
  selectedTeam,
  selectedTeamId,
  selectedShots,
  match,
  leader,
  onSelectTeam,
  onPlayNextGame,
  onAdvanceSeason,
  activeView,
  onNavigate,
}: DynastyDashboardPageProps) {
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

      <TeamSelectorCards
        teams={leagueTeams}
        standings={standings}
        selectedTeamId={selectedTeamId}
        match={match}
        onSelectTeam={onSelectTeam}
      />

      <main className="dashboard-grid">
        <StandingsTable standings={standings} selectedTeamId={selectedTeamId} teams={leagueTeams} />
        <SchedulePanel games={schedule} teams={leagueTeams} />
        <RosterPanel team={selectedTeam} />
        <MatchViewerPanel
          match={match}
          selectedTeam={selectedTeam}
          selectedShots={selectedShots}
          teams={leagueTeams}
          selectedTeamId={selectedTeamId}
          onSelectTeam={onSelectTeam}
        />
      </main>

      <LeagueLeaderStrip leader={leader} />
    </div>
  );
}
