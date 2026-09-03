const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const seasonPkgPath = path.resolve(__dirname, '..', 'packages', 'season', 'dist', 'index.js');
if (!fs.existsSync(seasonPkgPath)) {
  console.error('Compiled season package not found. Run `npm run build` from repo root first.');
  process.exit(1);
}

const season = require(seasonPkgPath);

const dataDir = path.resolve(__dirname, '..', 'data');
const defaultDynPath = path.join(dataDir, 'dynasty-snapshot.json');

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadTeams() {
  const p = path.join(dataDir, 'teams.json');
  if (!fs.existsSync(p)) return [];
  return readJSON(p);
}

function respondJSON(res, obj, status = 200) {
  const payload = JSON.stringify(obj, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(payload);
}

function serveStatic(req, res, parsed) {
  let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  const full = path.join(__dirname, 'static', filePath);
  if (!fs.existsSync(full)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(full).toLowerCase();
  const map = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };
  res.writeHead(200, { 'Content-Type': map[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(full).pipe(res);
}

function collectRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const method = req.method;

  // simple static router
  if (parsed.pathname === '/' || parsed.pathname.startsWith('/static/')) {
    return serveStatic(req, res, parsed);
  }

  // API routes
  try {
    if (method === 'GET' && parsed.pathname === '/api/teams') {
      return respondJSON(res, { teams: loadTeams() });
    }

    if (method === 'POST' && parsed.pathname === '/api/init') {
      const teams = loadTeams();
      const dynasty = season.createDynastyState(teams, 'dyn-web', teams[0]?.id);
      season.saveDynastySnapshot(defaultDynPath, dynasty);
      return respondJSON(res, { ok: true, path: defaultDynPath, dynasty });
    }

    if (method === 'GET' && parsed.pathname === '/api/status') {
      if (!fs.existsSync(defaultDynPath)) return respondJSON(res, { ok: false, error: 'dynasty snapshot not found' }, 404);
      const dyn = season.loadDynastySnapshot(defaultDynPath);
      return respondJSON(res, { ok: true, dynasty: dyn });
    }

    if (method === 'POST' && parsed.pathname === '/api/advance-game') {
      if (!fs.existsSync(defaultDynPath)) return respondJSON(res, { ok: false, error: 'dynasty snapshot not found' }, 404);
      const body = await collectRequestBody(req);
      const payload = body ? JSON.parse(body) : {};
      const dyn = season.loadDynastySnapshot(defaultDynPath);
      dyn.currentSeason = season.playNextGame(dyn.currentSeason, { seed: payload.seed });
      season.saveDynastySnapshot(defaultDynPath, dyn);
      const last = dyn.currentSeason.results[dyn.currentSeason.results.length - 1];
      return respondJSON(res, { ok: true, last, currentSeason: dyn.currentSeason });
    }

    if (method === 'POST' && parsed.pathname === '/api/advance-season') {
      if (!fs.existsSync(defaultDynPath)) return respondJSON(res, { ok: false, error: 'dynasty snapshot not found' }, 404);
      const body = await collectRequestBody(req);
      const payload = body ? JSON.parse(body) : {};
      const dyn = season.loadDynastySnapshot(defaultDynPath);
      const advanced = season.advanceToNextSeason(dyn, { seed: payload.seed });
      season.saveDynastySnapshot(defaultDynPath, advanced);
      return respondJSON(res, { ok: true, dynasty: advanced });
    }

    if (method === 'POST' && parsed.pathname === '/api/play-rounds') {
      // play N games in current season
      if (!fs.existsSync(defaultDynPath)) return respondJSON(res, { ok: false, error: 'dynasty snapshot not found' }, 404);
      const body = await collectRequestBody(req);
      const payload = body ? JSON.parse(body) : {};
      const n = payload.n || 1;
      const dyn = season.loadDynastySnapshot(defaultDynPath);
      for (let i = 0; i < n; i++) {
        dyn.currentSeason = season.playNextGame(dyn.currentSeason, { seed: payload.seed });
        if (dyn.currentSeason.completed) break;
      }
      season.saveDynastySnapshot(defaultDynPath, dyn);
      return respondJSON(res, { ok: true, currentSeason: dyn.currentSeason });
    }

    // unknown route
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (err) {
    console.error(err);
    respondJSON(res, { ok: false, error: String(err) }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
