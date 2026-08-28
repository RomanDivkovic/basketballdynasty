import * as path from 'path';
import * as fs from 'fs';
import { createSeasonState, playNextRound, saveSeasonSnapshot } from '../index';
import type { Team } from '@basketball-dynasty/shared-types';

function loadTeams(): Team[] {
  const dataPath = path.join(process.cwd(), 'data', 'teams.json');
  if (!fs.existsSync(dataPath)) {
    console.error('data/teams.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as Team[];
}

function main() {
  const teams = loadTeams();
  const season = createSeasonState(teams, 'season-cli');
  const played = playNextRound(season, 10, { seed: 2026 });
  console.log('Played', played.results.length, 'games. Top standings:');
  console.log(played.standings.slice(0, 5));
  const out = path.join(process.cwd(), 'data', 'season-snapshot.json');
  saveSeasonSnapshot(out, played);
  console.log('Saved snapshot to', out);
}

main();
