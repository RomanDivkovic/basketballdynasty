import type { Player, Team } from '@basketball-dynasty/shared-types';
import { createRNG, RNG } from '@basketball-dynasty/simulation-engine';

function avgRating(player: Player): number {
  const vals = Object.values(player.ratings || {});
  if (!vals.length) return 50;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function computeTeamPayroll(team: Team): number {
  return team.players.reduce((acc, p) => acc + (p.contract?.salary ?? 0), 0);
}

export function estimateBaseSalary(player: Player): number {
  // Base salary scales by average rating; multiplier tuned for demo purposes
  const avg = avgRating(player);
  return Math.round(avg * 12000);
}

export function negotiateContractForPlayer(
  player: Player,
  team: Team,
  availableBudget: number,
  seed?: number
): { salary: number; yearsRemaining: number } | null {
  const rng: RNG = seed !== undefined ? createRNG(seed) : Math.random;
  const base = estimateBaseSalary(player);
  const potential = player.ratings?.potential ?? 60;
  const potentialFactor = (potential - 50) / 50; // -1..1

  const desired = Math.round(base * (1 + potentialFactor * 0.5));
  const minAccept = Math.round(base * 0.3);

  const years = Math.max(1, Math.min(5, Math.round(1 + (potential - 50) / 20 + Math.floor(rng() * 2))));

  if (!Number.isFinite(availableBudget)) {
    return { salary: desired, yearsRemaining: years };
  }

  if (availableBudget < minAccept) return null;

  const salary = Math.min(desired, Math.max(minAccept, Math.round(availableBudget)));

  return { salary, yearsRemaining: years };
}

export function assignContractIfFits(player: Player, team: Team, seed?: number): boolean {
  const payroll = computeTeamPayroll(team);
  const cap = team.salaryCap ?? Number.POSITIVE_INFINITY;
  const available = cap === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, cap - payroll);
  const c = negotiateContractForPlayer(player, team, available, seed);
  if (!c) return false;
  player.contract = { salary: c.salary, yearsRemaining: c.yearsRemaining } as any;
  return true;
}
