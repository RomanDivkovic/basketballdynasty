const out = (v) => {
  const el = document.getElementById('output');
  el.textContent = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
};

async function api(path, method = 'GET', body) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const json = await res.json();
  return json;
}

document.getElementById('btn-init').addEventListener('click', async () => {
  out('Initializing...');
  const r = await api('/api/init', 'POST');
  out(r);
});

document.getElementById('btn-status').addEventListener('click', async () => {
  out('Loading status...');
  const r = await api('/api/status');
  out(r);
});

document.getElementById('btn-adv-game').addEventListener('click', async () => {
  out('Advancing one game...');
  const r = await api('/api/advance-game', 'POST', {});
  out(r);
});

document.getElementById('btn-adv-season').addEventListener('click', async () => {
  out('Advancing season (finish + offseason)...');
  const r = await api('/api/advance-season', 'POST', {});
  out(r);
});

document.getElementById('btn-play-5').addEventListener('click', async () => {
  out('Playing 5 games...');
  const r = await api('/api/play-rounds', 'POST', { n: 5 });
  out(r);
});

// auto-fetch teams on load
window.addEventListener('load', async () => {
  try {
    const s = await api('/api/status');
    if (s && s.dynasty) out({ msg: 'Loaded dynasty on startup', dynasty: s.dynasty });
  } catch (err) {
    out('No dynasty loaded yet. Click Init to create one.');
  }
});
