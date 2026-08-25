import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import type { Player, Team } from '@basketball-dynasty/shared-types';
import {
  buildLeagueSnapshot,
  createGameSummary,
  createSaveBundle,
  loadBundleFromDisk,
  parseSaveBundle,
  saveBundleToDisk,
  serializeSaveBundle,
} from './index';

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

const teamA: Team = {
  id: 'team-a',
  name: 'Alpha',
  players: [makePlayer('pa1', 'A1', 'PG'), makePlayer('pa2', 'A2', 'SF')],
};

const teamB: Team = {
  id: 'team-b',
  name: 'Beta',
  players: [makePlayer('pb1', 'B1', 'PG'), makePlayer('pb2', 'B2', 'PF')],
};

test('buildLeagueSnapshot orders teams by win percentage and points differential', () => {
  const snapshot = buildLeagueSnapshot(
    [teamA, teamB],
    [
      { teamAId: 'team-a', teamBId: 'team-b', finalScoreA: 110, finalScoreB: 98 },
      { teamAId: 'team-b', teamBId: 'team-a', finalScoreA: 102, finalScoreB: 99 },
    ],
    'season-1'
  );

  assert.equal(snapshot.seasonId, 'season-1');
  assert.equal(snapshot.standings[0].teamId, 'team-a');
  assert.equal(snapshot.standings[0].wins, 1);
  assert.equal(snapshot.standings[0].losses, 1);
  assert.equal(snapshot.standings[0].winPct, 0.5);
  assert.equal(snapshot.standings[0].pointDifferential, 9);
});

test('save bundle serialization round-trips through JSON', () => {
  const snapshot = buildLeagueSnapshot([teamA, teamB], [
    { teamAId: 'team-a', teamBId: 'team-b', finalScoreA: 110, finalScoreB: 98 },
  ]);

  const bundle = createSaveBundle(snapshot, 'league');
  const serialized = serializeSaveBundle(bundle);
  const parsed = parseSaveBundle<typeof snapshot>(serialized);

  assert.equal(parsed.data.seasonId, 'season-1');
  assert.equal(parsed.metadata.kind, 'league');
  assert.equal(parsed.data.standings[0].teamName, 'Alpha');
});

test('bundle can be saved and loaded from disk', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'basketball-dynasty-'));
  const filePath = path.join(tempDir, 'save.json');
  const gameSummary = createGameSummary({
    teamAId: 'team-a',
    teamBId: 'team-b',
    finalScoreA: 104,
    finalScoreB: 100,
    possessions: [],
    pointsScored: {},
  });

  saveBundleToDisk(filePath, gameSummary, 'game');
  const loaded = loadBundleFromDisk<typeof gameSummary>(filePath);

  assert.equal(loaded.data.teamAId, 'team-a');
  assert.equal(loaded.metadata.kind, 'game');

  fs.rmSync(tempDir, { recursive: true, force: true });
});
