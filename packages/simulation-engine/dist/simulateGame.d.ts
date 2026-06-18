import { Team, GameResult } from '@basketball-dynasty/shared-types';
export interface SimulateGameOptions {
    totalPossessions?: number;
    seed?: number;
    /** Possessions between rotation checks. Lower = more frequent subs. */
    rotationInterval?: number;
}
export declare function simulateGame(teamA: Team, teamB: Team, options?: SimulateGameOptions): GameResult;
//# sourceMappingURL=simulateGame.d.ts.map