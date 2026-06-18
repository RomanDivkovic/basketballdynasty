import { Team } from '@basketball-dynasty/shared-types';
export interface OffensiveTendencies {
    pace: 'slow' | 'medium' | 'fast';
    threePointTendency: number;
    interiorTendency: number;
}
export declare function getTeamOffensiveTendencies(team: Team): OffensiveTendencies;
export declare function getTeamDefensiveStyle(team: Team): string;
//# sourceMappingURL=playStyle.d.ts.map