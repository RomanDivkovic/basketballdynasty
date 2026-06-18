// Save system placeholder.
// Will handle serializing GameResult, Team, Player state, etc. in later phases.
export interface SaveMetadata {
  version: string;
  timestamp: string;
}

export function createSaveMetadata(): SaveMetadata {
  return {
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  };
}
