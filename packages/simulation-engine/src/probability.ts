import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
import { getFatigueMultiplier } from './fatigue';

export interface PossessionContext {
  primaryOffender: Player;
  /** Exactly the 5 (or fewer) players currently on court for offense */
  offensiveTeamPlayers: Player[];
  /** Exactly the 5 (or fewer) players currently on court for defense */
  defensiveTeamPlayers: Player[];
  fatigue: Record<string, number>;
  action: string;
  shotType: 'inside' | 'midrange' | 'three';
  defenseReaction: string;
}

export interface Outcome {
  made: boolean;
  points: number;
  turnover: boolean;
  offensiveRebound: boolean;
  descriptionSuffix: string;
  // Natural stat events emerging from the possession
  blockBy?: string; // playerId of the defender who blocked the shot
  stealBy?: string; // playerId of the defender who stole the ball on turnover
}

/**
 * Core probability engine.
 * Returns a realistic outcome for the possession.
 * Now operates strictly on the active on-court players.
 */
export function resolvePossession(ctx: PossessionContext, rng: RNG): Outcome {
  const { primaryOffender, defensiveTeamPlayers, fatigue, action, shotType, defenseReaction } = ctx;

  const r = primaryOffender.ratings;
  const fatigueFactor = fatigue[primaryOffender.id] ?? 1.0;
  const fatigueMod = getFatigueMultiplier(fatigueFactor);

  // Base skill rating for the shot type
  let skill = 50;
  if (shotType === 'inside') skill = r.insideScoring;
  if (shotType === 'midrange') skill = r.midrange;
  if (shotType === 'three') skill = r.threePoint;

  // Defense aggregate — only from players ON THE COURT, adjusted by their fatigue
  const effectiveDefenders = defensiveTeamPlayers.map((p) => {
    const f = fatigue[p.id] ?? 1.0;
    const fm = getFatigueMultiplier(f);
    return {
      interior: p.ratings.interiorDefense * fm,
      perimeter: p.ratings.perimeterDefense * fm,
      rebound: p.ratings.rebounding * fm,
    };
  });

  const avgInterior = average(effectiveDefenders.map((d) => d.interior));
  const avgPerimeter = average(effectiveDefenders.map((d) => d.perimeter));

  // Defense modifier (higher defense = lower make chance)
  let defenseMod = 0;
  if (shotType === 'inside') defenseMod = (avgInterior - 60) * 0.45;
  if (shotType === 'midrange') defenseMod = (avgPerimeter - 60) * 0.4;
  if (shotType === 'three') defenseMod = (avgPerimeter - 60) * 0.35;

  // Action & IQ modifiers
  let actionMod = 0;
  if (action === 'post-up') actionMod = r.basketballIQ * 0.15 + r.athleticism * 0.1;
  if (action === 'drive') actionMod = r.athleticism * 0.2 + r.ballHandling * 0.1;
  if (action === 'pick-and-roll') actionMod = r.passing * 0.15 + r.basketballIQ * 0.1;

  // Reaction penalty/bonus
  let reactionMod = 0;
  if (defenseReaction === 'double-team') reactionMod = -8;
  if (defenseReaction === 'close-out') reactionMod = -4;
  if (defenseReaction === 'help-defense') reactionMod = -2;
  if (defenseReaction === 'stay-home') reactionMod = 2;

  // Compute raw make probability (before variance)
  let makeProb = (skill - 30) / 70;
  makeProb = makeProb * 0.9 + 0.18;
  makeProb += (actionMod + reactionMod - defenseMod) / 100;
  makeProb *= fatigueMod;

  // Clamp
  makeProb = Math.max(0.18, Math.min(0.92, makeProb));

  // Turnover chance (higher with poor ball handling / high pressure)
  let turnoverProb = 0.06;
  if (action === 'drive' || action === 'isolation') {
    turnoverProb = 0.09 + (70 - r.ballHandling) / 400;
  }
  if (defenseReaction === 'double-team') turnoverProb += 0.04;
  turnoverProb = Math.min(0.18, turnoverProb);

  // First decide if turnover
  if (rng() < turnoverProb) {
    let stealBy: string | undefined;
    if (defensiveTeamPlayers.length > 0 && rng() < 0.42) {
      const idx = Math.floor(rng() * defensiveTeamPlayers.length);
      stealBy = defensiveTeamPlayers[idx].id;
    }
    return {
      made: false,
      points: 0,
      turnover: true,
      offensiveRebound: false,
      descriptionSuffix: 'turnover',
      stealBy,
    };
  }

  // Check for block on inside-oriented attempts (before final make roll)
  let blockBy: string | undefined;
  const canBeBlocked = shotType === 'inside' || action === 'drive' || action === 'post-up';
  if (canBeBlocked && defensiveTeamPlayers.length > 0 && rng() < 0.038) {
    const idx = Math.floor(rng() * defensiveTeamPlayers.length);
    blockBy = defensiveTeamPlayers[idx].id;
  }

  // Roll for make/miss with variance
  const variance = (rng() - 0.5) * 0.22;
  const finalProb = Math.max(0.12, Math.min(0.95, makeProb + variance));

  let made = rng() < finalProb;

  // Apply block if rolled (forces miss)
  if (blockBy) {
    made = false;
  }

  if (made) {
    const points = shotType === 'three' ? 3 : 2;
    return {
      made: true,
      points,
      turnover: false,
      offensiveRebound: false,
      descriptionSuffix: 'GOOD',
      blockBy: undefined,
      stealBy: undefined,
    };
  }

  // Miss -> check offensive rebound (slightly fatigue-affected)
  const offRebFatigue = getFatigueMultiplier(fatigue[primaryOffender.id] ?? 1.0);
  const offRebRating = r.rebounding;
  const offRebChance = ((offRebRating * offRebFatigue) / 120) * 0.32 + 0.08;
  const offensiveRebound = rng() < offRebChance;

  return {
    made: false,
    points: 0,
    turnover: false,
    offensiveRebound,
    descriptionSuffix: offensiveRebound ? 'miss, offensive rebound' : 'miss',
    blockBy,
    stealBy: undefined,
  };
}

function average(nums: number[]): number {
  if (nums.length === 0) return 60;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

