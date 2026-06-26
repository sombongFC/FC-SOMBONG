const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
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

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2));
}

function readState() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Failed to read state file:', err);
    return {};
  }
}

function writeState(nextState) {
  ensureDataFile();
  const clean = {};
  for (const key of SYNC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(nextState, key)) clean[key] = nextState[key];
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(clean, null, 2));
  return clean;
}

app.use(express.json({ limit: '25mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, app: 'FC Sombong League', status: 'healthy' });
});

app.get('/api/state', (_req, res) => {
  res.json(readState());
});

app.post('/api/state', (req, res) => {
  const saved = writeState(req.body || {});
  res.json({ ok: true, savedKeys: Object.keys(saved) });
});


app.post('/api/reset', (req, res) => {
  ensureDataFile();
  fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2));
  res.json({ ok: true, reset: true });
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
  ensureDataFile();
  console.log(`FC Sombong League running on port ${PORT}`);
  console.log(`Shared data file: ${STATE_FILE}`);
});
