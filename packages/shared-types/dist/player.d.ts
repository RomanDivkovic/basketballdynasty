export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C';
export interface PlayerRatings {
    insideScoring: number;
    midrange: number;
    threePoint: number;
    passing: number;
    ballHandling: number;
    rebounding: number;
    interiorDefense: number;
    perimeterDefense: number;
    steals: number;
    blocks: number;
    athleticism: number;
    stamina: number;
    basketballIQ: number;
    potential: number;
}
export interface Player {
    id: string;
    name: string;
    position: Position;
    ratings: PlayerRatings;
}
//# sourceMappingURL=player.d.ts.map