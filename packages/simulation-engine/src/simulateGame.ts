import type { Team, PossessionResult, GameResult as BaseGameResult } from '@basketball-dynasty/shared-types';
import { createRNG, RNG, defaultRNG } from './rng';
import {
  drainCourtFatigue,
  recoverBenchFatigue,
} from './fatigue';
import { simulatePossession } from './possession';
import {
  considerRotations,
  RotationConfig,
  DEFAULT_ROTATION_CONFIG,
} from './lineup';
import {
  PlayerGameStats,
  createEmptyPlayerGameStats,
  computeMinutesPlayed,
} from './playerStats';
import { createGameContext, swapPossession } from './gameContext';
import { advanceClock } from './gameClock';

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
  // Isolated stream so clock ticks do not alter gameplay RNG sequence or scores
  const clockRng: RNG =
    options.seed !== undefined ? createRNG(options.seed + 0xc10c) : createRNG(8675309);

  const rotationConfig: RotationConfig = {
    ...DEFAULT_ROTATION_CONFIG,
    interval: options.rotationInterval ?? DEFAULT_ROTATION_CONFIG.interval,
  };

  const ctx = createGameContext(teamA, teamB, totalPossessions);

  const allPlayers = [...teamA.players, ...teamB.players];
  const possessions: PossessionResult[] = [];

  const pointsScored: Record<string, number> = {};
  const initPoints = (pid: string) => {
    if (pointsScored[pid] === undefined) pointsScored[pid] = 0;
  };
  allPlayers.forEach((p) => initPoints(p.id));

  const playerStats: Record<string, PlayerGameStats> = {};
  allPlayers.forEach((p) => {
    playerStats[p.id] = createEmptyPlayerGameStats();
  });

  const onCourtPossessions: Record<string, number> = {};

  while (ctx.currentPossession < ctx.totalPossessions) {
    const { offense, defense } = ctx.activeLineups;

    // Track participation for minutesPlayed (before the possession executes)
    const activeThisPoss = [...offense.active, ...defense.active];
    activeThisPoss.forEach((p) => {
      onCourtPossessions[p.id] = (onCourtPossessions[p.id] ?? 0) + 1;
    });

    const { result, keepPossession } = simulatePossession({
      ctx,
      rng,
      playerStats,
    });

    possessions.push(result);

    if (ctx.offenseTeamId === teamA.id) {
      ctx.scoreA += result.points;
    } else {
      ctx.scoreB += result.points;
    }

    if (result.points > 0 && result.primaryPlayerId) {
      pointsScored[result.primaryPlayerId] =
        (pointsScored[result.primaryPlayerId] || 0) + result.points;
    }

    drainCourtFatigue(ctx.fatigueState, offense.active, 1.0);
    drainCourtFatigue(ctx.fatigueState, defense.active, 0.65);

    recoverBenchFatigue(ctx.fatigueState, offense.bench);
    recoverBenchFatigue(ctx.fatigueState, defense.bench);

    ctx.currentPossession++;

    advanceClock(ctx, clockRng);

    if (ctx.currentPossession % rotationConfig.interval === 0) {
      considerRotations(offense, ctx.fatigueState, rng, rotationConfig);
      considerRotations(defense, ctx.fatigueState, rng, rotationConfig);
    }

    if (!keepPossession) {
      swapPossession(ctx);
    }
  }

  const totalPossForTime = possessions.length;
  Object.keys(playerStats).forEach((pid) => {
    const part = onCourtPossessions[pid] ?? 0;
    playerStats[pid].minutesPlayed = computeMinutesPlayed(part, totalPossForTime);
  });

  return {
    teamAId: teamA.id,
    teamBId: teamB.id,
    finalScoreA: ctx.scoreA,
    finalScoreB: ctx.scoreB,
    possessions,
    pointsScored,
    playerStats,
  };
}
