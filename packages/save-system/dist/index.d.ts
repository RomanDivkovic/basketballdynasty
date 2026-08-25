import type { GameResult, LeagueSnapshot, Team } from '@basketball-dynasty/shared-types';
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
export declare function createSaveMetadata(kind?: string): SaveMetadata;
export declare function createSaveBundle<T>(data: T, kind?: string): SaveBundle<T>;
export declare function serializeSaveBundle<T>(bundle: SaveBundle<T>): string;
export declare function parseSaveBundle<T>(raw: string): SaveBundle<T>;
export declare function saveBundleToDisk<T>(filePath: string, data: T, kind?: string): void;
export declare function loadBundleFromDisk<T>(filePath: string): SaveBundle<T>;
export declare function createLeagueStandings(teams: Team[], games: GameSummary[]): LeagueSnapshot['standings'];
export declare function buildLeagueSnapshot(teams: Team[], games: GameSummary[], seasonId?: string): LeagueSnapshot;
export declare function createGameSummary(game: GameResult): GameSummary;
//# sourceMappingURL=index.d.ts.map