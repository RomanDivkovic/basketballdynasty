import { simulateGame } from '../simulateGame';
import * as fs from 'fs';
import * as path from 'path';

interface RawTeam {
  id: string;
  name: string;
  players: any[];
}

interface PlayerStat {
  name: string;
  ppg: number;
}

interface HighestSingle {
  name: string;
  points: number;
}

interface AnalysisSummary {
  games: number;
  avgScoreA: number;
  avgScoreB: number;
  teamNameA: string;
  teamNameB: string;
  avgPossessions: number;
  pointsPerPossession: number;
  offensiveRating: number;
  defensiveRating: number;
  winRateA: number;
  winRateB: number;
  minDiff: number;
  maxDiff: number;
  avgDiff: number;
  medianDiff: number;
  topScorers: PlayerStat[];
  highestSingle: HighestSingle;
  // New aggregated rate and per-team averages derived only from existing simulation output
  avgFgPct: number;
  avgThreePtPct: number;
  avgReboundsPerTeam: number;
  avgAssistsPerTeam: number;
  avgTurnoversPerTeam: number;
}

function loadTeams(): RawTeam[] {
  // dist/debug/simAnalysis.js -> repo root data
  const teamsPath = path.join(__dirname, '../../../../data/teams.json');
  const raw = fs.readFileSync(teamsPath, 'utf-8');
  return JSON.parse(raw) as RawTeam[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function roundTo(n: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
}

function normalizeForCompare(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'number') {
      return roundTo(obj, 6);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(normalizeForCompare);
  }
  const out: any = {};
  for (const k of Object.keys(obj)) {
    out[k] = normalizeForCompare(obj[k]);
  }
  return out;
}

function analysesMatch(a: AnalysisSummary, b: AnalysisSummary): boolean {
  return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
}

function runSimulations(teamA: RawTeam, teamB: RawTeam, numGames: number): AnalysisSummary {
  const playerNames: Record<string, string> = {};
  for (const t of [teamA, teamB]) {
    for (const p of t.players) {
      playerNames[p.id] = p.name;
    }
  }

  let totalScoreA = 0;
  let totalScoreB = 0;
  let totalPoss = 0;
  let totalPossA = 0;
  let totalPossB = 0;

  let winsA = 0;
  let winsB = 0;

  const diffs: number[] = [];

  const playerTotals: Record<string, number> = {};
  const playerGames: Record<string, number> = {};
  const playerMax: Record<string, number> = {};

  let highestSinglePoints = 0;
  let highestSinglePlayerId = '';

  // Aggregates for new box score rates (only from data that already exists in simulation output)
  let grandFGM = 0;
  let grandFGA = 0;
  let grand3PM = 0;
  let grand3PA = 0;
  let grandRebounds = 0;
  let grandAssists = 0;
  let grandTurnovers = 0;

  for (let i = 0; i < numGames; i++) {
    const result = simulateGame(teamA, teamB, { seed: 1000 + i });

    const scoreA = result.finalScoreA;
    const scoreB = result.finalScoreB;

    totalScoreA += scoreA;
    totalScoreB += scoreB;

    const n = result.possessions.length;
    totalPoss += n;

    let pA = 0;
    let pB = 0;
    for (const poss of result.possessions) {
      if (poss.offenseTeamId === teamA.id) pA++;
      else if (poss.offenseTeamId === teamB.id) pB++;
    }
    totalPossA += pA;
    totalPossB += pB;

    const diff = Math.abs(scoreA - scoreB);
    diffs.push(diff);

    if (scoreA > scoreB) winsA++;
    else if (scoreB > scoreA) winsB++;

    // Player scoring (from existing pointsScored)
    for (const [pid, pts] of Object.entries(result.pointsScored)) {
      if (playerTotals[pid] === undefined) {
        playerTotals[pid] = 0;
        playerGames[pid] = 0;
        playerMax[pid] = 0;
      }
      playerTotals[pid] += pts;
      playerGames[pid] += 1;
      if (pts > playerMax[pid]) {
        playerMax[pid] = pts;
      }
      if (pts > highestSinglePoints) {
        highestSinglePoints = pts;
        highestSinglePlayerId = pid;
      }
    }

    // Accumulate natural box score aggregates from playerStats produced by the engine
    for (const ps of Object.values(result.playerStats)) {
      grandFGM += ps.fieldGoalsMade;
      grandFGA += ps.fieldGoalsAttempted;
      grand3PM += ps.threePointersMade;
      grand3PA += ps.threePointersAttempted;
      grandRebounds += ps.rebounds;
      grandAssists += ps.assists;
      grandTurnovers += ps.turnovers;
    }
  }

  const games = numGames;
  const avgScoreA = totalScoreA / games;
  const avgScoreB = totalScoreB / games;
  const avgPossessions = totalPoss / games;

  const totalPoints = totalScoreA + totalScoreB;
  const pointsPerPossession = totalPoints / totalPoss;

  // ORtg / DRtg calculated from aggregate points per own offensive possessions
  const avgOrtgA = totalPossA > 0 ? (totalScoreA / totalPossA) * 100 : 0;
  const avgOrtgB = totalPossB > 0 ? (totalScoreB / totalPossB) * 100 : 0;
  const avgDrtgA = totalPossB > 0 ? (totalScoreB / totalPossB) * 100 : 0;
  const avgDrtgB = totalPossA > 0 ? (totalScoreA / totalPossA) * 100 : 0;

  const offensiveRating = (avgOrtgA + avgOrtgB) / 2;
  const defensiveRating = (avgDrtgA + avgDrtgB) / 2;

  const winRateA = (winsA / games) * 100;
  const winRateB = (winsB / games) * 100;

  const minDiff = diffs.length > 0 ? Math.min(...diffs) : 0;
  const maxDiff = diffs.length > 0 ? Math.max(...diffs) : 0;
  const avgDiff = diffs.length > 0 ? diffs.reduce((s, d) => s + d, 0) / diffs.length : 0;
  const medianDiff = median(diffs);

  // Player stats
  const playerList: PlayerStat[] = Object.keys(playerTotals).map((pid) => ({
    name: playerNames[pid] || pid,
    ppg: playerTotals[pid] / playerGames[pid],
  }));
  playerList.sort((a, b) => b.ppg - a.ppg);
  const topScorers = playerList.slice(0, 10);

  const highestSingle: HighestSingle = {
    name: playerNames[highestSinglePlayerId] || highestSinglePlayerId,
    points: highestSinglePoints,
  };

  // Shooting percentages (combined over all player-games)
  const avgFgPct = grandFGA > 0 ? (grandFGM / grandFGA) * 100 : 0;
  const avgThreePtPct = grand3PA > 0 ? (grand3PM / grand3PA) * 100 : 0;

  // Per-team averages (both teams share the game, so divide by 2)
  const avgReboundsPerTeam = (grandRebounds / games) / 2;
  const avgAssistsPerTeam = (grandAssists / games) / 2;
  const avgTurnoversPerTeam = (grandTurnovers / games) / 2;

  return {
    games,
    avgScoreA,
    avgScoreB,
    teamNameA: teamA.name,
    teamNameB: teamB.name,
    avgPossessions,
    pointsPerPossession,
    offensiveRating,
    defensiveRating,
    winRateA,
    winRateB,
    minDiff,
    maxDiff,
    avgDiff,
    medianDiff,
    topScorers,
    highestSingle,
    avgFgPct,
    avgThreePtPct,
    avgReboundsPerTeam,
    avgAssistsPerTeam,
    avgTurnoversPerTeam,
  };
}

function printReport(summary: AnalysisSummary) {
  console.log('=================================');
  console.log('SIMULATION ANALYSIS REPORT');
  console.log('');
  console.log(`Games Simulated: ${summary.games}`);
  console.log('');
  console.log('Average Score:');
  console.log(`${summary.teamNameA}: ${summary.avgScoreA.toFixed(1)}`);
  console.log(`${summary.teamNameB}: ${summary.avgScoreB.toFixed(1)}`);
  console.log('');
  console.log('Average Possessions:');
  console.log(summary.avgPossessions.toFixed(1));
  console.log('');
  console.log('Points Per Possession:');
  console.log(summary.pointsPerPossession.toFixed(2));
  console.log('');
  console.log('Offensive Rating:');
  console.log(summary.offensiveRating.toFixed(1));
  console.log('');
  console.log('Defensive Rating:');
  console.log(summary.defensiveRating.toFixed(1));
  console.log('');
  console.log('Win Rate:');
  console.log(`${summary.teamNameA}: ${summary.winRateA.toFixed(1)}%`);
  console.log(`${summary.teamNameB}: ${summary.winRateB.toFixed(1)}%`);
  console.log('');
  console.log('Score Differential:');
  console.log(`Min: ${summary.minDiff}`);
  console.log(`Max: ${summary.maxDiff}`);
  console.log(`Average: ${summary.avgDiff.toFixed(1)}`);
  console.log(`Median: ${summary.medianDiff.toFixed(1)}`);
  console.log('');
  console.log('Top Scorers:');
  console.log('');
  summary.topScorers.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.name} - ${p.ppg.toFixed(1)} PPG`);
  });
  console.log('');
  console.log('Highest Single Game:');
  console.log(`${summary.highestSingle.name} - ${summary.highestSingle.points} points`);
  console.log('');
  console.log('Average FG%:');
  console.log(`${summary.avgFgPct.toFixed(1)}%`);
  console.log('');
  console.log('Average 3PT%:');
  console.log(`${summary.avgThreePtPct.toFixed(1)}%`);
  console.log('');
  console.log('Average Rebounds (per team):');
  console.log(summary.avgReboundsPerTeam.toFixed(1));
  console.log('');
  console.log('Average Assists (per team):');
  console.log(summary.avgAssistsPerTeam.toFixed(1));
  console.log('');
  console.log('Average Turnovers (per team):');
  console.log(summary.avgTurnoversPerTeam.toFixed(1));
  console.log('');
  console.log('Deterministic:');
  // The caller will fill TRUE/FALSE after the second run
}

function main() {
  const teams = loadTeams();
  if (teams.length < 2) {
    console.error('Need at least 2 teams in data/teams.json');
    process.exit(1);
  }

  const teamA = teams[0];
  const teamB = teams[1];

  const NUM_GAMES = 1000;

  // First full analysis
  const analysis1 = runSimulations(teamA, teamB, NUM_GAMES);

  // Second full analysis (identical seeds)
  const analysis2 = runSimulations(teamA, teamB, NUM_GAMES);

  const deterministic = analysesMatch(analysis1, analysis2);

  // Print the report using first run
  printReport(analysis1);

  // Print the determinism result at the end (as shown in example)
  console.log(deterministic ? 'TRUE' : 'FALSE');
}

main();
