export interface PlayerGameStats {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  minutesPlayed: number;
}

export function createEmptyPlayerGameStats(): PlayerGameStats {
  return {
    points: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    rebounds: 0,
    assists: 0,
    steals: 0,
    blocks: 0,
    turnovers: 0,
    minutesPlayed: 0,
  };
}

export function ensurePlayerStats(
  stats: Record<string, PlayerGameStats>,
  playerId: string
): void {
  if (!stats[playerId]) {
    stats[playerId] = createEmptyPlayerGameStats();
  }
}

export function computeMinutesPlayed(
  possessionsOnCourt: number,
  totalPossessions: number
): number {
  if (totalPossessions <= 0) return 0;
  const raw = (possessionsOnCourt / totalPossessions) * 48;
  return Math.round(raw * 10) / 10;
}
