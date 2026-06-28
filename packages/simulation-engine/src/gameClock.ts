import { RNG } from './rng';

/** 12-minute NBA quarter */
export const QUARTER_LENGTH_SECONDS = 12 * 60;

/** 48-minute regulation game */
export const GAME_LENGTH_SECONDS = 4 * QUARTER_LENGTH_SECONDS;

export const POSSESSION_LENGTH_MIN_SECONDS = 8;
export const POSSESSION_LENGTH_MAX_SECONDS = 24;

export interface GameClockState {
  currentQuarter: number;
  secondsRemainingInQuarter: number;
  gameSecondsRemaining: number;
}

export interface ClockAdvanceResult {
  secondsElapsed: number;
  quarterEnded: boolean;
  gameEnded: boolean;
}

export function createGameClock(): GameClockState {
  return {
    currentQuarter: 1,
    secondsRemainingInQuarter: QUARTER_LENGTH_SECONDS,
    gameSecondsRemaining: GAME_LENGTH_SECONDS,
  };
}

/** Deterministic possession duration in [8, 24] seconds from the clock RNG stream. */
export function randomPossessionDuration(rng: RNG): number {
  const span = POSSESSION_LENGTH_MAX_SECONDS - POSSESSION_LENGTH_MIN_SECONDS;
  return POSSESSION_LENGTH_MIN_SECONDS + Math.floor(rng() * (span + 1));
}

export function beginNextQuarter(clock: GameClockState): void {
  if (clock.currentQuarter >= 4) {
    return;
  }
  clock.currentQuarter += 1;
  clock.secondsRemainingInQuarter = QUARTER_LENGTH_SECONDS;
}

/**
 * Advance the game clock by one possession. Handles quarter rollovers and
 * carries overflow into the next period when a possession spans the buzzer.
 */
export function advanceClock(clock: GameClockState, rng: RNG): ClockAdvanceResult {
  if (clock.gameSecondsRemaining <= 0) {
    return { secondsElapsed: 0, quarterEnded: false, gameEnded: true };
  }

  let remaining = randomPossessionDuration(rng);
  let quarterEnded = false;
  const startElapsed = remaining;

  while (remaining > 0 && clock.gameSecondsRemaining > 0) {
    const step = Math.min(
      remaining,
      clock.secondsRemainingInQuarter,
      clock.gameSecondsRemaining
    );

    clock.secondsRemainingInQuarter -= step;
    clock.gameSecondsRemaining -= step;
    remaining -= step;

    if (clock.secondsRemainingInQuarter <= 0) {
      quarterEnded = true;
      if (clock.currentQuarter < 4 && clock.gameSecondsRemaining > 0) {
        beginNextQuarter(clock);
      } else {
        clock.secondsRemainingInQuarter = 0;
        clock.gameSecondsRemaining = 0;
        break;
      }
    }
  }

  const gameEnded = clock.gameSecondsRemaining <= 0;

  return {
    secondsElapsed: startElapsed - remaining,
    quarterEnded,
    gameEnded,
  };
}

/** Format seconds as M:SS for debug / play-by-play plumbing. */
export function formatClock(seconds: number): string {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
