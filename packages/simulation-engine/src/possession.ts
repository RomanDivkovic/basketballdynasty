import { Player, PossessionResult } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';
import { selectPrimaryBallHandler } from './playerSelection';
import { chooseOffensiveAction } from './actionSelection';
import { chooseDefenseReaction } from './defenseSelection';
import { resolvePossession, PossessionContext } from './probability';
import { generatePlayDescription } from './playDescription';
import { applyFatigue } from './fatigue';

export interface PossessionInput {
  /** Team id of the offense (for result tracking) */
  offenseTeamId: string;
  /** The 5 active players on offense for this possession */
  offensePlayers: Player[];
  /** The 5 active players on defense for this possession */
  defensePlayers: Player[];
  fatigue: Record<string, number>;
  rng: RNG;
}

export function simulatePossession(input: PossessionInput): {
  result: PossessionResult;
  description: string;
  keepPossession: boolean;
} {
  const { offenseTeamId, offensePlayers, defensePlayers, fatigue, rng } = input;

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

