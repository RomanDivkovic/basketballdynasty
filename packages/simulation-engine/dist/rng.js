"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRNG = void 0;
exports.createRNG = createRNG;
/**
 * Simple seeded RNG for reproducible simulations.
 * Uses Mulberry32 algorithm - small, fast, good enough for game sim.
 */
function createRNG(seed) {
    let state = seed >>> 0;
    return function random() {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
// Default unseeded RNG (uses Math.random under the hood)
exports.defaultRNG = Math.random;
//# sourceMappingURL=rng.js.map