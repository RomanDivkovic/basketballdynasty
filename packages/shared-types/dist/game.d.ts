export type ShotType = 'inside' | 'midrange' | 'three';
export interface ShotLocation {
    x: number;
    y: number;
}
export interface GameEvent {
    id: string;
    type: 'shot' | 'assist' | 'rebound' | 'turnover' | 'foul' | 'free_throw';
    description: string;
    period: number;
    possession: number;
    teamId: string;
    playerId?: string;
    shotType?: ShotType;
    shotLocation?: ShotLocation;
    points?: number;
    made?: boolean;
    assistPlayerId?: string;
    reboundPlayerId?: string;
    opponentTeamId?: string;
}
export interface PossessionResult {
    offenseTeamId: string;
    primaryPlayerId: string;
    action: string;
    defenseReaction: string;
    description: string;
    points: number;
    turnover: boolean;
    offensiveRebound: boolean;
    shotType?: ShotType;
    shotLocation?: ShotLocation;
    made?: boolean;
    assistPlayerId?: string;
    reboundPlayerId?: string;
    period?: number;
}
export interface GameResult {
    teamAId: string;
    teamBId: string;
    finalScoreA: number;
    finalScoreB: number;
    possessions: PossessionResult[];
    gameEvents: GameEvent[];
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