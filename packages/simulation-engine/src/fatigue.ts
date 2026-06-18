import { Player } from '@basketball-dynasty/shared-types';

const FATIGUE_DECAY_BASE = 0.009;
const MIN_FATIGUE_FACTOR = 0.62;
const RECOVERY_RATE = 0.0035;

export function createInitialFatigue(players: Player[]): Record<string, number> {
  const fatigue: Record<string, number> = {};
  for (const p of players) {
    fatigue[p.id] = 1.0;
  }
  return fatigue;
}

/**
 * Apply fatigue drain to a player who is on the court.
 * Higher intensity for primary ball handlers / high usage.
 */
export function applyFatigue(
  fatigue: Record<string, number>,
  playerId: string,
  player: Player,
  intensity: number = 1.0
): void {
  const stamina = player.ratings.stamina;
  const staminaFactor = 0.55 + (stamina / 100) * 0.9;
  const decay = FATIGUE_DECAY_BASE * intensity / staminaFactor;

  const current = fatigue[playerId] ?? 1.0;
  const next = Math.max(MIN_FATIGUE_FACTOR, current - decay);
  fatigue[playerId] = next;
}

/**
 * Recover fatigue for a player who is resting on the bench.
 * Recovery is slower than drain and stamina helps recovery speed.
 */
export function recoverFatigue(
  fatigue: Record<string, number>,
  playerId: string,
  player: Player,
  intensity: number = 1.0
): void {
  const stamina = player.ratings.stamina;
  const staminaFactor = 0.65 + (stamina / 100) * 0.7;
  const recovery = RECOVERY_RATE * intensity * staminaFactor;

  const current = fatigue[playerId] ?? 1.0;
  fatigue[playerId] = Math.min(1.0, current + recovery);
}

export function getFatigueMultiplier(fatigueFactor: number): number {
  // 1.0 fresh -> 1.0
  // 0.62 very tired -> ~0.86 performance
  return 0.74 + fatigueFactor * 0.26;
}

/**
 * Helper to drain fatigue for all players currently on court.
 */
export function drainCourtFatigue(
  fatigue: Record<string, number>,
  players: Player[],
  baseIntensity: number
): void {
  for (const p of players) {
    applyFatigue(fatigue, p.id, p, baseIntensity);
  }
}

/**
 * Helper to recover all players currently on the bench.
 */
export function recoverBenchFatigue(
  fatigue: Record<string, number>,
  players: Player[]
): void {
  for (const p of players) {
    recoverFatigue(fatigue, p.id, p, 1.0);
  }
}

