import { Player } from '@basketball-dynasty/shared-types';
import { RNG } from './rng';

export function selectPrimaryBallHandler(players: Player[], rng: RNG): Player {
  if (players.length === 0) {
    throw new Error('Cannot select player from empty team');
  }

  // Weight by ball handling + basketball IQ + a bit of athleticism
  const weights = players.map((p) => {
    const r = p.ratings;
    return Math.max(1, r.ballHandling * 0.55 + r.basketballIQ * 0.3 + r.athleticism * 0.15);
  });

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

export function selectShooter(players: Player[], preferredType: 'inside' | 'midrange' | 'three', rng: RNG): Player {
  // Bias toward players good at the preferred shot type
  const weights = players.map((p) => {
    const r = p.ratings;
    let base = 10;
    if (preferredType === 'inside') base += r.insideScoring * 0.8 + r.athleticism * 0.2;
    if (preferredType === 'midrange') base += r.midrange * 0.8 + r.basketballIQ * 0.2;
    if (preferredType === 'three') base += r.threePoint * 0.9 + r.basketballIQ * 0.1;
    return Math.max(1, base);
  });

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
