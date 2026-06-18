# Basketball Dynasty Manager

Modular basketball simulation engine (Football Manager style long-term management game).

## Current Phase: Phase 1 - Simulation Engine Foundation

**Only the simulation core is being built.** No UI, no frontend, no season systems.

## Architecture

```
/packages
  /shared-types        Core TypeScript interfaces
  /simulation-engine   The heart: possession-by-possession game simulation
  /data-loader         Stub loader for JSON data files
  /ai-coaching         Minimal heuristic play-style logic (placeholder)
  /save-system         Future save/load (skeleton only)

backend/               (future)
frontend/              EMPTY - DO NOT TOUCH
```

## Key Packages

- **@basketball-dynasty/shared-types**: Player, Team, Coach, GameState, PossessionResult, GameResult
- **@basketball-dynasty/simulation-engine**: `simulateGame(teamA, teamB)` → realistic, stochastic, debuggable results
- **@basketball-dynasty/ai-coaching**: Very basic tendencies (no ML)
- **@basketball-dynasty/data-loader**: Loads `players.json` / `teams.json` from disk

## Running the Simulation (after build)

```bash
npm install
npm run build
node -e '
  const { simulateGame } = require("./packages/simulation-engine");
  const teams = require("./data/teams.json");
  const result = simulateGame(teams[0], teams[1], { seed: 12345 });
  console.log(result.finalScoreA, "-", result.finalScoreB);
  console.log(result.possessions.slice(0, 5).map(p => p.description));
'
```

## Design Goals

- Realistic NBA feel
- Deterministic with seed for debugging
- Stochastic enough to feel alive
- Loosely coupled packages
- Minimal scope per phase
# basketballdynasty
