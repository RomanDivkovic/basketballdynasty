"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatePossession = simulatePossession;
const playerSelection_1 = require("./playerSelection");
const actionSelection_1 = require("./actionSelection");
const defenseSelection_1 = require("./defenseSelection");
const probability_1 = require("./probability");
const playDescription_1 = require("./playDescription");
const fatigue_1 = require("./fatigue");
function simulatePossession(input) {
    const { offenseTeamId, offensePlayers, defensePlayers, fatigue, rng } = input;
    if (offensePlayers.length === 0) {
        throw new Error('simulatePossession called with empty offensePlayers');
    }
    const primary = (0, playerSelection_1.selectPrimaryBallHandler)(offensePlayers, rng);
    const choice = (0, actionSelection_1.chooseOffensiveAction)(primary, offensePlayers, rng);
    const defenseReaction = (0, defenseSelection_1.chooseDefenseReaction)(choice.action, defensePlayers, primary, rng);
    const ctx = {
        primaryOffender: primary,
        offensiveTeamPlayers: offensePlayers,
        defensiveTeamPlayers: defensePlayers,
        fatigue,
        action: choice.action,
        shotType: choice.shotType,
        defenseReaction,
    };
    const outcome = (0, probability_1.resolvePossession)(ctx, rng);
    const description = (0, playDescription_1.generatePlayDescription)(primary, choice.action, defenseReaction, outcome.descriptionSuffix, outcome.points, choice.shotType);
    // Apply fatigue to primary ball handler (high usage)
    (0, fatigue_1.applyFatigue)(fatigue, primary.id, primary, 1.15);
    // Lightly fatigue one random on-court defender
    if (defensePlayers.length > 0) {
        const randomDefender = defensePlayers[Math.floor(rng() * defensePlayers.length)];
        (0, fatigue_1.applyFatigue)(fatigue, randomDefender.id, randomDefender, 0.55);
    }
    const result = {
        offenseTeamId,
        primaryPlayerId: primary.id,
        action: choice.action,
        defenseReaction,
        description,
        points: outcome.points,
        turnover: outcome.turnover,
        offensiveRebound: outcome.offensiveRebound,
    };
    return {
        result,
        description,
        keepPossession: outcome.offensiveRebound,
    };
}
//# sourceMappingURL=possession.js.map