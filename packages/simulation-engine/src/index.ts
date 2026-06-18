export { simulateGame, SimulateGameOptions } from './simulateGame';
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
