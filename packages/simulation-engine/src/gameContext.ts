import type { Team } from '@basketball-dynasty/shared-types';
import { createInitialFatigue } from './fatigue';
import { createInitialRotationState, TeamRotationState } from './lineup';
import { createGameClock } from './gameClock';

/**
 * Active on-court lineups for the current possession.
 * offense/defense swap when possession changes hands.
 */
export interface ActiveLineups {
  offense: TeamRotationState;
  defense: TeamRotationState;
}

/**
 * Shared mutable state for a single simulated game.
 * Intentionally minimal — future systems (momentum, fouls, clock, etc.)
 * can read/write here without changing possession flow.
 */
export interface GameContext {
  currentPossession: number;
  totalPossessions: number;
  currentQuarter: number;
  secondsRemainingInQuarter: number;
  gameSecondsRemaining: number;
  scoreA: number;
  scoreB: number;
  offenseTeamId: string;
  defenseTeamId: string;
  activeLineups: ActiveLineups;
  fatigueState: Record<string, number>;
}

export function createGameContext(
  teamA: Team,
  teamB: Team,
  totalPossessions: number
): GameContext {
  const allPlayers = [...teamA.players, ...teamB.players];
  const teamAState = createInitialRotationState(teamA);
  const teamBState = createInitialRotationState(teamB);

  const clock = createGameClock();

  return {
    currentPossession: 0,
    totalPossessions,
    currentQuarter: clock.currentQuarter,
    secondsRemainingInQuarter: clock.secondsRemainingInQuarter,
    gameSecondsRemaining: clock.gameSecondsRemaining,
    scoreA: 0,
    scoreB: 0,
    offenseTeamId: teamA.id,
    defenseTeamId: teamB.id,
    activeLineups: {
      offense: teamAState,
      defense: teamBState,
    },
    fatigueState: createInitialFatigue(allPlayers),
  };
}

/** Swap offensive/defensive roles after a change of possession. */
export function swapPossession(ctx: GameContext): void {
  const tmpLineup = ctx.activeLineups.offense;
  ctx.activeLineups.offense = ctx.activeLineups.defense;
  ctx.activeLineups.defense = tmpLineup;

  const tmpTeamId = ctx.offenseTeamId;
  ctx.offenseTeamId = ctx.defenseTeamId;
  ctx.defenseTeamId = tmpTeamId;
}
