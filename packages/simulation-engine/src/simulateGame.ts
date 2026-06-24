import type { Team, PossessionResult, GameResult as BaseGameResult } from '@basketball-dynasty/shared-types';
import { createRNG, RNG, defaultRNG } from './rng';
import {
  createInitialFatigue,
  drainCourtFatigue,
  recoverBenchFatigue,
} from './fatigue';
import { simulatePossession } from './possession';
import {
  createInitialRotationState,
  TeamRotationState,
  considerRotations,
  RotationConfig,
  DEFAULT_ROTATION_CONFIG,
} from './lineup';
import {
  PlayerGameStats,
  createEmptyPlayerGameStats,
  computeMinutesPlayed,
} from './playerStats';

export interface SimulateGameOptions {
  totalPossessions?: number;
  seed?: number;
  /** Possessions between rotation checks. Lower = more frequent subs. */
  rotationInterval?: number;
}

/**
 * Extended GameResult produced by the simulation engine.
 * Adds rich per-player box score stats generated naturally during play.
 */
export interface GameResult extends BaseGameResult {
  playerStats: Record<string, PlayerGameStats>;
}

export function simulateGame(
  teamA: Team,
  teamB: Team,
  options: SimulateGameOptions = {}
): GameResult {
  const totalPossessions = options.totalPossessions ?? 200;
  const rng: RNG = options.seed !== undefined ? createRNG(options.seed) : defaultRNG;

  // Rotation config (simple for Phase 2A)
  const rotationConfig: RotationConfig = {
    ...DEFAULT_ROTATION_CONFIG,
    interval: options.rotationInterval ?? DEFAULT_ROTATION_CONFIG.interval,
  };

  // Fatigue for ALL players (starters + bench)
  const allPlayers = [...teamA.players, ...teamB.players];
  const fatigue = createInitialFatigue(allPlayers);

  // Rotation state per team (manages active 5 vs bench)
  const teamAState = createInitialRotationState(teamA);
  const teamBState = createInitialRotationState(teamB);

  const possessions: PossessionResult[] = [];
  let scoreA = 0;
  let scoreB = 0;
  let possessionIndex = 0;

  // Start with teamA on offense
  let offenseState: TeamRotationState = teamAState;
  let defenseState: TeamRotationState = teamBState;

  const pointsScored: Record<string, number> = {};
  const initPoints = (pid: string) => {
    if (pointsScored[pid] === undefined) pointsScored[pid] = 0;
  };
  allPlayers.forEach((p) => initPoints(p.id));

  // Box score stats - initialized for every player on the rosters
  const playerStats: Record<string, PlayerGameStats> = {};
  allPlayers.forEach((p) => {
    playerStats[p.id] = createEmptyPlayerGameStats();
  });

  // Track how many possessions each player was on the court for (both ends)
  const onCourtPossessions: Record<string, number> = {};

  while (possessionIndex < totalPossessions) {
    // Track participation for minutesPlayed (before the possession executes)
    const activeThisPoss = [...offenseState.active, ...defenseState.active];
    activeThisPoss.forEach((p) => {
      onCourtPossessions[p.id] = (onCourtPossessions[p.id] ?? 0) + 1;
    });

    // Run the possession using ONLY the current active 5 on each side.
    // Stats are recorded naturally inside simulatePossession.
    const { result, keepPossession } = simulatePossession({
      offenseTeamId: offenseState.teamId,
      offensePlayers: offenseState.active,
      defensePlayers: defenseState.active,
      fatigue,
      rng,
      playerStats,
    });

    possessions.push(result);

    // Update score
    if (offenseState.teamId === teamA.id) {
      scoreA += result.points;
    } else {
      scoreB += result.points;
    }

    if (result.points > 0 && result.primaryPlayerId) {
      pointsScored[result.primaryPlayerId] =
        (pointsScored[result.primaryPlayerId] || 0) + result.points;
    }

    // === Fatigue management for this possession ===
    // Offense drains harder, defense drains lighter
    drainCourtFatigue(fatigue, offenseState.active, 1.0);
    drainCourtFatigue(fatigue, defenseState.active, 0.65);

    // Recover everyone on the bench for both teams
    recoverBenchFatigue(fatigue, offenseState.bench);
    recoverBenchFatigue(fatigue, defenseState.bench);

    possessionIndex++;

    // === Rotation checks (every N possessions) ===
    if (possessionIndex % rotationConfig.interval === 0) {
      considerRotations(offenseState, fatigue, rng, rotationConfig);
      considerRotations(defenseState, fatigue, rng, rotationConfig);
    }

    // Alternate possession unless offensive rebound
    if (!keepPossession) {
      const tmp = offenseState;
      offenseState = defenseState;
      defenseState = tmp;
    }
    // keepPossession: same offense keeps the ball with current active 5
  }

  // Finalize minutesPlayed from participation counts (deterministic mapping)
  const totalPossForTime = possessions.length;
  Object.keys(playerStats).forEach((pid) => {
    const part = onCourtPossessions[pid] ?? 0;
    playerStats[pid].minutesPlayed = computeMinutesPlayed(part, totalPossForTime);
  });

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    finalScoreA: scoreA,
    finalScoreB: scoreB,
    possessions,
    pointsScored,
    playerStats,
  };
}

