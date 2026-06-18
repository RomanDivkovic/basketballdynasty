import { Player, Team } from '@basketball-dynasty/shared-types';
import * as fs from 'fs';
import * as path from 'path';

export interface DataLoadOptions {
  dataRoot?: string;
}

/**
 * Stub data loader.
 * Currently supports loading players.json and teams.json from disk.
 * No API fetching. Simple synchronous read for now.
 */
export class DataLoader {
  private dataRoot: string;

  constructor(options: DataLoadOptions = {}) {
    this.dataRoot = options.dataRoot ?? path.join(process.cwd(), 'data');
  }

  loadPlayers(): Player[] {
    const file = path.join(this.dataRoot, 'players.json');
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as Player[];
  }

  loadTeams(): Team[] {
    const file = path.join(this.dataRoot, 'teams.json');
    if (!fs.existsSync(file)) {
      return [];
    }
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as Team[];
  }

  // Future: loadCoaches, loadGameLogs, etc.
}
