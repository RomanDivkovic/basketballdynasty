import { Player, PossessionResult } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
export interface PossessionInput {
    /** Team id of the offense (for result tracking) */
    offenseTeamId: string;
    /** The 5 active players on offense for this possession */
    offensePlayers: Player[];
    /** The 5 active players on defense for this possession */
    defensePlayers: Player[];
    fatigue: Record<string, number>;
    rng: RNG;
}
export declare function simulatePossession(input: PossessionInput): {
    result: PossessionResult;
    description: string;
    keepPossession: boolean;
};
//# sourceMappingURL=possession.d.ts.map