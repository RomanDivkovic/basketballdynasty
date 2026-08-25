import * as fs from 'fs';
import * as path from 'path';
import type {
  GameResult,
  LeagueSnapshot,
  Team,
} from '@basketball-dynasty/shared-types';

export interface SaveMetadata {
  version: string;
  timestamp: string;
  kind: string;
}

export interface SaveBundle<T> {
  metadata: SaveMetadata;
  data: T;
}

export interface GameSummary {
  teamAId: string;
  teamBId: string;
  finalScoreA: number;
  finalScoreB: number;
}

export function createSaveMetadata(kind: string = 'snapshot'): SaveMetadata {
  return {
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    kind,
  };
}

export function createSaveBundle<T>(data: T, kind: string = 'snapshot'): SaveBundle<T> {
  return {
    metadata: createSaveMetadata(kind),
    data,
  };
}

export function serializeSaveBundle<T>(bundle: SaveBundle<T>): string {
  return JSON.stringify(bundle, null, 2);
}

export function parseSaveBundle<T>(raw: string): SaveBundle<T> {
  return JSON.parse(raw) as SaveBundle<T>;
}

export function saveBundleToDisk<T>(filePath: string, data: T, kind: string = 'snapshot'): void {
  const normalized = path.resolve(filePath);
  const dir = path.dirname(normalized);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(normalized, serializeSaveBundle(createSaveBundle(data, kind)), 'utf-8');
}

export function loadBundleFromDisk<T>(filePath: string): SaveBundle<T> {
  const normalized = path.resolve(filePath);
  const raw = fs.readFileSync(normalized, 'utf-8');
  return parseSaveBundle<T>(raw);
}

export function createLeagueStandings(
  teams: Team[],
  games: GameSummary[]
): LeagueSnapshot['standings'] {
  const recordMap = new Map<string, { teamId: string; teamName: string; wins: number; losses: number; pointsFor: number; pointsAgainst: number }>();

  for (const team of teams) {
    recordMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  for (const game of games) {
    const a = recordMap.get(game.teamAId);
    const b = recordMap.get(game.teamBId);

    if (!a || !b) continue;

    a.pointsFor += game.finalScoreA;
    a.pointsAgainst += game.finalScoreB;
    b.pointsFor += game.finalScoreB;
    b.pointsAgainst += game.finalScoreA;

    if (game.finalScoreA > game.finalScoreB) {
      a.wins += 1;
      b.losses += 1;
    } else if (game.finalScoreB > game.finalScoreA) {
      b.wins += 1;
      a.losses += 1;
    }
  }

  return Array.from(recordMap.values())
    .map((entry) => ({
      ...entry,
      winPct: entry.wins + entry.losses === 0 ? 0.5 : entry.wins / (entry.wins + entry.losses),
      pointDifferential: entry.pointsFor - entry.pointsAgainst,
    }))
    .sort((left, right) => {
      const byWinPct = right.winPct - left.winPct;
      if (byWinPct !== 0) return byWinPct;
      const byDiff = right.pointDifferential - left.pointDifferential;
      if (byDiff !== 0) return byDiff;
      return right.pointsFor - left.pointsFor;
    });
}

export function buildLeagueSnapshot(
  teams: Team[],
  games: GameSummary[],
  seasonId: string = 'season-1'
): LeagueSnapshot {
  return {
    seasonId,
    standings: createLeagueStandings(teams, games),
    lastUpdated: new Date().toISOString(),
  };
}

export function createGameSummary(game: GameResult): GameSummary {
  return {
    teamAId: game.teamAId,
    teamBId: game.teamBId,
    finalScoreA: game.finalScoreA,
    finalScoreB: game.finalScoreB,
  };
}
