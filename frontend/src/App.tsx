import React, { useState } from 'react';

async function api(path: string, method = 'GET', body?: any) {
  const opts: any = { method };
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  return res.json();
}

export default function App() {
  const [out, setOut] = useState<any>('No output yet.');

  return (
    <div style={{ padding: 16 }}>
      <h1>Basketball Dynasty — Frontend (Dev)</h1>
      <div>
        <button onClick={async () => { setOut('Initializing...'); const r = await api('/api/init','POST'); setOut(r); }}>Init Dynasty</button>
        <button onClick={async () => { setOut('Status...'); const r = await api('/api/status'); setOut(r); }}>Status</button>
        <button onClick={async () => { setOut('Advance game...'); const r = await api('/api/advance-game','POST'); setOut(r); }}>Advance Game</button>
        <button onClick={async () => { setOut('Advance season...'); const r = await api('/api/advance-season','POST'); setOut(r); }}>Advance Season</button>
        <button onClick={async () => { setOut('Play 5 games...'); const r = await api('/api/play-rounds','POST',{ n: 5 }); setOut(r); }}>Play 5 Games</button>
      </div>
      <pre style={{ marginTop: 12, background: '#111', color: '#eee', padding: 12 }}>{typeof out === 'string' ? out : JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}
