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
export function createDefaultLineup(team: Team): Lineup {
  const players = [...team.players];
  const starters = players.slice(0, 5);
  const bench = players.slice(5);
  return { starters, bench };
}

export interface TeamRotationState {
  teamId: string;
  /** All players belonging to this team (for reference) */
  allPlayers: Player[];
  /** Currently active 5 (or fewer if team is short-handed) */
  active: Player[];
  /** Currently benched players */
  bench: Player[];
}

export function createInitialRotationState(team: Team): TeamRotationState {
  const lineup = createDefaultLineup(team);
  return {
    teamId: team.id,
    allPlayers: [...team.players],
    active: [...lineup.starters],
    bench: [...lineup.bench],
  };
}

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

export const DEFAULT_ROTATION_CONFIG: RotationConfig = {
  interval: 15,
  fatigueSubThreshold: 0.82,
  maxSwapsPerCheck: 2,
};

/**
 * Perform fatigue-based substitutions for a single team.
 * Purely fatigue driven + seeded RNG for determinism.
 * Returns number of swaps performed.
 */
export function considerRotations(
  state: TeamRotationState,
  fatigue: Record<string, number>,
  rng: RNG,
  config: RotationConfig = DEFAULT_ROTATION_CONFIG
): number {
  if (state.bench.length === 0 || state.active.length === 0) {
    return 0;
  }

  // Identify tired players on court
  const tiredOnCourt = state.active
    .filter((p) => (fatigue[p.id] ?? 1.0) < config.fatigueSubThreshold)
    .sort((a, b) => (fatigue[a.id] ?? 1) - (fatigue[b.id] ?? 1)); // most tired first

  if (tiredOnCourt.length === 0) {
    return 0;
  }

  // Best rested on bench (highest fatigue value = least tired)
  const restedBench = [...state.bench].sort(
    (a, b) => (fatigue[b.id] ?? 1) - (fatigue[a.id] ?? 1)
  );

  let swaps = 0;
  const maxSwaps = Math.min(config.maxSwapsPerCheck, tiredOnCourt.length, restedBench.length);

  for (let i = 0; i < maxSwaps; i++) {
    const tired = tiredOnCourt[i];
    const fresh = restedBench[i];
    if (!fresh) break;

    const tiredFat = fatigue[tired.id] ?? 1.0;
    const freshFat = fatigue[fresh.id] ?? 1.0;

    // Only swap if the bench player is meaningfully fresher
    if (freshFat > tiredFat + 0.025) {
      // Swap them
      state.active = state.active.map((p) => (p.id === tired.id ? fresh : p));
      state.bench = state.bench.map((p) => (p.id === fresh.id ? tired : p));
      swaps++;
    }
  }

  return swaps;
}
