import type { Team, Player } from '@basketball-dynasty/shared-types';
import { createRNG, RNG } from '@basketball-dynasty/simulation-engine';
import { computeTeamPayroll, assignContractIfFits } from './contracts';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export interface OffseasonOptions {
  seed?: number;
  draftRounds?: number;
  rosterTarget?: number;
}

export interface OffseasonResult {
  teams: Team[];
  retiredPlayerIds: string[];
  draftedPlayers: Player[];
  freeAgents: Player[];
}

/**
 * Apply an expanded offseason to teams:
 * - age players
 * - decrement contracts (players with 0 years become free agents)
 * - retire very old/low-rated players
 * - generate a one-round draft (rookies)
 * - sign free agents to fill roster holes
 */
export function applyOffseasonToTeams(
  teams: Team[],
  seasonId: string,
  standings: any[] = [],
  options: OffseasonOptions = {}
): OffseasonResult {
  const rng: RNG = options.seed !== undefined ? createRNG(options.seed) : Math.random;

  const retiredPlayerIds: string[] = [];
  const freeAgentsAcc: { player: Player; previousTeamId: string }[] = [];

  // Step 1: age, retirement check, decrement contracts
  const processedTeams: Team[] = teams.map((team) => {
    const newPlayers: Player[] = [];
    for (const p of team.players) {
      const oldAge = p.age ?? 25;
      const age = oldAge + 1;

      // decrement contract years if present
      const contract = p.contract ? { ...p.contract, yearsRemaining: Math.max(0, p.contract.yearsRemaining - 1) } : p.contract;

      // Retirement probability
      let retireProb = 0;
      if (age >= 40) retireProb = 1;
      else if (age > 33) retireProb = (age - 33) * 0.05;

      const ratingValues = Object.values(p.ratings || {});
      const avgRating = ratingValues.length ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : 50;
      if (age > 35 && avgRating < 55) retireProb += 0.15;

      if (rng() < retireProb) {
        retiredPlayerIds.push(p.id);
        continue;
      }

      // If contract reached 0 years remaining, make player a free agent
      if (contract && contract.yearsRemaining <= 0) {
        freeAgentsAcc.push({ player: { ...p, age, contract }, previousTeamId: team.id });
        continue;
      }

      // Development/regression with coach influence
      const potential = p.ratings?.potential ?? 60;
      const potentialFactor = (potential - 50) / 50; // roughly -1..1
      const ageFactor = 1 - Math.max(0, (age - 28) / 20);
      const coachFactor = team.coach?.developmentFactor ?? 0;

      const newRatings: typeof p.ratings = { ...p.ratings };
      for (const k in newRatings) {
        if (k === 'potential') continue;
        const val = (newRatings as any)[k] as number;
        const baseChange = Math.round((potentialFactor + coachFactor) * ageFactor * 3); // -3..3 adjusted by coach
        const randomness = Math.floor(rng() * 3) - 1; // -1,0,1
        (newRatings as any)[k] = clamp(val + baseChange + randomness, 20, 99);
      }

      const newPlayer: Player = {
        ...p,
        age,
        ratings: newRatings,
        contract,
      };

      newPlayers.push(newPlayer);
    }

    return {
      ...team,
      players: newPlayers,
    };
  });

  // Step 2: Draft rookies (one round by default) and free agent signing
  const draftRounds = options.draftRounds ?? 1;
  const rosterTarget = options.rosterTarget ?? 8;

  // Determine draft order: worst-to-best using standings if available, otherwise arbitrary
  let worstToBest: string[] = processedTeams.map((t) => t.id);
  if (standings && standings.length) {
    worstToBest = [...standings].slice().reverse().map((s: any) => s.teamId);
  }

  // Generate rookies
  const rookies: Player[] = [];
  const totalPicks = draftRounds * processedTeams.length;
  const ratingKeys = [
    'insideScoring',
    'midrange',
    'threePoint',
    'passing',
    'ballHandling',
    'rebounding',
    'interiorDefense',
    'perimeterDefense',
    'steals',
    'blocks',
    'athleticism',
    'stamina',
    'basketballIQ',
  ];

  for (let pick = 0; pick < totalPicks; pick++) {
    const pickNumber = pick + 1;
    const potential = clamp(50 + Math.round((1 / pickNumber) * 30) + Math.floor(rng() * 10), 50, 99);
    const ratings: any = {};
    for (const k of ratingKeys) {
      const base = Math.round(30 + potential * 0.6 + Math.floor(rng() * 10));
      ratings[k] = clamp(base, 20, 99);
    }
    ratings.potential = potential;

    const id = `rookie_${seasonId}_${pick + 1}_${Math.floor(rng() * 1e6)}`;
    const name = `Rookie ${seasonId} #${pick + 1}`;
    const positionOptions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const position = positionOptions[Math.floor(rng() * positionOptions.length)];
    const rookie: Player = { id, name, position: position as any, age: 19, ratings };
    rookies.push(rookie);
  }

  // Place rookies into teams by draft order until rosterTarget filled
  const teamMap = new Map(processedTeams.map((t) => [t.id, { ...t }]));
  let rookieIndex = 0;
  for (let round = 0; round < draftRounds; round++) {
    for (const tid of worstToBest) {
      const team = teamMap.get(tid);
      if (!team) continue;
      while (team.players.length < rosterTarget && rookieIndex < rookies.length) {
        const rookie = rookies[rookieIndex];
        // Try to assign a contract that fits the team's cap; if it fails, stop drafting for this team
        const ok = assignContractIfFits(rookie, team, options.seed ? options.seed + rookieIndex : undefined);
        if (!ok) break;
        team.players.push(rookies[rookieIndex++]);
      }
    }
  }

  // Sign free agents (prefer previous team) to fill rosters
  const freeAgentsList = freeAgentsAcc.slice();
  for (const tid of worstToBest) {
    const team = teamMap.get(tid);
    if (!team) continue;
    while (team.players.length < rosterTarget && freeAgentsList.length) {
      let idx = freeAgentsList.findIndex((f) => f.previousTeamId === tid);
      if (idx === -1) idx = 0;
      const fa = freeAgentsList.splice(idx, 1)[0];
      // Try to assign a contract that fits the team's cap; if it fails, push back and try next team
      const ok = assignContractIfFits(fa.player, team, options.seed ? options.seed + Math.floor(rng() * 1000) : undefined);
      if (!ok) {
        // couldn't sign this FA to this team - try next team
        freeAgentsList.push(fa);
        break;
      }
      team.players.push(fa.player);
    }
  }

  const newTeams = processedTeams.map((t) => teamMap.get(t.id) || t);
  const remainingFreeAgents = freeAgentsList.map((f) => f.player);

  return { teams: newTeams, retiredPlayerIds, draftedPlayers: rookies.slice(0, rookieIndex), freeAgents: remainingFreeAgents };
}

