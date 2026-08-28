import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { Player, Team } from '@basketball-dynasty/shared-types';
import { generateSchedule, createSeasonState, playNextGame, playNextRound, saveSeasonSnapshot, runPlayoffs } from './index';
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
