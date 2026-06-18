"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseDefenseReaction = chooseDefenseReaction;
/**
 * Choose defensive reaction using ONLY the active on-court defenders.
 */
function chooseDefenseReaction(offenseAction, defensivePlayers, primaryOffender, rng) {
    const players = defensivePlayers;
    if (players.length === 0)
        return 'stay-home';
    // Aggregate defensive strength for area (raw ratings; fatigue is applied upstream in probability)
    const avgInterior = players.reduce((s, p) => s + p.ratings.interiorDefense, 0) / players.length;
    const avgPerimeter = players.reduce((s, p) => s + p.ratings.perimeterDefense, 0) / players.length;
    const action = offenseAction;
    // Heuristic: inside actions -> more help/double
    if (action === 'post-up' || action === 'drive') {
        if (avgInterior > 72 && rng() < 0.35)
            return 'double-team';
        if (rng() < 0.5)
            return 'help-defense';
        return 'switch';
    }
    // Perimeter actions
    if (action === 'catch-and-shoot-three') {
        if (avgPerimeter > 70 && rng() < 0.6)
            return 'close-out';
        return rng() < 0.5 ? 'stay-home' : 'switch';
    }
    if (action === 'midrange-jumper' || action === 'isolation') {
        if (rng() < 0.3)
            return 'switch';
        if (rng() < 0.5)
            return 'drop';
        return 'help-defense';
    }
    if (action === 'pick-and-roll') {
        return rng() < 0.55 ? 'switch' : 'drop';
    }
    // Default
    return rng() < 0.5 ? 'switch' : 'help-defense';
}
//# sourceMappingURL=defenseSelection.js.map