/**
 * Quick manual test of the simulation engine.
 * Run with: npx ts-node src/example.ts  (or after build: node dist/example.js)
 */
import { simulateGame } from './simulateGame';
import * as fs from 'fs';
import * as path from 'path';

const teamsPath = path.join(__dirname, '../../../../data/teams.json');
const teams = JSON.parse(fs.readFileSync(teamsPath, 'utf-8'));

const result = simulateGame(teams[0], teams[1], { seed: 424242, totalPossessions: 180 });

console.log('=== GAME RESULT ===');
console.log(`${teams[0].name} ${result.finalScoreA} - ${result.finalScoreB} ${teams[1].name}`);
console.log(`Total possessions simulated: ${result.possessions.length}`);
console.log('\n--- Sample play-by-play (first 8) ---');
result.possessions.slice(0, 8).forEach((p, i) => {
  console.log(`${i + 1}. ${p.description}`);
});

console.log('\n--- Top scorers ---');
const sorted = Object.entries(result.pointsScored)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
sorted.forEach(([pid, pts]) => {
  console.log(`${pid}: ${pts} pts`);
});
