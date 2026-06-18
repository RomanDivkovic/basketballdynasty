import { Player } from '@basketball-dynasty/shared-types';
export declare function createInitialFatigue(players: Player[]): Record<string, number>;
/**
 * Apply fatigue drain to a player who is on the court.
 * Higher intensity for primary ball handlers / high usage.
 */
export declare function applyFatigue(fatigue: Record<string, number>, playerId: string, player: Player, intensity?: number): void;
/**
 * Recover fatigue for a player who is resting on the bench.
 * Recovery is slower than drain and stamina helps recovery speed.
 */
export declare function recoverFatigue(fatigue: Record<string, number>, playerId: string, player: Player, intensity?: number): void;
export declare function getFatigueMultiplier(fatigueFactor: number): number;
/**
 * Helper to drain fatigue for all players currently on court.
 */
export declare function drainCourtFatigue(fatigue: Record<string, number>, players: Player[], baseIntensity: number): void;
/**
 * Helper to recover all players currently on the bench.
 */
export declare function recoverBenchFatigue(fatigue: Record<string, number>, players: Player[]): void;
//# sourceMappingURL=fatigue.d.ts.map