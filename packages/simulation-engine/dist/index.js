"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvePossession = exports.chooseDefenseReaction = exports.chooseOffensiveAction = exports.getFatigueMultiplier = exports.recoverFatigue = exports.applyFatigue = exports.createInitialFatigue = exports.DEFAULT_ROTATION_CONFIG = exports.considerRotations = exports.createInitialRotationState = exports.createDefaultLineup = exports.createRNG = exports.simulateGame = void 0;
var simulateGame_1 = require("./simulateGame");
Object.defineProperty(exports, "simulateGame", { enumerable: true, get: function () { return simulateGame_1.simulateGame; } });
var rng_1 = require("./rng");
Object.defineProperty(exports, "createRNG", { enumerable: true, get: function () { return rng_1.createRNG; } });
// Lineup + rotation (Phase 2A)
var lineup_1 = require("./lineup");
Object.defineProperty(exports, "createDefaultLineup", { enumerable: true, get: function () { return lineup_1.createDefaultLineup; } });
Object.defineProperty(exports, "createInitialRotationState", { enumerable: true, get: function () { return lineup_1.createInitialRotationState; } });
Object.defineProperty(exports, "considerRotations", { enumerable: true, get: function () { return lineup_1.considerRotations; } });
Object.defineProperty(exports, "DEFAULT_ROTATION_CONFIG", { enumerable: true, get: function () { return lineup_1.DEFAULT_ROTATION_CONFIG; } });
// Fatigue (enhanced)
var fatigue_1 = require("./fatigue");
Object.defineProperty(exports, "createInitialFatigue", { enumerable: true, get: function () { return fatigue_1.createInitialFatigue; } });
Object.defineProperty(exports, "applyFatigue", { enumerable: true, get: function () { return fatigue_1.applyFatigue; } });
Object.defineProperty(exports, "recoverFatigue", { enumerable: true, get: function () { return fatigue_1.recoverFatigue; } });
Object.defineProperty(exports, "getFatigueMultiplier", { enumerable: true, get: function () { return fatigue_1.getFatigueMultiplier; } });
var actionSelection_1 = require("./actionSelection");
Object.defineProperty(exports, "chooseOffensiveAction", { enumerable: true, get: function () { return actionSelection_1.chooseOffensiveAction; } });
var defenseSelection_1 = require("./defenseSelection");
Object.defineProperty(exports, "chooseDefenseReaction", { enumerable: true, get: function () { return defenseSelection_1.chooseDefenseReaction; } });
var probability_1 = require("./probability");
Object.defineProperty(exports, "resolvePossession", { enumerable: true, get: function () { return probability_1.resolvePossession; } });
//# sourceMappingURL=index.js.map