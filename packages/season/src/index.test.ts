import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { Player, Team } from '@basketball-dynasty/shared-types';
import { generateSchedule, playSeason, saveSeasonSnapshot } from './index';

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

test('playSeason produces standings and full results for a schedule', () => {
  const teams = [makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')];
  const season = playSeason(teams, 'season-1', { seed: 42 });

  assert.equal(season.schedule.length, 2);
  assert.equal(season.results.length, 2);
  assert.equal(season.standings.length, 2);
  assert.equal(season.completed, true);
  assert.equal(season.standings[0].teamId !== '', true);
});

test('saveSeasonSnapshot persists a season snapshot to disk', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'season-snapshot-'));
  const filePath = path.join(tempDir, 'season.json');
  const season = playSeason([makeTeam('a', 'Alpha'), makeTeam('b', 'Beta')], 'season-1', { seed: 7 });

  saveSeasonSnapshot(filePath, season);

  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  assert.equal(parsed.metadata.kind, 'season');
  assert.equal(parsed.data.seasonId, 'season-1');
  assert.equal(parsed.data.standings.length, 2);

  fs.rmSync(tempDir, { recursive: true, force: true });
});
