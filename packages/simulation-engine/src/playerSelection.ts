import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';

function offensiveSkill(r: Player['ratings']): number {
  return Math.max(r.insideScoring, r.midrange, r.threePoint);
}

function pickWeightedPlayer(players: Player[], weights: number[], rng: RNG): Player {
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
 * Select the primary offensive player for a possession.
 * Stars and ball handlers naturally receive more touches.
 */
export function selectPrimaryBallHandler(
  players: Player[],
  rng: RNG,
  fatigue?: Record<string, number>
): Player {
  if (players.length === 0) {
    throw new Error('Cannot select player from empty team');
  }

  const weights = players.map((p) => {
    const r = p.ratings;
    const offSkill = offensiveSkill(r);
    const fatigueFactor = fatigue?.[p.id] ?? 1.0;

    const base =
      r.ballHandling * 0.32 +
      r.basketballIQ * 0.28 +
      offSkill * 0.25 +
      r.stamina * 0.15;

    // Fresh players get the ball slightly more; tired players fade in usage
    const fatigueUsage = 0.82 + fatigueFactor * 0.18;

    // Sharpen so elite players stand out from role players
    const sharpened = Math.pow(Math.max(1, base * fatigueUsage), 1.55);
    return sharpened;
  });

  return pickWeightedPlayer(players, weights, rng);
}

export function selectShooter(
  players: Player[],
  preferredType: 'inside' | 'midrange' | 'three',
  rng: RNG
): Player {
  const weights = players.map((p) => {
    const r = p.ratings;
    let score = 12;
    if (preferredType === 'inside') {
      score += r.insideScoring * 0.75 + r.athleticism * 0.15 + r.basketballIQ * 0.1;
    }
    if (preferredType === 'midrange') {
      score += r.midrange * 0.75 + r.basketballIQ * 0.15 + r.ballHandling * 0.1;
    }
    if (preferredType === 'three') {
      score += r.threePoint * 0.82 + r.basketballIQ * 0.12 + r.stamina * 0.06;
    }
    return Math.pow(Math.max(1, score), 1.45);
  });

  return pickWeightedPlayer(players, weights, rng);
}
