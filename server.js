const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('FATAL: SUPABASE_URL dan SUPABASE_SERVICE_KEY wajib di-set sebagai environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const SYNC_KEYS = [
  'competition_settings_v1',
  'teams',
  'team_rosters_v1',
  'matches_v2',
  'player_photos_v1',
  'access_users_v1',
  'initial_goals_v1',
  'sponsors_v1',
  'finance_reports_v1'
];

async function readState() {
  const { data, error } = await supabase
    .from('app_state')
    .select('key, value')
    .in('key', SYNC_KEYS);

  if (error) {
    console.error('Gagal baca state dari Supabase:', error.message);
    return {};
  }

  const out = {};
  for (const row of data || []) {
    out[row.key] = row.value;
  }
  return out;
}

async function writeState(nextState) {
  const rows = SYNC_KEYS
    .filter(k => Object.prototype.hasOwnProperty.call(nextState, k))
    .map(k => ({ key: k, value: nextState[k], updated_at: new Date().toISOString() }));

  if (rows.length === 0) return {};

  const { error } = await supabase
    .from('app_state')
    .upsert(rows, { onConflict: 'key' });

  if (error) {
    console.error('Gagal simpan state ke Supabase:', error.message);
    throw error;
  }

  const clean = {};
  rows.forEach(r => { clean[r.key] = r.value; });
  return clean;
}

app.use(express.json({ limit: '25mb' }));
// beforeunload sync pakai sendBeacon kirim sebagai text/plain, jadi kita terima itu juga
app.use(express.text({ type: 'text/plain', limit: '25mb' }));

app.get('/health', async (_req, res) => {
  const { error } = await supabase.from('app_state').select('key').limit(1);
  res.json({ ok: !error, app: 'FC Sombong League', status: error ? 'db_error' : 'healthy' });
});

app.get('/api/state', async (_req, res) => {
  res.json(await readState());
});

app.post('/api/state', async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    const saved = await writeState(body || {});
    res.json({ ok: true, savedKeys: Object.keys(saved) });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Gagal simpan ke database' });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    const { error } = await supabase.from('app_state').delete().in('key', SYNC_KEYS);
    if (error) throw error;
    res.json({ ok: true, reset: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Gagal reset database' });
  }
});

app.use(express.static(__dirname));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FC Sombong League running on port ${PORT}`);
  console.log(`Data disimpan di Supabase: ${SUPABASE_URL}`);
});
