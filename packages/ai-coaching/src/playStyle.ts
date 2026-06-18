import { Team } from '@basketball-dynasty/shared-types';

export interface OffensiveTendencies {
  pace: 'slow' | 'medium' | 'fast';
  threePointTendency: number; // 0.0 - 1.0
  interiorTendency: number;   // 0.0 - 1.0
  // Future: pickAndRollFrequency, isoFrequency, etc.
}

export function getTeamOffensiveTendencies(team: Team): OffensiveTendencies {
  const players = team.players;
  if (players.length === 0) {
    return { pace: 'medium', threePointTendency: 0.35, interiorTendency: 0.4 };
  }

  const avgThree = players.reduce((s, p) => s + p.ratings.threePoint, 0) / players.length;
  const avgInside = players.reduce((s, p) => s + p.ratings.insideScoring, 0) / players.length;
  const avgAthleticism = players.reduce((s, p) => s + p.ratings.athleticism, 0) / players.length;

  // Pace based on athleticism + ball handling
  const avgBall = players.reduce((s, p) => s + p.ratings.ballHandling, 0) / players.length;
  let pace: 'slow' | 'medium' | 'fast' = 'medium';
  const paceScore = (avgAthleticism + avgBall) / 2;
  if (paceScore > 78) pace = 'fast';
  else if (paceScore < 62) pace = 'slow';

  // Three point bias
  const threePointTendency = Math.max(0.18, Math.min(0.62, (avgThree - 45) / 120 + 0.32));

  // Interior bias
  const interiorTendency = Math.max(0.22, Math.min(0.65, (avgInside - 50) / 100 + 0.42));

  return {
    pace,
    threePointTendency,
    interiorTendency,
  };
}

export function getTeamDefensiveStyle(team: Team): string {
  const players = team.players;
  if (players.length === 0) return 'balanced';

  const avgInterior = players.reduce((s, p) => s + p.ratings.interiorDefense, 0) / players.length;
  const avgPerimeter = players.reduce((s, p) => s + p.ratings.perimeterDefense, 0) / players.length;

  if (avgInterior > avgPerimeter + 8) return 'paint-protection';
  if (avgPerimeter > avgInterior + 8) return 'perimeter-focused';
  return 'balanced';
}
