import { Team, GameResult, PossessionResult } from '@basketball-dynasty/shared-types';
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

export interface SimulateGameOptions {
  totalPossessions?: number;
  seed?: number;
  /** Possessions between rotation checks. Lower = more frequent subs. */
  rotationInterval?: number;
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

  while (possessionIndex < totalPossessions) {
    // Run the possession using ONLY the current active 5 on each side
    const { result, keepPossession } = simulatePossession({
      offenseTeamId: offenseState.teamId,
      offensePlayers: offenseState.active,
      defensePlayers: defenseState.active,
      fatigue,
      rng,
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

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    finalScoreA: scoreA,
    finalScoreB: scoreB,
    possessions,
    pointsScored,
  };
}

