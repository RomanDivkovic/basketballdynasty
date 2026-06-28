/**
 * Centralized numeric tuning constants for league realism.
 * All values here are pure scalars — no logic, no functions.
 *
 * These control shot success, defensive pressure, fatigue scaling,
 * variance, and related probabilities in the core engine.
 */

// Base mapping from player skill rating to make probability
export const baseShotSuccess = 0.138;
export const baseSkillOffset = 32;
export const baseSkillScale = 68;
export const baseCompression = 0.81;

// Three point shots have an inherent difficulty multiplier
export const threePointMultiplier = 0.665;

// Controls how strongly fatigue reduces make probability.
// Higher value = fatigue hurts shooting more.
export const fatigueImpactFactor = 1.35;

// Amplifies the effect of defensive ratings on suppressing shots.
export const defenseImpactFactor = 1.08;

// Amount of random variance applied around the computed make probability.
export const varianceLevel = 0.155;

// Scales the positive bonuses from offensive actions (iso, drive, etc.).
export const actionModScale = 0.50;

// Reaction / coverage effects on make probability
export const reactionDoubleTeam = -15;
export const reactionCloseOut = -10;
export const reactionHelpDefense = -5;
export const reactionStayHome = 2;

// Turnover probability baselines
export const turnoverBase = 0.078;
export const turnoverDriveIsoExtra = 0.036;
export const turnoverDoubleTeamExtra = 0.048;
export const turnoverMax = 0.22;

// Block and steal event rates (applied conditionally)
export const blockBaseRate = 0.058;
export const stealOnTurnoverRate = 0.46;

// Offensive rebound chance on misses
export const offReboundBaseRate = 0.205;
export const offReboundSkillDivisor = 128;
export const offReboundFloor = 0.078;

// Probability clamps (raw before/after variance)
export const rawMakeProbMin = 0.26;
export const rawMakeProbMax = 0.66;
export const finalMakeProbMin = 0.20;
export const finalMakeProbMax = 0.74;
