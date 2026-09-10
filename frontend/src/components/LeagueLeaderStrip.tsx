import React from 'react';
import type { Player } from '../../../packages/shared-types/src';
import { computeOverallRating } from '../hooks/useDynastyDashboard';

type LeagueLeaderStripProps = {
  leader: (Player & { teamName: string }) | null;
};

export function LeagueLeaderStrip({ leader }: LeagueLeaderStripProps) {
  if (!leader) {
    return null;
  }

  return (
    <footer className="bottom-strip">
      <div>
        <span className="muted">League leader</span>
        <strong>{leader.name}</strong>
      </div>
      <div>
        <span className="muted">Peak strength</span>
        <strong>{computeOverallRating(leader)}</strong>
      </div>
    </footer>
  );
}
