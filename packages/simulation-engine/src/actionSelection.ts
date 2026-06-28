import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';

export type OffensiveAction =
  | 'post-up'
  | 'drive'
  | 'midrange-jumper'
  | 'catch-and-shoot-three'
  | 'isolation'
  | 'pick-and-roll';

export interface ActionChoice {
  action: OffensiveAction;
  shotType: 'inside' | 'midrange' | 'three';
}

function sharpen(score: number, exponent = 1.65): number {
  return Math.pow(Math.max(1, score), exponent);
}

function applyIqBoost(
  scores: Record<OffensiveAction, number>,
  basketballIQ: number
): Record<OffensiveAction, number> {
  const max = Math.max(...Object.values(scores));
  const boosted = { ...scores };

  // High-IQ players lean harder into their best actions
  for (const action of Object.keys(boosted) as OffensiveAction[]) {
    if (boosted[action] >= max * 0.82) {
      boosted[action] *= 1 + (basketballIQ - 55) / 140;
    }
  }

  return boosted;
}

export function chooseOffensiveAction(
  primaryPlayer: Player,
  teamPlayers: Player[],
  rng: RNG
): ActionChoice {
  const r = primaryPlayer.ratings;

  // Rating-driven action weights
  let scores: Record<OffensiveAction, number> = {
    'post-up': sharpen(r.insideScoring * 0.72 + r.basketballIQ * 0.18 + r.athleticism * 0.1),
    'drive': sharpen(
      r.insideScoring * 0.28 + r.ballHandling * 0.38 + r.athleticism * 0.24 + r.basketballIQ * 0.1
    ),
    'midrange-jumper': sharpen(r.midrange * 0.78 + r.basketballIQ * 0.22),
    'catch-and-shoot-three': sharpen(r.threePoint * 0.88 + r.basketballIQ * 0.12),
    'isolation': sharpen(
      r.ballHandling * 0.35 +
        r.athleticism * 0.25 +
        Math.max(r.insideScoring, r.midrange, r.threePoint) * 0.25 +
        r.basketballIQ * 0.15
    ),
    'pick-and-roll': sharpen(r.passing * 0.48 + r.ballHandling * 0.28 + r.basketballIQ * 0.24),
  };

  scores = applyIqBoost(scores, r.basketballIQ);

  const entries = Object.entries(scores) as [OffensiveAction, number][];
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  let roll = rng() * total;

  for (const [action, weight] of entries) {
    roll -= weight;
    if (roll <= 0) {
      return mapActionToShotType(action, primaryPlayer, rng);
    }
  }

  return mapActionToShotType(entries[entries.length - 1][0], primaryPlayer, rng);
}

function mapActionToShotType(action: OffensiveAction, player: Player, rng: RNG): ActionChoice {
  const r = player.ratings;

  switch (action) {
    case 'post-up':
      return { action, shotType: 'inside' };
    case 'drive':
      return { action, shotType: 'inside' };
    case 'midrange-jumper':
      return { action, shotType: 'midrange' };
    case 'catch-and-shoot-three':
      return { action, shotType: 'three' };
    case 'isolation': {
      const three = r.threePoint;
      const mid = r.midrange;
      const inside = r.insideScoring;
      const roll = rng();
      if (three >= mid && three >= inside && roll < 0.58) return { action, shotType: 'three' };
      if (mid >= inside && roll < 0.62) return { action, shotType: 'midrange' };
      return { action, shotType: 'inside' };
    }
    case 'pick-and-roll': {
      // Passers tend to create threes or rollers at the rim based on their profile
      const threeBias = r.threePoint * 0.45 + r.passing * 0.2;
      const midBias = r.midrange * 0.35;
      const insideBias = r.insideScoring * 0.35 + r.athleticism * 0.15;
      const total = threeBias + midBias + insideBias;
      let roll = rng() * total;
      roll -= threeBias;
      if (roll <= 0) return { action, shotType: 'three' };
      roll -= midBias;
      if (roll <= 0) return { action, shotType: 'midrange' };
      return { action, shotType: 'inside' };
    }
  }
}
