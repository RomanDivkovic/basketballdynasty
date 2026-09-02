import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { Player, Team } from '@basketball-dynasty/shared-types';
import {
  generateSchedule,
  createSeasonState,
  playNextGame,
  playNextRound,
  saveSeasonSnapshot,
  runPlayoffs,
  createDynastyState,
  advanceToNextSeason,
  saveDynastySnapshot,
  loadDynastySnapshot,
} from './index';
import { assignContractIfFits } from './contracts';
import { applyOffseasonToTeams } from './offseason';
import { loadSeasonSnapshot } from './loader';

const makePlayer = (id: string, name: string, position: Player['position']): Player => ({
  id,
  name,
  position,
  ratings: {
    insideScoring: 70,
    midrange: 60,
    threePoint: 55,
    passing: 60,
    ballHandling: 62,
    rebounding: 58,
    interiorDefense: 64,
    perimeterDefense: 60,
    steals: 55,
    blocks: 58,
    athleticism: 66,
    stamina: 70,
    basketballIQ: 63,
    potential: 70,
  },
});

const makeTeam = (id: string, name: string): Team => ({
  id,
  name,
  players: [
    makePlayer(`${id}-1`, `${name} Star`, 'PG'),
    makePlayer(`${id}-2`, `${name} Wing`, 'SF'),
    makePlayer(`${id}-3`, `${name} Big`, 'C'),
    makePlayer(`${id}-4`, `${name} Guard`, 'SG'),
    makePlayer(`${id}-5`, `${name} Forward`, 'PF'),
  ],
});

test('generateSchedule creates a round-robin schedule for all teams', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta'), makeTeam('c', 'Gamma')];
  const schedule = generateSchedule(teams);

  assert.equal(schedule.length, 6);
  assert.equal(schedule[0].homeTeamId, 'a');
  assert.equal(schedule[1].homeTeamId, 'b');
});

test('stepwise season: create state and play next games/rounds deterministically', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')];
  const state = createSeasonState(teams, 'season-1');

  assert.equal(state.schedule.length, 2);
  assert.equal(state.results.length, 0);

  const after1 = playNextGame(state, { seed: 7 });
  assert.equal(after1.results.length, 1);
  assert.equal(after1.currentRound, 1);

  const after2 = playNextRound(after1, 10, { seed: 7 });
  // should complete remaining games
  assert.equal(after2.results.length, 2);
  assert.equal(after2.completed, true);
  assert.equal(after2.standings.length, 2);
});

test('saveSeasonSnapshot persists a season snapshot to disk', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'season-snapshot-'));
  const filePath = path.join(tempDir, 'season.json');
  const initial = createSeasonState([makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')], 'season-1');
  const season = playNextRound(initial, 100, { seed: 7 });

  saveSeasonSnapshot(filePath, season);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  assert.equal(parsed.metadata.kind, 'season');
  assert.equal(parsed.data.seasonId, 'season-1');
  assert.equal(parsed.data.standings.length, 2);

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('resume from saved snapshot and continue', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'season-resume-'));
  const filePath = path.join(tempDir, 'resume.json');

  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta'), makeTeam('c', 'Gamma')];
  const state = createSeasonState(teams, 'season-resume');

  const mid = playNextRound(state, 1, { seed: 11 });
  saveSeasonSnapshot(filePath, mid);

  const loaded = loadSeasonSnapshot(filePath);
  assert.equal(loaded.results.length, 1);

  const continued = playNextRound(loaded, 10, { seed: 11 });
  assert.equal(continued.results.length > 1, true);

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('playoffs produce a champion for top teams', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta'), makeTeam('c', 'Gamma'), makeTeam('d', 'Delta')];
  const state = createSeasonState(teams, 'season-playoffs');
  const finished = playNextRound(state, state.schedule.length, { seed: 99 });

  const result = runPlayoffs(finished, 4, { seed: 100 });
  assert.ok(result.championId !== null);
  assert.equal(typeof result.championId, 'string');
});

