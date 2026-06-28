import { PossessionResult } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
import { selectPrimaryBallHandler, selectShooter } from './playerSelection';
import { chooseOffensiveAction } from './actionSelection';
import {
  chooseDefenseReaction,
  selectPrimaryDefender,
  buildWeightedDefenseLineup,
} from './defenseSelection';
import { resolvePossession, PossessionContext } from './probability';
import { generatePlayDescription } from './playDescription';
import { applyFatigue } from './fatigue';
import { ensurePlayerStats, PlayerGameStats } from './playerStats';
import { GameContext } from './gameContext';

export interface PossessionInput {
  ctx: GameContext;
  rng: RNG;
  /** Accumulator for box score stats (mutated during the possession) */
  playerStats: Record<string, PlayerGameStats>;
}

export function simulatePossession(input: PossessionInput): {
  result: PossessionResult;
  description: string;
  keepPossession: boolean;
} {
  const { ctx, rng, playerStats } = input;
  const offenseTeamId = ctx.offenseTeamId;
  const offensePlayers = ctx.activeLineups.offense.active;
  const defensePlayers = ctx.activeLineups.defense.active;
  const fatigue = ctx.fatigueState;

  if (offensePlayers.length === 0) {
    throw new Error('simulatePossession called with empty offensePlayers');
  }

  const primary = selectPrimaryBallHandler(offensePlayers, rng, fatigue);
  const choice = chooseOffensiveAction(primary, offensePlayers, rng);

  // Catch-and-shoot: best shooter takes the attempt, not always the initiator
  const shooter =
    choice.action === 'catch-and-shoot-three'
      ? selectShooter(offensePlayers, 'three', rng)
      : primary;

  const primaryDefender = selectPrimaryDefender(
    defensePlayers,
    choice.action,
    choice.shotType,
    rng
  );
  const defenseReaction = chooseDefenseReaction(
    choice.action,
    defensePlayers,
    shooter,
    rng,
    choice.shotType,
    primaryDefender
  );
  const weightedDefense = buildWeightedDefenseLineup(primaryDefender, defensePlayers);

  const possCtx: PossessionContext = {
    primaryOffender: shooter,
    offensiveTeamPlayers: offensePlayers,
    defensiveTeamPlayers: weightedDefense,
    fatigue,
    action: choice.action,
    shotType: choice.shotType,
    defenseReaction,
  };

  const outcome = resolvePossession(possCtx, rng);

  const description = generatePlayDescription(
    shooter,
    choice.action,
    defenseReaction,
    outcome.descriptionSuffix,
    outcome.points,
    choice.shotType
  );

  // === Record natural box score stats from this possession ===
  ensurePlayerStats(playerStats, shooter.id);
  const shooterStats = playerStats[shooter.id];
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
      const candidates = offensePlayers.filter((p) => p.id !== shooter.id);
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
  applyFatigue(fatigue, shooter.id, shooter, 1.15);

  // Primary matchup defender works hardest on the possession
  applyFatigue(fatigue, primaryDefender.id, primaryDefender, 0.65);

  const result: PossessionResult = {
    offenseTeamId,
    primaryPlayerId: shooter.id,
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
