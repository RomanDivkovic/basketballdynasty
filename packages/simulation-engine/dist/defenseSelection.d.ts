import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
export type DefenseReaction = 'switch' | 'drop' | 'double-team' | 'close-out' | 'help-defense' | 'stay-home';
/**
 * Choose defensive reaction using ONLY the active on-court defenders.
 */
export declare function chooseDefenseReaction(offenseAction: string, defensivePlayers: Player[], primaryOffender: Player, rng: RNG): DefenseReaction;
//# sourceMappingURL=defenseSelection.d.ts.map