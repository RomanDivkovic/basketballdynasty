import { useCallback, useMemo, useState } from 'react';
import teamsData from '../../../data/teams.json';
import type { GameResult, Player, Team } from '../../../packages/shared-types/src';
import { simulateGame } from '../../../packages/simulation-engine/src';
import { advanceToNextSeason, createDynastyState, playNextGame } from '../../../packages/season/src';

export type MatchRow = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string;
};

export type StandingRow = {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  net: number;
};

export type ShotSummary = {
  id: string;
  player: string;
  team: 'A' | 'B';
  shotType: string;
  made: boolean;
  points: number;
  x: number;
  y: number;
};

export type LeaderSummary = Player & {
  teamName: string;
};

export type TeamSummary = {
  teamId: string;
  teamName: string;
  rosterSize: number;
  averageOverall: number;
  averagePotential: number;
  averageAge: number;
};

const leagueTeams = teamsData as Team[];

export function computeOverallRating(player: Player): number {
  const stats = Object.values(player.ratings);
  return Math.round(stats.reduce((sum, value) => sum + value, 0) / stats.length);
}

export function buildStandings(schedule: MatchRow[], teams: Team[] = leagueTeams): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  teams.forEach((team) => {
    rows.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      net: 0,
    });
  });

  schedule.forEach((game) => {
    const home = rows.get(game.homeTeamId)!;
    const away = rows.get(game.awayTeamId)!;

    home.pointsFor += game.homeScore;
    home.pointsAgainst += game.awayScore;
    away.pointsFor += game.awayScore;
    away.pointsAgainst += game.homeScore;

    if (game.winnerId === game.homeTeamId) {
      home.wins += 1;
      away.losses += 1;
    } else {
      away.wins += 1;
      home.losses += 1;
    }

    home.net = home.pointsFor - home.pointsAgainst;
    away.net = away.pointsFor - away.pointsAgainst;
  });

  return Array.from(rows.values()).sort((a, b) => b.wins - a.wins || b.net - a.net);
}

export function buildSchedule(teams: Team[] = leagueTeams): MatchRow[] {
  const games: MatchRow[] = [];

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const home = teams[i];
      const away = teams[j];

      const first = simulateGame(home, away, { seed: 1400 + i * 97 + j * 31, totalPossessions: 80 });
      const second = simulateGame(away, home, { seed: 2400 + i * 97 + j * 31, totalPossessions: 80 });

      games.push({
        id: `${home.id}-vs-${away.id}-1`,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: first.finalScoreA,
        awayScore: first.finalScoreB,
        winnerId: first.finalScoreA > first.finalScoreB ? home.id : away.id,
      });

      games.push({
        id: `${home.id}-vs-${away.id}-2`,
        homeTeamId: away.id,
        awayTeamId: home.id,
        homeScore: second.finalScoreA,
        awayScore: second.finalScoreB,
        winnerId: second.finalScoreA > second.finalScoreB ? away.id : home.id,
      });
    }
  }

  return games;
}

export function useDynastyDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(leagueTeams[0]?.id ?? '');
  const [dynasty, setDynasty] = useState(() =>
    createDynastyState(leagueTeams, 'dynasty-demo', leagueTeams[0]?.id)
  );

  const seasonState = dynasty.currentSeason;

  const schedule = useMemo<MatchRow[]>(() => {
    if (seasonState.results.length > 0) {
      return seasonState.results.map((result) => ({
        id: `${result.homeTeamId}-vs-${result.awayTeamId}-${result.homeScore}-${result.awayScore}`,
        homeTeamId: result.homeTeamId,
        awayTeamId: result.awayTeamId,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        winnerId: result.winnerId,
      }));
    }

    return buildSchedule();
  }, [seasonState.results]);

  const standings = useMemo(() => {
    if (seasonState.standings && seasonState.standings.length > 0) {
      return seasonState.standings.map((row: any) => ({
        teamId: row.teamId ?? row.team?.id ?? row.id,
        teamName: row.teamName ?? row.name ?? row.team?.name ?? 'Unknown',
        wins: row.wins ?? 0,
        losses: row.losses ?? 0,
        pointsFor: row.pointsFor ?? 0,
        pointsAgainst: row.pointsAgainst ?? 0,
        net: row.net ?? 0,
      }));
    }

    return buildStandings(schedule);
  }, [schedule, seasonState.standings]);

  const match = useMemo<GameResult>(() => {
    const home = leagueTeams[0];
    const away = leagueTeams[1] ?? leagueTeams[0];
    return simulateGame(home, away, { seed: 999, totalPossessions: 82 });
  }, []);

  const selectedTeam = useMemo(
    () => leagueTeams.find((team) => team.id === selectedTeamId) ?? leagueTeams[0],
    [selectedTeamId]
  );

  const selectedShots = useMemo<ShotSummary[]>(() => {
    if (!match.gameEvents) {
      return [];
    }

    return match.gameEvents
      .filter((event) => event.teamId === selectedTeam.id && event.shotLocation && event.shotType)
      .map((event) => ({
        id: event.id,
        player: event.playerId ?? 'Player',
        team: event.teamId === match.teamAId ? 'A' : 'B',
        shotType: event.shotType!,
        made: event.made ?? false,
        points: event.points ?? 0,
        x: event.shotLocation!.x,
        y: event.shotLocation!.y,
      }));
  }, [match, selectedTeam]);

  const leader = useMemo<LeaderSummary | null>(() => {
    const playerList = leagueTeams.flatMap((team) =>
      team.players.map((player) => ({ ...player, teamName: team.name }))
    );

    return [...playerList].sort((a, b) => computeOverallRating(b) - computeOverallRating(a))[0] ?? null;
  }, []);

  const teamSummaries = useMemo<TeamSummary[]>(() => {
    return leagueTeams.map((team) => {
      const rosterSize = team.players.length;
      const averageOverall =
        rosterSize > 0
          ? Math.round(
              team.players.reduce((sum, player) => sum + computeOverallRating(player), 0) / rosterSize
            )
          : 0;
      const averagePotential =
        rosterSize > 0
          ? Math.round(
              team.players.reduce((sum, player) => sum + (player.ratings?.potential ?? 50), 0) / rosterSize
            )
          : 0;
      const averageAge =
        rosterSize > 0
          ? Math.round(team.players.reduce((sum, player) => sum + (player.age ?? 25), 0) / rosterSize)
          : 25;

      return {
        teamId: team.id,
        teamName: team.name,
        rosterSize,
        averageOverall,
        averagePotential,
        averageAge,
      };
    });
  }, []);

  const playNextGameAction = useCallback(() => {
    setDynasty((current) => ({
      ...current,
      currentSeason: playNextGame(current.currentSeason, { seed: Date.now() }),
    }));
  }, []);

  const advanceSeasonAction = useCallback(() => {
    setDynasty((current) => advanceToNextSeason(current, { seed: Date.now() }));
  }, []);

  return {
    leagueTeams,
    schedule,
    standings,
    selectedTeam,
    selectedTeamId,
    selectedShots,
    match,
    leader,
    teamSummaries,
    dynasty,
    currentSeason: seasonState,
    onSelectTeam: setSelectedTeamId,
    onPlayNextGame: playNextGameAction,
    onAdvanceSeason: advanceSeasonAction,
  };
}
