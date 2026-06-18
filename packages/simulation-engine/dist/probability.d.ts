import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
export interface PossessionContext {
    primaryOffender: Player;
    /** Exactly the 5 (or fewer) players currently on court for offense */
    offensiveTeamPlayers: Player[];
    /** Exactly the 5 (or fewer) players currently on court for defense */
    defensiveTeamPlayers: Player[];
    fatigue: Record<string, number>;
    action: string;
    shotType: 'inside' | 'midrange' | 'three';
    defenseReaction: string;
}
export interface Outcome {
    made: boolean;
    points: number;
    turnover: boolean;
    offensiveRebound: boolean;
    descriptionSuffix: string;
}
/**
 * Core probability engine.
 * Returns a realistic outcome for the possession.
 * Now operates strictly on the active on-court players.
 */
export declare function resolvePossession(ctx: PossessionContext, rng: RNG): Outcome;
//# sourceMappingURL=probability.d.ts.map