test('dynasty: create, finish season, advance to next season and persist', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')];
  const dynasty = createDynastyState(teams, 'dyn-1', 'a');

  assert.equal(dynasty.seasons.length, 0);
  assert.equal(dynasty.currentSeason.results.length, 0);

  // Play entire current season
  const finished = playNextRound(dynasty.currentSeason, dynasty.currentSeason.schedule.length, { seed: 42 });
  assert.equal(finished.completed, true);

  const advanced = advanceToNextSeason({ ...dynasty, currentSeason: finished }, { seed: 42 });
  assert.equal(advanced.seasons.length, 1);
  assert.equal(advanced.seasonNumber, 2);
  assert.equal(advanced.currentSeason.results.length, 0);

  // Persist and load
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dynasty-'));
  const filePath = path.join(tempDir, 'dyn.json');
  saveDynastySnapshot(filePath, advanced);
  const loaded = loadDynastySnapshot(filePath);
  assert.equal(loaded.seasonNumber, 2);

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('offseason mechanics: aging, development, and retirement', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')];

  // Make one player very old to force retirement
  const oldPlayer = teams[0].players[0];
  oldPlayer.age = 40;

  const dynasty = createDynastyState(teams, 'dyn-off', 'a');

  const finished = playNextRound(dynasty.currentSeason, dynasty.currentSeason.schedule.length, { seed: 5 });
  assert.equal(finished.completed, true);

  const advanced = advanceToNextSeason({ ...dynasty, currentSeason: finished }, { seed: 5 });

  // Archived season should still contain the old player
  const archived = advanced.seasons[0];
  const archivedHasOld = archived.teams[0].players.some((p) => p.id === oldPlayer.id);
  assert.equal(archivedHasOld, true);

  // New current season should NOT have the retired player
  const newHasOld = advanced.currentSeason.teams[0].players.some((p) => p.id === oldPlayer.id);
  assert.equal(newHasOld, false);
});

test('offseason draft fills rosters when many retire', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')];

  // Force all current players to be at retirement age so offseason must refill rosters
  teams.forEach((t) => t.players.forEach((p) => (p.age = 40)));

  const dynasty = createDynastyState(teams, 'dyn-draft', 'a');

  const finished = playNextRound(dynasty.currentSeason, dynasty.currentSeason.schedule.length, { seed: 123 });
  assert.equal(finished.completed, true);

  const advanced = advanceToNextSeason({ ...dynasty, currentSeason: finished }, { seed: 123 });

  const nextTeams = advanced.currentSeason.teams;
  const hasRookie = nextTeams.some((t) => t.players.some((p) => p.id.startsWith('rookie_')));
  assert.ok(hasRookie);
});

test('contracts: negotiation respects salary cap', () => {
  const teamA = makeTeam('a', 'Alpha');
  const teamB = makeTeam('b', 'Beta');

  // Give teamA a tiny cap so it can't sign high-value players
  (teamA as any).salaryCap = 100000;
  (teamB as any).salaryCap = 100000000;

  const freeAgent = makePlayer('fa1', 'Big FA', 'C');
  // make them high rated
  freeAgent.ratings.insideScoring = 90;
  freeAgent.ratings.potential = 85;

  // Try to sign to teamA (should fail)
  const okA = assignContractIfFits(freeAgent, teamA, 42);
  assert.equal(okA, false);

  // Try to sign to teamB (should succeed)
  const okB = assignContractIfFits(freeAgent, teamB, 42);
  assert.equal(okB, true);
  assert.ok(freeAgent.contract && freeAgent.contract.yearsRemaining > 0);
});

test('coach development factor increases player growth', () => {
  const t1 = makeTeam('a', 'Alpha');
  const t2 = makeTeam('b', 'Beta');

  // Add a coach with positive development factor to t2
  t2.coach = { id: 'c1', name: 'Good Coach', offensiveStyle: 'pace', defensiveStyle: 'man', developmentFactor: 0.2 } as any;

  // Keep players with moderate potential
  t1.players.forEach((p) => (p.ratings.potential = 70));
  t2.players.forEach((p) => (p.ratings.potential = 70));

  const res1 = applyOffseasonToTeams([t1], 's1', [], { seed: 7, draftRounds: 0, rosterTarget: 5 });
  const res2 = applyOffseasonToTeams([t2], 's1', [], { seed: 7, draftRounds: 0, rosterTarget: 5 });

  // Compare average rating change for the first player
  const before = makeTeam('a', 'Alpha').players[0].ratings.insideScoring;
  const afterNoCoach = res1.teams[0].players[0].ratings.insideScoring;
  const afterCoach = res2.teams[0].players[0].ratings.insideScoring;

  // With coach, development should be >= without coach (not strictly guaranteed because of randomness, but with seed should hold)
  assert.ok(afterCoach >= afterNoCoach);
});
