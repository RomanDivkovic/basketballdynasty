"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const simulateGame_1 = require("../simulateGame");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function loadTeams() {
    // From src/debug/runGame.ts -> after build: dist/debug/runGame.js
    // Relative to reach repo root data: ../../../../data/teams.json
    const teamsPath = path.join(__dirname, '../../../../data/teams.json');
    const raw = fs.readFileSync(teamsPath, 'utf-8');
    return JSON.parse(raw);
}
function printFirstN(plays, label, n = 10) {
    console.log(`\n--- ${label} first ${n} plays ---`);
    plays.slice(0, n).forEach((p, i) => {
        console.log(`${i + 1}. ${p.description}`);
    });
}
function runsMatchExactly(run1, run2) {
    return JSON.stringify(run1) === JSON.stringify(run2);
}
function firstNDescriptionsMatch(run1, run2, n = 10) {
    const a = run1.possessions.slice(0, n).map((p) => p.description);
    const b = run2.possessions.slice(0, n).map((p) => p.description);
    if (a.length !== b.length)
        return false;
    return a.every((desc, i) => desc === b[i]);
}
function main() {
    const teams = loadTeams();
    if (teams.length < 2) {
        console.error('Need at least 2 teams in data/teams.json');
        process.exit(1);
    }
    const teamA = teams[0];
    const teamB = teams[1];
    const options = {
        seed: 12345,
        totalPossessions: 100,
    };
    const run1 = (0, simulateGame_1.simulateGame)(teamA, teamB, options);
    const run2 = (0, simulateGame_1.simulateGame)(teamA, teamB, options);
    console.log(`Run1: ${run1.finalScoreA} - ${run1.finalScoreB}`);
    console.log(`Run2: ${run2.finalScoreA} - ${run2.finalScoreB}`);
    const deterministic = runsMatchExactly(run1, run2);
    console.log(`Deterministic: ${deterministic ? 'TRUE' : 'FALSE'}`);
    console.log(`Total possessions: ${run1.possessions.length}`);
    const first10Match = firstNDescriptionsMatch(run1, run2, 10);
    console.log(`First 10 plays match: ${first10Match ? 'TRUE' : 'FALSE'}`);
    printFirstN(run1.possessions, 'Run1');
    printFirstN(run2.possessions, 'Run2');
}
main();
//# sourceMappingURL=runGame.js.map