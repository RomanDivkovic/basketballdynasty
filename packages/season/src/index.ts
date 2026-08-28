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

export function createSeasonState(teams: Team[], seasonId = 'season-1'): SeasonState {
  const schedule = generateSchedule(teams);
  return {
    seasonId,
    teams,
    schedule,
    results: [],
    standings: [],
    currentRound: 0,
    completed: false,
  };
}

export interface SeedOptions {
  seed?: number; // base seed
  increment?: number; // increment per game (default 1)
}

export function playNextGame(state: SeasonState, options: SeedOptions = {}): SeasonState {
  const idx = state.results.length;
  if (idx >= state.schedule.length) return { ...state, completed: true };

  const fixture = state.schedule[idx];
  const teamMap = new Map(state.teams.map((t) => [t.id, t]));
  const home = teamMap.get(fixture.homeTeamId);
  const away = teamMap.get(fixture.awayTeamId);
  if (!home || !away) return state;

  const base = options.seed ?? 12345;
  const inc = options.increment ?? 1;
  const game = simulateGame(home, away, { seed: base + idx * inc });
  const winnerId = game.finalScoreA > game.finalScoreB ? home.id : away.id;
  const loserId = winnerId === home.id ? away.id : home.id;

  const newResult: SeasonGameResult = {
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore: game.finalScoreA,
    awayScore: game.finalScoreB,
    winnerId,
    loserId,
  };

  const results = [...state.results, newResult];

  const standings = buildLeagueSnapshot(
    state.teams,
    results.map((r) => ({ teamAId: r.homeTeamId, teamBId: r.awayTeamId, finalScoreA: r.homeScore, finalScoreB: r.awayScore })),
    state.seasonId
  ).standings;

  const completed = results.length >= state.schedule.length;

  return {
    ...state,
    results,
    standings,
    currentRound: results.length,
    completed,
  };
}

export function playNextRound(state: SeasonState, rounds = 1, options: SeedOptions = {}): SeasonState {
  let s = state;
  for (let i = 0; i < rounds; i++) {
    s = playNextGame(s, options);
    if (s.completed) break;
  }
  return s;
}

export interface PlayoffResult {
  teamAId: string;
  teamBId: string;
  teamAScore: number;
  teamBScore: number;
  winnerId: string;
  round: number;
}

/**
 * Run a simple single-elimination playoff using the top N teams from standings.
 * Returns the champion id and list of match results.
 */
export function runPlayoffs(state: SeasonState, topN = 4, options: SeedOptions = {}): { championId?: string; rounds: PlayoffResult[] } {
  const standings = state.standings.length
    ? state.standings
    : buildLeagueSnapshot(
        state.teams,
        state.results.map((r) => ({ teamAId: r.homeTeamId, teamBId: r.awayTeamId, finalScoreA: r.homeScore, finalScoreB: r.awayScore })),
        state.seasonId
      ).standings;

  const top = standings.slice(0, topN).map((s) => s.teamId);
  const teamMap = new Map(state.teams.map((t) => [t.id, t]));
  const bracket: (import('@basketball-dynasty/shared-types').Team)[] = top.map((id) => teamMap.get(id)).filter(Boolean) as any;

  if (bracket.length < 2) return { rounds: [] };

  const base = options.seed ?? 5000;
  const inc = options.increment ?? 1;

  let current = bracket.slice();
  const results: PlayoffResult[] = [];
  let round = 1;

  while (current.length > 1) {
    const nextRound: typeof current = [];
    for (let i = 0; i < Math.floor(current.length / 2); i++) {
      const a = current[i];
      const b = current[current.length - 1 - i];
      const matchSeed = base + results.length * inc + round * 1000;
      const g = simulateGame(a, b, { seed: matchSeed });
      const winnerId = g.finalScoreA > g.finalScoreB ? a.id : b.id;
      results.push({ teamAId: a.id, teamBId: b.id, teamAScore: g.finalScoreA, teamBScore: g.finalScoreB, winnerId, round });
      nextRound.push(a.id === winnerId ? a : b);
    }
    current = nextRound;
    round++;
  }

  return { championId: current[0]?.id, rounds: results };
}

export function saveSeasonSnapshot(filePath: string, season: SeasonState): void {
  saveBundleToDisk(filePath, season, 'season');
}

