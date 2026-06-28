import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';

export type DefenseReaction =
  | 'switch'
  | 'drop'
  | 'double-team'
  | 'close-out'
  | 'help-defense'
  | 'stay-home';

function pickWeightedDefender(players: Player[], weights: number[], rng: RNG): Player {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;

  for (let i = 0; i < players.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      return players[i];
    }
  }
  return players[players.length - 1];
}

/**
 * Select the primary on-ball defender for the possession.
 * Matchup selection depends on the offensive action / shot type.
 */
export function selectPrimaryDefender(
  defensivePlayers: Player[],
  offenseAction: string,
  shotType: 'inside' | 'midrange' | 'three',
  rng: RNG
): Player {
  if (defensivePlayers.length === 0) {
    throw new Error('Cannot select defender from empty lineup');
  }

  const weights = defensivePlayers.map((p) => {
    const r = p.ratings;

    if (shotType === 'inside' || offenseAction === 'post-up' || offenseAction === 'drive') {
      return Math.pow(
        Math.max(1, r.interiorDefense * 0.52 + r.blocks * 0.23 + r.athleticism * 0.25),
        1.5
      );
    }

    if (shotType === 'three' || offenseAction === 'catch-and-shoot-three') {
      return Math.pow(
        Math.max(1, r.perimeterDefense * 0.62 + r.athleticism * 0.23 + r.steals * 0.15),
        1.5
      );
    }

    // Midrange / mixed actions
    return Math.pow(
      Math.max(
        1,
        r.perimeterDefense * 0.42 + r.interiorDefense * 0.33 + r.athleticism * 0.25
      ),
      1.45
    );
  });

  return pickWeightedDefender(defensivePlayers, weights, rng);
}

/**
 * Build a defense array weighted toward the primary matchup defender.
 * probability.ts averages all defenders — repeating the primary skews that average
 * without modifying the probability engine.
 */
export function buildWeightedDefenseLineup(
  primaryDefender: Player,
  allDefenders: Player[],
  primaryWeight = 3
): Player[] {
  const weighted: Player[] = [];
  for (let i = 0; i < primaryWeight; i++) {
    weighted.push(primaryDefender);
  }
  for (const p of allDefenders) {
    if (p.id !== primaryDefender.id) {
      weighted.push(p);
    }
  }
  return weighted;
}

/**
 * Choose defensive reaction using the primary matchup defender's profile.
 */
export function chooseDefenseReaction(
  offenseAction: string,
  defensivePlayers: Player[],
  primaryOffender: Player,
  rng: RNG,
  shotType: 'inside' | 'midrange' | 'three' = 'midrange',
  primaryDefender?: Player
): DefenseReaction {
  if (defensivePlayers.length === 0) return 'stay-home';

  const defender =
    primaryDefender ??
    selectPrimaryDefender(defensivePlayers, offenseAction, shotType, rng);
  const r = defender.ratings;

  const interior = r.interiorDefense;
  const perimeter = r.perimeterDefense;

  if (offenseAction === 'post-up' || offenseAction === 'drive') {
    if (interior > 74 && rng() < 0.38) return 'double-team';
    if (rng() < 0.52) return 'help-defense';
    return 'switch';
  }

  if (offenseAction === 'catch-and-shoot-three') {
    if (perimeter > 72 && rng() < 0.62) return 'close-out';
    return rng() < 0.5 ? 'stay-home' : 'switch';
  }

  if (offenseAction === 'midrange-jumper' || offenseAction === 'isolation') {
    if (rng() < 0.32) return 'switch';
    if (rng() < 0.52) return 'drop';
    return 'help-defense';
  }

  if (offenseAction === 'pick-and-roll') {
    return rng() < 0.55 ? 'switch' : 'drop';
  }

  return rng() < 0.5 ? 'switch' : 'help-defense';
}
