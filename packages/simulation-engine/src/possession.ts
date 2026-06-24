import { Player, PossessionResult } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
import { selectPrimaryBallHandler } from './playerSelection';
import { chooseOffensiveAction } from './actionSelection';
import { chooseDefenseReaction } from './defenseSelection';
import { resolvePossession, PossessionContext } from './probability';
import { generatePlayDescription } from './playDescription';
import { applyFatigue } from './fatigue';
import { ensurePlayerStats, PlayerGameStats } from './playerStats';

export interface PossessionInput {
  /** Team id of the offense (for result tracking) */
  offenseTeamId: string;
  /** The 5 active players on offense for this possession */
  offensePlayers: Player[];
  /** The 5 active players on defense for this possession */
  defensePlayers: Player[];
  fatigue: Record<string, number>;
  rng: RNG;
  /** Accumulator for box score stats (mutated during the possession) */
  playerStats: Record<string, PlayerGameStats>;
}

export function simulatePossession(input: PossessionInput): {
  result: PossessionResult;
  description: string;
  keepPossession: boolean;
} {
  const { offenseTeamId, offensePlayers, defensePlayers, fatigue, rng, playerStats } = input;

  if (offensePlayers.length === 0) {
    throw new Error('simulatePossession called with empty offensePlayers');
  }

  const primary = selectPrimaryBallHandler(offensePlayers, rng);
  const choice = chooseOffensiveAction(primary, offensePlayers, rng);
  const defenseReaction = chooseDefenseReaction(choice.action, defensePlayers, primary, rng);

  const ctx: PossessionContext = {
    primaryOffender: primary,
    offensiveTeamPlayers: offensePlayers,
    defensiveTeamPlayers: defensePlayers,
    fatigue,
    action: choice.action,
    shotType: choice.shotType,
    defenseReaction,
  };

  const outcome = resolvePossession(ctx, rng);

  const description = generatePlayDescription(
    primary,
    choice.action,
    defenseReaction,
    outcome.descriptionSuffix,
    outcome.points,
    choice.shotType
  );

  // === Record natural box score stats from this possession ===
  ensurePlayerStats(playerStats, primary.id);
  const shooterStats = playerStats[primary.id];
  const isThree = choice.shotType === 'three';

  // Every non-turnover possession that reaches a shot decision counts as a field goal attempt
  // (turnovers are already branched before shot attempt in resolve)
  if (!outcome.turnover) {
    shooterStats.fieldGoalsAttempted += 1;
    if (isThree) {
      shooterStats.threePointersAttempted += 1;
    }
  }

  if (outcome.made) {
    shooterStats.fieldGoalsMade += 1;
    if (isThree) {
      shooterStats.threePointersMade += 1;
    }
    shooterStats.points += outcome.points;

    // Assist: on made baskets, often created by teammate (pick-and-roll, drive, post, etc.)
    if (offensePlayers.length > 1 && rng() < 0.58) {
      const candidates = offensePlayers.filter((p) => p.id !== primary.id);
      if (candidates.length > 0) {
        const assister = candidates[Math.floor(rng() * candidates.length)];
        ensurePlayerStats(playerStats, assister.id);
        playerStats[assister.id].assists += 1;
      }
    }
  }

  if (outcome.turnover) {
    shooterStats.turnovers += 1;
  }

  // Rebound on misses (not turnovers)
  if (!outcome.made && !outcome.turnover) {
    const pool = outcome.offensiveRebound ? offensePlayers : defensePlayers;
    if (pool.length > 0) {
      const reb = pool[Math.floor(rng() * pool.length)];
      ensurePlayerStats(playerStats, reb.id);
      playerStats[reb.id].rebounds += 1;
    }
  }

  // Apply block credit if the outcome carried one
  if (outcome.blockBy) {
    ensurePlayerStats(playerStats, outcome.blockBy);
    playerStats[outcome.blockBy].blocks += 1;
  }

  // Apply steal credit if the outcome carried one
  if (outcome.stealBy) {
    ensurePlayerStats(playerStats, outcome.stealBy);
    playerStats[outcome.stealBy].steals += 1;
  }

  // Apply fatigue to primary ball handler (high usage)
  applyFatigue(fatigue, primary.id, primary, 1.15);

  // Lightly fatigue one random on-court defender
  if (defensePlayers.length > 0) {
    const randomDefender = defensePlayers[Math.floor(rng() * defensePlayers.length)];
    applyFatigue(fatigue, randomDefender.id, randomDefender, 0.55);
  }

  const result: PossessionResult = {
    offenseTeamId,
    primaryPlayerId: primary.id,
    action: choice.action,
    defenseReaction,
    description,
    points: outcome.points,
    turnover: outcome.turnover,
    offensiveRebound: outcome.offensiveRebound,
  };

  return {
    result,
    description,
    keepPossession: outcome.offensiveRebound,
  };
}

