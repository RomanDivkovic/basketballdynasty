export type ShotType = 'inside' | 'midrange' | 'three';
export interface PossessionResult {
    offenseTeamId: string;
    primaryPlayerId: string;
    action: string;
    defenseReaction: string;
    description: string;
    points: number;
    turnover: boolean;
    offensiveRebound: boolean;
}
export interface GameResult {
    teamAId: string;
    teamBId: string;
    finalScoreA: number;
    finalScoreB: number;
    possessions: PossessionResult[];
    pointsScored: Record<string, number>;
}
export interface GameState {
    teamAId: string;
    teamBId: string;
    scoreA: number;
    scoreB: number;
    currentPossession: number;
    totalPossessions: number;
    fatigue: Record<string, number>;
    playLog: string[];
}
//# sourceMappingURL=game.d.ts.map