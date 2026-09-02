import * as path from 'path';
import * as fs from 'fs';
import type { Team } from '@basketball-dynasty/shared-types';
import {
  createDynastyState,
  saveDynastySnapshot,
  loadDynastySnapshot,
  advanceToNextSeason,
  playNextGame,
} from '../index';

function loadTeams(): Team[] {
  const dataPath = path.join(process.cwd(), 'data', 'teams.json');
  if (!fs.existsSync(dataPath)) {
    console.error('data/teams.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as Team[];
}

function usage() {
  console.log('Usage: node dist/bin/run-dynasty.js <command> [file] [seed]');
  console.log('Commands:');
  console.log('  init [file]           Create a new dynasty and save to [file] (default data/dynasty-snapshot.json)');
  console.log('  status [file]         Show dynasty status');
  console.log('  advance-season [file] [seed]  Finish current season and advance to next');
  console.log('  advance-game [file] [seed]    Play next game in current season');
  console.log('  help                  Show this message');
}

const argv = process.argv.slice(2);
const cmd = argv[0] || 'help';
const fileArg = argv[1];
const seedArg = argv[2];
const DEFAULT_FILE = path.join(process.cwd(), 'data', 'dynasty-snapshot.json');
const filePath = fileArg ? path.resolve(process.cwd(), fileArg) : DEFAULT_FILE;

switch (cmd) {
  case 'init': {
    const teams = loadTeams();
    const dynasty = createDynastyState(teams, 'dynasty-cli', teams[0]?.id);
    saveDynastySnapshot(filePath, dynasty);
    console.log('Created dynasty:', filePath);
    break;
  }
  case 'status': {
    if (!fs.existsSync(filePath)) {
      console.error('Dynasty file not found:', filePath);
      process.exit(1);
    }
    const d = loadDynastySnapshot(filePath);
    console.log(`Dynasty ${d.dynastyId} — season ${d.seasonNumber}`);
    const cs = d.currentSeason;
    console.log(`Current: ${cs.seasonId} (${cs.results.length}/${cs.schedule.length} games) completed=${cs.completed}`);
    console.log(`Archived seasons: ${d.seasons.length}`);
    console.log('Top standings (current):', cs.standings?.slice(0, 5) ?? []);
    break;
  }
  case 'advance-season': {
    if (!fs.existsSync(filePath)) {
      console.error('Dynasty file not found:', filePath);
      process.exit(1);
    }
    const d = loadDynastySnapshot(filePath);
    const seed = seedArg ? parseInt(seedArg, 10) : undefined;
    const advanced = advanceToNextSeason(d, { seed });
    saveDynastySnapshot(filePath, advanced);
    console.log(`Advanced dynasty to season ${advanced.seasonNumber} and saved to ${filePath}`);
    break;
  }
  case 'advance-game': {
    if (!fs.existsSync(filePath)) {
      console.error('Dynasty file not found:', filePath);
      process.exit(1);
    }
    const d = loadDynastySnapshot(filePath);
    const seed = seedArg ? parseInt(seedArg, 10) : undefined;
    const nextSeason = playNextGame(d.currentSeason, { seed });
    d.currentSeason = nextSeason;
    saveDynastySnapshot(filePath, d);
    const last = nextSeason.results[nextSeason.results.length - 1];
    if (last) {
      console.log(`Played: ${last.homeTeamId} ${last.homeScore} - ${last.awayTeamId} ${last.awayScore}`);
    } else {
      console.log('No game played (maybe season already complete)');
    }
    break;
  }
  case 'help':
  default: {
    usage();
    break;
  }
}
