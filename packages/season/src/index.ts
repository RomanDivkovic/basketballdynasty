import type { Team } from '@basketball-dynasty/shared-types';
import { simulateGame } from '@basketball-dynasty/simulation-engine';
import { buildLeagueSnapshot, saveBundleToDisk } from '@basketball-dynasty/save-system';

export interface GameFixture {
  homeTeamId: string;
  awayTeamId: string;
}

export interface SeasonGameResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string;
  loserId: string;
}

export interface SeasonState {
  seasonId: string;
  teams: Team[];
  schedule: GameFixture[];
  results: SeasonGameResult[];
  standings: ReturnType<typeof buildLeagueSnapshot>['standings'];
  currentRound: number;
  completed: boolean;
}

export function generateSchedule(teams: Team[]): GameFixture[] {
  const results: GameFixture[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      results.push({ homeTeamId: teams[i].id, awayTeamId: teams[j].id });
      results.push({ homeTeamId: teams[j].id, awayTeamId: teams[i].id });
    }
  }
  return results;
}

export function playSeason(teams: Team[], seasonId = 'season-1', options: { seed?: number } = {}): SeasonState {
  const schedule = generateSchedule(teams);
  const results: SeasonGameResult[] = [];
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  for (let i = 0; i < schedule.length; i++) {
    const fixture = schedule[i];
    const home = teamMap.get(fixture.homeTeamId);
    const away = teamMap.get(fixture.awayTeamId);

    if (!home || !away) {
      continue;
    }

    const game = simulateGame(home, away, { seed: (options.seed ?? 12345) + i });
    const winnerId = game.finalScoreA > game.finalScoreB ? home.id : away.id;
    const loserId = winnerId === home.id ? away.id : home.id;

    results.push({
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: game.finalScoreA,
      awayScore: game.finalScoreB,
      winnerId,
      loserId,
    });
  }

  const standings = buildLeagueSnapshot(
    teams,
    results.map((result) => ({
      teamAId: result.homeTeamId,
      teamBId: result.awayTeamId,
      finalScoreA: result.homeScore,
      finalScoreB: result.awayScore,
    })),
    seasonId
  ).standings;

  return {
    seasonId,
    teams,
    schedule,
    results,
    standings,
    currentRound: schedule.length,
    completed: true,
  };
}

export function saveSeasonSnapshot(filePath: string, season: SeasonState): void {
  saveBundleToDisk(filePath, season, 'season');
}
