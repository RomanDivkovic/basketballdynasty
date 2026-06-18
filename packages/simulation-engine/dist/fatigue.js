"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitialFatigue = createInitialFatigue;
exports.applyFatigue = applyFatigue;
exports.recoverFatigue = recoverFatigue;
exports.getFatigueMultiplier = getFatigueMultiplier;
exports.drainCourtFatigue = drainCourtFatigue;
exports.recoverBenchFatigue = recoverBenchFatigue;
const FATIGUE_DECAY_BASE = 0.009;
const MIN_FATIGUE_FACTOR = 0.62;
const RECOVERY_RATE = 0.0035;
function createInitialFatigue(players) {
    const fatigue = {};
    for (const p of players) {
        fatigue[p.id] = 1.0;
    }
    return fatigue;
}
/**
 * Apply fatigue drain to a player who is on the court.
 * Higher intensity for primary ball handlers / high usage.
 */
function applyFatigue(fatigue, playerId, player, intensity = 1.0) {
    const stamina = player.ratings.stamina;
    const staminaFactor = 0.55 + (stamina / 100) * 0.9;
    const decay = FATIGUE_DECAY_BASE * intensity / staminaFactor;
    const current = fatigue[playerId] ?? 1.0;
    const next = Math.max(MIN_FATIGUE_FACTOR, current - decay);
    fatigue[playerId] = next;
}
/**
 * Recover fatigue for a player who is resting on the bench.
 * Recovery is slower than drain and stamina helps recovery speed.
 */
function recoverFatigue(fatigue, playerId, player, intensity = 1.0) {
    const stamina = player.ratings.stamina;
    const staminaFactor = 0.65 + (stamina / 100) * 0.7;
    const recovery = RECOVERY_RATE * intensity * staminaFactor;
    const current = fatigue[playerId] ?? 1.0;
    fatigue[playerId] = Math.min(1.0, current + recovery);
}
function getFatigueMultiplier(fatigueFactor) {
    // 1.0 fresh -> 1.0
    // 0.62 very tired -> ~0.86 performance
    return 0.74 + fatigueFactor * 0.26;
}
/**
 * Helper to drain fatigue for all players currently on court.
 */
function drainCourtFatigue(fatigue, players, baseIntensity) {
    for (const p of players) {
        applyFatigue(fatigue, p.id, p, baseIntensity);
    }
}
/**
 * Helper to recover all players currently on the bench.
 */
function recoverBenchFatigue(fatigue, players) {
    for (const p of players) {
        recoverFatigue(fatigue, p.id, p, 1.0);
    }
}
//# sourceMappingURL=fatigue.js.map