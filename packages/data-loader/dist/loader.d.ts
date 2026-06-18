import { Player, Team } from '@basketball-dynasty/shared-types';
export interface DataLoadOptions {
    dataRoot?: string;
}
/**
 * Stub data loader.
 * Currently supports loading players.json and teams.json from disk.
 * No API fetching. Simple synchronous read for now.
 */
export declare class DataLoader {
    private dataRoot;
    constructor(options?: DataLoadOptions);
    loadPlayers(): Player[];
    loadTeams(): Team[];
}
//# sourceMappingURL=loader.d.ts.map