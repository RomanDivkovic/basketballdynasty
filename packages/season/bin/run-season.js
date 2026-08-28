#!/usr/bin/env node
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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const index_1 = require("../src/index");
function loadTeams() {
    const dataPath = path.join(process.cwd(), 'data', 'teams.json');
    if (!fs.existsSync(dataPath)) {
        console.error('data/teams.json not found');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}
function main() {
    const teams = loadTeams();
    const season = (0, index_1.createSeasonState)(teams, 'season-cli');
    const played = (0, index_1.playNextRound)(season, 10, { seed: 2026 });
    console.log('Played', played.results.length, 'games. Top standings:');
    console.log(played.standings.slice(0, 5));
    const out = path.join(process.cwd(), 'data', 'season-snapshot.json');
    (0, index_1.saveSeasonSnapshot)(out, played);
    console.log('Saved snapshot to', out);
}
main();
//# sourceMappingURL=run-season.js.map