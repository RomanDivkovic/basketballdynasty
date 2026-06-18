/**
 * Simple seeded RNG for reproducible simulations.
 * Uses Mulberry32 algorithm - small, fast, good enough for game sim.
 */
export declare function createRNG(seed: number): () => number;
export type RNG = () => number;
export declare const defaultRNG: RNG;
//# sourceMappingURL=rng.d.ts.map