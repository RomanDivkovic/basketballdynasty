import { Player, Team } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
export interface Lineup {
    starters: Player[];
    bench: Player[];
}
/**
 * Creates an initial lineup from a team.
 * - First 5 players become starters (order as provided in team.players)
 * - Remaining become bench.
 * Teams with <= 5 players have empty bench (no rotation possible).
 */
export declare function createDefaultLineup(team: Team): Lineup;
export interface TeamRotationState {
    teamId: string;
    /** All players belonging to this team (for reference) */
    allPlayers: Player[];
    /** Currently active 5 (or fewer if team is short-handed) */
    active: Player[];
    /** Currently benched players */
    bench: Player[];
}
export declare function createInitialRotationState(team: Team): TeamRotationState;
/**
 * Rotation configuration.
 */
export interface RotationConfig {
    /** How often to consider substitutions (in possessions) */
    interval: number;
    /** Fatigue threshold below which a player becomes a candidate to come out */
    fatigueSubThreshold: number;
    /** Max number of players to sub at once */
    maxSwapsPerCheck: number;
}
export declare const DEFAULT_ROTATION_CONFIG: RotationConfig;
/**
 * Perform fatigue-based substitutions for a single team.
 * Purely fatigue driven + seeded RNG for determinism.
 * Returns number of swaps performed.
 */
export declare function considerRotations(state: TeamRotationState, fatigue: Record<string, number>, rng: RNG, config?: RotationConfig): number;
//# sourceMappingURL=lineup.d.ts.map