export type ShotType = 'inside' | 'midrange' | 'three';

export interface PossessionResult {
  // Which team had the ball
  offenseTeamId: string;
  // Player who initiated the main action (ball handler / shooter)
  primaryPlayerId: string;
  // What kind of action was attempted
  action: string;
  // Defensive reaction
  defenseReaction: string;
  // Outcome description (human readable)
  description: string;
  // Points scored on this possession (0, 2, or 3)
  points: number;
  // Was it a turnover?
  turnover: boolean;
  // Did offense get offensive rebound and keep possession?
  offensiveRebound: boolean;
}

export interface GameResult {
  teamAId: string;
  teamBId: string;
  finalScoreA: number;
  finalScoreB: number;
  possessions: PossessionResult[];
  // Simple box score style aggregates (playerId -> points)
  pointsScored: Record<string, number>;
}

export interface GameState {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  currentPossession: number;
  totalPossessions: number;
  // Live fatigue: playerId -> remaining stamina factor (1.0 = fresh, lower = tired)
  fatigue: Record<string, number>;
  playLog: string[];
}
