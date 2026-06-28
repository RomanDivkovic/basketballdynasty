export { simulateGame } from './simulateGame';
export type { GameResult, SimulateGameOptions } from './simulateGame';
export { createGameContext, swapPossession } from './gameContext';
export type { GameContext, ActiveLineups } from './gameContext';
export {
  createGameClock,
  advanceClock,
  beginNextQuarter,
  formatClock,
  QUARTER_LENGTH_SECONDS,
  GAME_LENGTH_SECONDS,
} from './gameClock';
export type { GameClockState, ClockAdvanceResult } from './gameClock';
export { createRNG } from './rng';
export type { RNG } from './rng';

// Lineup + rotation (Phase 2A)
export {
  createDefaultLineup,
  createInitialRotationState,
  considerRotations,
  DEFAULT_ROTATION_CONFIG,
} from './lineup';
export type { Lineup, TeamRotationState, RotationConfig } from './lineup';

// Fatigue (enhanced)
export {
  createInitialFatigue,
  applyFatigue,
  recoverFatigue,
  getFatigueMultiplier,
} from './fatigue';

export { chooseOffensiveAction } from './actionSelection';
export type { OffensiveAction, ActionChoice } from './actionSelection';
export { chooseDefenseReaction } from './defenseSelection';
export type { DefenseReaction } from './defenseSelection';
export { resolvePossession } from './probability';
export type { PossessionContext, Outcome } from './probability';

// Player box score stats (generated naturally from possessions)
export {
  createEmptyPlayerGameStats,
  computeMinutesPlayed,
  ensurePlayerStats,
} from './playerStats';
export type { PlayerGameStats } from './playerStats';
