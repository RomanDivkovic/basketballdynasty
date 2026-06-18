"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateGame = simulateGame;
const rng_1 = require("./rng");
const fatigue_1 = require("./fatigue");
const possession_1 = require("./possession");
const lineup_1 = require("./lineup");
function simulateGame(teamA, teamB, options = {}) {
    const totalPossessions = options.totalPossessions ?? 200;
    const rng = options.seed !== undefined ? (0, rng_1.createRNG)(options.seed) : rng_1.defaultRNG;
    // Rotation config (simple for Phase 2A)
    const rotationConfig = {
        ...lineup_1.DEFAULT_ROTATION_CONFIG,
        interval: options.rotationInterval ?? lineup_1.DEFAULT_ROTATION_CONFIG.interval,
    };
    // Fatigue for ALL players (starters + bench)
    const allPlayers = [...teamA.players, ...teamB.players];
    const fatigue = (0, fatigue_1.createInitialFatigue)(allPlayers);
    // Rotation state per team (manages active 5 vs bench)
    const teamAState = (0, lineup_1.createInitialRotationState)(teamA);
    const teamBState = (0, lineup_1.createInitialRotationState)(teamB);
    const possessions = [];
    let scoreA = 0;
    let scoreB = 0;
    let possessionIndex = 0;
    // Start with teamA on offense
    let offenseState = teamAState;
    let defenseState = teamBState;
    const pointsScored = {};
    const initPoints = (pid) => {
        if (pointsScored[pid] === undefined)
            pointsScored[pid] = 0;
    };
    allPlayers.forEach((p) => initPoints(p.id));
    while (possessionIndex < totalPossessions) {
        // Run the possession using ONLY the current active 5 on each side
        const { result, keepPossession } = (0, possession_1.simulatePossession)({
            offenseTeamId: offenseState.teamId,
            offensePlayers: offenseState.active,
            defensePlayers: defenseState.active,
            fatigue,
            rng,
        });
        possessions.push(result);
        // Update score
        if (offenseState.teamId === teamA.id) {
            scoreA += result.points;
        }
        else {
            scoreB += result.points;
        }
        if (result.points > 0 && result.primaryPlayerId) {
            pointsScored[result.primaryPlayerId] =
                (pointsScored[result.primaryPlayerId] || 0) + result.points;
        }
        // === Fatigue management for this possession ===
        // Offense drains harder, defense drains lighter
        (0, fatigue_1.drainCourtFatigue)(fatigue, offenseState.active, 1.0);
        (0, fatigue_1.drainCourtFatigue)(fatigue, defenseState.active, 0.65);
        // Recover everyone on the bench for both teams
        (0, fatigue_1.recoverBenchFatigue)(fatigue, offenseState.bench);
        (0, fatigue_1.recoverBenchFatigue)(fatigue, defenseState.bench);
        possessionIndex++;
        // === Rotation checks (every N possessions) ===
        if (possessionIndex % rotationConfig.interval === 0) {
            (0, lineup_1.considerRotations)(offenseState, fatigue, rng, rotationConfig);
            (0, lineup_1.considerRotations)(defenseState, fatigue, rng, rotationConfig);
        }
        // Alternate possession unless offensive rebound
        if (!keepPossession) {
            const tmp = offenseState;
            offenseState = defenseState;
            defenseState = tmp;
        }
        // keepPossession: same offense keeps the ball with current active 5
    }
    return {
        teamAId: teamA.id,
        teamBId: teamB.id,
        finalScoreA: scoreA,
        finalScoreB: scoreB,
        possessions,
        pointsScored,
    };
}
//# sourceMappingURL=simulateGame.js.map