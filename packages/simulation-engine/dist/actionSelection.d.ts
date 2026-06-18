import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
export type OffensiveAction = 'post-up' | 'drive' | 'midrange-jumper' | 'catch-and-shoot-three' | 'isolation' | 'pick-and-roll';
export interface ActionChoice {
    action: OffensiveAction;
    shotType: 'inside' | 'midrange' | 'three';
}
export declare function chooseOffensiveAction(primaryPlayer: Player, teamPlayers: Player[], rng: RNG): ActionChoice;
//# sourceMappingURL=actionSelection.d.ts.map