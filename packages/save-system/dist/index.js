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
exports.createSaveMetadata = createSaveMetadata;
exports.createSaveBundle = createSaveBundle;
exports.serializeSaveBundle = serializeSaveBundle;
exports.parseSaveBundle = parseSaveBundle;
exports.saveBundleToDisk = saveBundleToDisk;
exports.loadBundleFromDisk = loadBundleFromDisk;
exports.createLeagueStandings = createLeagueStandings;
exports.buildLeagueSnapshot = buildLeagueSnapshot;
exports.createGameSummary = createGameSummary;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function createSaveMetadata(kind = 'snapshot') {
    return {
        version: '0.1.0',
        timestamp: new Date().toISOString(),
        kind,
    };
}
function createSaveBundle(data, kind = 'snapshot') {
    return {
        metadata: createSaveMetadata(kind),
        data,
    };
}
function serializeSaveBundle(bundle) {
    return JSON.stringify(bundle, null, 2);
}
function parseSaveBundle(raw) {
    return JSON.parse(raw);
}
function saveBundleToDisk(filePath, data, kind = 'snapshot') {
    const normalized = path.resolve(filePath);
    const dir = path.dirname(normalized);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(normalized, serializeSaveBundle(createSaveBundle(data, kind)), 'utf-8');
}
function loadBundleFromDisk(filePath) {
    const normalized = path.resolve(filePath);
    const raw = fs.readFileSync(normalized, 'utf-8');
    return parseSaveBundle(raw);
}
function createLeagueStandings(teams, games) {
    const recordMap = new Map();
    for (const team of teams) {
        recordMap.set(team.id, {
            teamId: team.id,
            teamName: team.name,
            wins: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
        });
    }
    for (const game of games) {
        const a = recordMap.get(game.teamAId);
        const b = recordMap.get(game.teamBId);
        if (!a || !b)
            continue;
        a.pointsFor += game.finalScoreA;
        a.pointsAgainst += game.finalScoreB;
        b.pointsFor += game.finalScoreB;
        b.pointsAgainst += game.finalScoreA;
        if (game.finalScoreA > game.finalScoreB) {
            a.wins += 1;
            b.losses += 1;
        }
        else if (game.finalScoreB > game.finalScoreA) {
            b.wins += 1;
            a.losses += 1;
        }
    }
    return Array.from(recordMap.values())
        .map((entry) => ({
        ...entry,
        winPct: entry.wins + entry.losses === 0 ? 0.5 : entry.wins / (entry.wins + entry.losses),
        pointDifferential: entry.pointsFor - entry.pointsAgainst,
    }))
        .sort((left, right) => {
        const byWinPct = right.winPct - left.winPct;
        if (byWinPct !== 0)
            return byWinPct;
        const byDiff = right.pointDifferential - left.pointDifferential;
        if (byDiff !== 0)
            return byDiff;
        return right.pointsFor - left.pointsFor;
    });
}
function buildLeagueSnapshot(teams, games, seasonId = 'season-1') {
    return {
        seasonId,
        standings: createLeagueStandings(teams, games),
        lastUpdated: new Date().toISOString(),
    };
}
function createGameSummary(game) {
    return {
        teamAId: game.teamAId,
        teamBId: game.teamBId,
        finalScoreA: game.finalScoreA,
        finalScoreB: game.finalScoreB,
    };
}
//# sourceMappingURL=index.js.map