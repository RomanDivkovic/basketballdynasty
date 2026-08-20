import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
import { getFatigueMultiplier } from './fatigue';
import * as LeagueTuning from './tuning/leagueTuning';
import type { GameContext } from './gameContext';

export interface FreeThrowState {
  shooterId: string;
  attemptsAwarded: number;
  fouledById: string;
  inBonus: boolean;
}

export interface FreeThrowResult {
  made: number;
  attempts: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isFoulEligible(action: string, shotType: 'inside' | 'midrange' | 'three'): boolean {
  return (
    action === 'drive' ||
    action === 'post-up' ||
    shotType === 'inside' ||
    shotType === 'three'
  );
}

/**
 * Rare foul chance on physical / shooting attempts.
 * Offensive pressure and tired defense increase likelihood; skilled defense reduces it.
 */
export function computeFoulChance(
  action: string,
  shotType: 'inside' | 'midrange' | 'three',
  offender: Player,
  primaryDefender: Player,
  fatigue: Record<string, number>
): number {
  if (!isFoulEligible(action, shotType)) {
    return 0;
  }

  const or = offender.ratings;
  const dr = primaryDefender.ratings;
  const defFatigue = fatigue[primaryDefender.id] ?? 1.0;
  const defFatigueMod = getFatigueMultiplier(defFatigue);

  let foulProb = LeagueTuning.foulBaseRate;

  if (action === 'drive' || action === 'post-up') {
    foulProb += (or.athleticism - 60) * LeagueTuning.foulOffenseAthleticismFactor;
    foulProb += (or.insideScoring - 60) * LeagueTuning.foulOffenseInsideFactor;
  }

  if (shotType === 'inside') {
    foulProb += (or.insideScoring - 60) * LeagueTuning.foulOffenseInsideFactor * 0.85;
    foulProb += (or.athleticism - 60) * LeagueTuning.foulOffenseAthleticismFactor * 0.5;
  }

  if (shotType === 'three') {
    foulProb += (or.threePoint - 60) * LeagueTuning.foulThreeAttemptFactor;
  }

  let defSkill = dr.interiorDefense;
  if (action === 'drive') {
    defSkill = dr.perimeterDefense * 0.62 + dr.interiorDefense * 0.38;
  } else if (shotType === 'three') {
    defSkill = dr.perimeterDefense;
  }

  foulProb -= (defSkill - 60) * LeagueTuning.foulDefenseSkillFactor;
  foulProb += (1 - defFatigueMod) * LeagueTuning.foulFatigueFactor;

  return clamp(foulProb, LeagueTuning.foulProbMin, LeagueTuning.foulProbMax);
}

export function getTeamQuarterFouls(ctx: GameContext, teamId: string, quarter: number): number {
  return ctx.teamFouls[teamId]?.[quarter] ?? 0;
}

export function recordDefensiveFoul(
  ctx: GameContext,
  defendingTeamId: string,
  defenderId: string
): number {
  if (!ctx.teamFouls[defendingTeamId]) {
    ctx.teamFouls[defendingTeamId] = {};
  }
  const quarter = ctx.currentQuarter;
  const updated = (ctx.teamFouls[defendingTeamId][quarter] ?? 0) + 1;
  ctx.teamFouls[defendingTeamId][quarter] = updated;

  ctx.playerFouls[defenderId] = (ctx.playerFouls[defenderId] ?? 0) + 1;

  return updated;
}

export function determineFreeThrowAttempts(
  action: string,
  shotType: 'inside' | 'midrange' | 'three',
  inBonus: boolean
): number {
  if (inBonus) {
    return 2;
  }
  if (shotType === 'three') {
    return 3;
  }
  if (action === 'drive' || action === 'post-up' || shotType === 'inside') {
    return 2;
  }
  return 2;
}

export function resolveFreeThrows(
  shooter: Player,
  attempts: number,
  fatigue: Record<string, number>,
  rng: RNG
): FreeThrowResult {
  const r = shooter.ratings;
  const fatigueFactor = fatigue[shooter.id] ?? 1.0;
  const fatigueMod = getFatigueMultiplier(fatigueFactor);

  let ftProb =
    LeagueTuning.ftBaseRate +
    (r.insideScoring - 60) * LeagueTuning.ftInsideFactor +
    (r.basketballIQ - 60) * LeagueTuning.ftIqFactor;

  ftProb *= 0.94 + fatigueMod * 0.06;
  ftProb = clamp(ftProb, LeagueTuning.ftProbMin, LeagueTuning.ftProbMax);

  let made = 0;
  for (let i = 0; i < attempts; i++) {
    if (rng() < ftProb) {
      made++;
    }
  }

  return { made, attempts };
}

export function formatFreeThrowSuffix(made: number, attempts: number): string {
  if (attempts === 1) {
    return made === 1 ? '1/1 FT' : '0/1 FT';
  }
  return `${made}/${attempts} FT`;
}
