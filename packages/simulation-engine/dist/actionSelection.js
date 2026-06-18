"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseOffensiveAction = chooseOffensiveAction;
function chooseOffensiveAction(primaryPlayer, teamPlayers, rng) {
    const r = primaryPlayer.ratings;
    // Simple heuristic scoring for each action
    const scores = {
        'post-up': r.insideScoring * 0.7 + r.basketballIQ * 0.2 + r.athleticism * 0.1,
        'drive': r.ballHandling * 0.5 + r.athleticism * 0.35 + r.insideScoring * 0.15,
        'midrange-jumper': r.midrange * 0.75 + r.basketballIQ * 0.25,
        'catch-and-shoot-three': r.threePoint * 0.85 + r.basketballIQ * 0.15,
        'isolation': r.ballHandling * 0.4 + r.athleticism * 0.3 + (r.insideScoring + r.midrange + r.threePoint) * 0.1,
        'pick-and-roll': r.passing * 0.5 + r.basketballIQ * 0.35 + r.ballHandling * 0.15,
    };
    // Convert to probabilities
    const entries = Object.entries(scores);
    const total = entries.reduce((sum, [, v]) => sum + v, 0);
    let roll = rng() * total;
    for (const [action, weight] of entries) {
        roll -= weight;
        if (roll <= 0) {
            return mapActionToShotType(action, primaryPlayer, rng);
        }
    }
    // Fallback
    return mapActionToShotType(entries[entries.length - 1][0], primaryPlayer, rng);
}
function mapActionToShotType(action, player, rng) {
    switch (action) {
        case 'post-up':
            return { action, shotType: 'inside' };
        case 'drive':
            return { action, shotType: 'inside' };
        case 'midrange-jumper':
            return { action, shotType: 'midrange' };
        case 'catch-and-shoot-three':
            return { action, shotType: 'three' };
        case 'isolation': {
            // Pick shot type based on player's strengths
            const r = player.ratings;
            const three = r.threePoint;
            const mid = r.midrange;
            const inside = r.insideScoring;
            const roll = rng();
            if (three > mid && three > inside && roll < 0.55)
                return { action, shotType: 'three' };
            if (mid > inside && roll < 0.6)
                return { action, shotType: 'midrange' };
            return { action, shotType: 'inside' };
        }
        case 'pick-and-roll': {
            // Often ends in various shots or passes, bias toward mid/three for spacing
            const roll = rng();
            if (roll < 0.4)
                return { action, shotType: 'three' };
            if (roll < 0.75)
                return { action, shotType: 'midrange' };
            return { action, shotType: 'inside' };
        }
    }
}
//# sourceMappingURL=actionSelection.js.map