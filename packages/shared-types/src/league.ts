export interface TeamStanding {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  winPct: number;
  pointDifferential: number;
}

export interface LeagueSnapshot {
  seasonId: string;
  standings: TeamStanding[];
  lastUpdated: string;
}
