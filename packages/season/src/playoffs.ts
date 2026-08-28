import { simulateGame } from '@basketball-dynasty/simulation-engine';
import type { SeasonState } from './index';
import type { SeedOptions } from './index';

export interface PlayoffMatch {
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  winnerId: string;
}

export interface PlayoffRound {
  matchups: PlayoffMatch[];
}

export interface PlayoffResult {
  rounds: PlayoffRound[];
  championId: string | null;
}

function highestPowerOfTwo(n: number): number {
  let p = 1;
  while (p * 2 <= n) p *= 2;
  return p;
}

export function runPlayoffs(state: SeasonState, size = 4, options: SeedOptions = {}): PlayoffResult {
  const available = state.standings.length;
  let s = Math.min(size, available);
  s = highestPowerOfTwo(s);
  if (s < 2) return { rounds: [], championId: null };

  const teamMap = new Map(state.teams.map((t) => [t.id, t]));

  const topTeams = state.standings.slice(0, s).map((st) => teamMap.get(st.teamId)).filter(Boolean) as any[];
  let contestants = topTeams;

  const rounds: PlayoffRound[] = [];

  let gameIndex = 0;
  const base = options.seed ?? 424242;
  const inc = options.increment ?? 1;

  while (contestants.length > 1) {
    const next: any[] = [];
    const matchups: PlayoffMatch[] = [];
    for (let i = 0; i < contestants.length / 2; i++) {
      const home = contestants[i];
      const away = contestants[contestants.length - 1 - i];
      const game = simulateGame(home, away, { seed: base + gameIndex * inc });
      const winner = game.finalScoreA > game.finalScoreB ? home : away;
      matchups.push({
        homeId: home.id,
        awayId: away.id,
        homeScore: game.finalScoreA,
        awayScore: game.finalScoreB,
        winnerId: winner.id,
      });
      next.push(winner);
      gameIndex++;
    }
    rounds.push({ matchups });
    contestants = next;
  }

  const championId = contestants.length === 1 ? contestants[0].id : null;
  return { rounds, championId };
}
