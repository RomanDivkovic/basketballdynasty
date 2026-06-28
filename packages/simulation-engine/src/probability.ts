import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
import { getFatigueMultiplier } from './fatigue';
import * as LeagueTuning from './tuning/leagueTuning';

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

  // Base make probability derived from skill (tuned league constants)
  let baseProb = (skill - LeagueTuning.baseSkillOffset) / LeagueTuning.baseSkillScale;
  let makeProb = baseProb * LeagueTuning.baseCompression + LeagueTuning.baseShotSuccess;

  // Three pointers are structurally harder
  if (shotType === 'three') {
    makeProb *= LeagueTuning.threePointMultiplier;
  }

  // Defense modifier (higher defense = lower make chance)
  const defBaseline = 63;
  let defenseMod = 0;
  if (shotType === 'inside') {
    defenseMod = (avgInterior - defBaseline) * LeagueTuning.defenseImpactFactor * 0.011;
  } else if (shotType === 'midrange') {
    defenseMod = (avgPerimeter - defBaseline) * LeagueTuning.defenseImpactFactor * 0.010;
  } else {
    defenseMod = (avgPerimeter - defBaseline) * LeagueTuning.defenseImpactFactor * 0.0095;
  }

  // Action & IQ modifiers (scaled to prevent excessive boost)
  const ams = LeagueTuning.actionModScale;
  let actionMod = 0;
  if (action === 'post-up') actionMod = (r.basketballIQ * 0.15 + r.athleticism * 0.1) * ams;
  if (action === 'drive') actionMod = (r.athleticism * 0.2 + r.ballHandling * 0.1) * ams;
  if (action === 'pick-and-roll') actionMod = (r.passing * 0.15 + r.basketballIQ * 0.1) * ams;

  // Reaction penalty/bonus (tuned coverage effects)
  let reactionMod = 0;
  if (defenseReaction === 'double-team') reactionMod = LeagueTuning.reactionDoubleTeam;
  if (defenseReaction === 'close-out') reactionMod = LeagueTuning.reactionCloseOut;
  if (defenseReaction === 'help-defense') reactionMod = LeagueTuning.reactionHelpDefense;
  if (defenseReaction === 'stay-home') reactionMod = LeagueTuning.reactionStayHome;

  // Combine mods
  makeProb += (actionMod + reactionMod - defenseMod) / 100;

  // Apply fatigue with configurable impact strength
  const fatigueEffect = 1 - (1 - fatigueMod) * LeagueTuning.fatigueImpactFactor;
  makeProb *= fatigueEffect;

  // Clamp raw probability
  makeProb = Math.max(LeagueTuning.rawMakeProbMin, Math.min(LeagueTuning.rawMakeProbMax, makeProb));

  // Turnover chance (higher with poor ball handling / high pressure)
  let turnoverProb = LeagueTuning.turnoverBase;
  if (action === 'drive' || action === 'isolation') {
    turnoverProb = LeagueTuning.turnoverBase + LeagueTuning.turnoverDriveIsoExtra + (70 - r.ballHandling) / 420;
  }
  if (defenseReaction === 'double-team') turnoverProb += LeagueTuning.turnoverDoubleTeamExtra;
  turnoverProb = Math.min(LeagueTuning.turnoverMax, turnoverProb);

  // First decide if turnover
  if (rng() < turnoverProb) {
    let stealBy: string | undefined;
    if (defensiveTeamPlayers.length > 0 && rng() < LeagueTuning.stealOnTurnoverRate) {
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
  if (canBeBlocked && defensiveTeamPlayers.length > 0 && rng() < LeagueTuning.blockBaseRate) {
    const idx = Math.floor(rng() * defensiveTeamPlayers.length);
    blockBy = defensiveTeamPlayers[idx].id;
  }

  // Roll for make/miss with variance
  const variance = (rng() - 0.5) * LeagueTuning.varianceLevel;
  const finalProb = Math.max(LeagueTuning.finalMakeProbMin, Math.min(LeagueTuning.finalMakeProbMax, makeProb + variance));

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
  const offRebChance =
    ((offRebRating * offRebFatigue) / LeagueTuning.offReboundSkillDivisor) *
      LeagueTuning.offReboundBaseRate +
    LeagueTuning.offReboundFloor;
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

