import { simulateGame } from '../simulateGame';
import * as fs from 'fs';
import * as path from 'path';

interface TeamData {
  id: string;
  name: string;
  players: any[];
}

function loadTeams(): TeamData[] {
  // From src/debug/runGame.ts -> after build: dist/debug/runGame.js
  // Relative to reach repo root data: ../../../../data/teams.json
  const teamsPath = path.join(__dirname, '../../../../data/teams.json');
  const raw = fs.readFileSync(teamsPath, 'utf-8');
  return JSON.parse(raw) as TeamData[];
}

function printFirstN(plays: { description: string }[], label: string, n = 10) {
  console.log(`\n--- ${label} first ${n} plays ---`);
  plays.slice(0, n).forEach((p, i) => {
    console.log(`${i + 1}. ${p.description}`);
  });
}

function runsMatchExactly(run1: any, run2: any): boolean {
  return JSON.stringify(run1) === JSON.stringify(run2);
}

function firstNDescriptionsMatch(run1: any, run2: any, n = 10): boolean {
  const a = run1.possessions.slice(0, n).map((p: any) => p.description);
  const b = run2.possessions.slice(0, n).map((p: any) => p.description);
  if (a.length !== b.length) return false;
  return a.every((desc: string, i: number) => desc === b[i]);
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

  const run1 = simulateGame(teamA, teamB, options);
  const run2 = simulateGame(teamA, teamB, options);

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
