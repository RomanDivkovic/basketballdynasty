import * as fs from 'fs';
import * as path from 'path';
import type { SeasonState } from './index';
import { parseSaveBundle } from '@basketball-dynasty/save-system';

export function loadSeasonSnapshot(filePath: string): SeasonState {
  const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
  const bundle = parseSaveBundle<SeasonState>(raw);
  return bundle.data;
}
