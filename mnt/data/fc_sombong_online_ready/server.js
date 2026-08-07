const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const BACKUP_FILE = path.join(DATA_DIR, 'state.backup.json');
const TEMP_FILE = path.join(DATA_DIR, 'state.tmp.json');

const SYNC_KEYS = [
  'competition_settings_v1',
  'teams',
  'team_rosters_v1',
  'matches_v2',
  'player_photos_v1',
  'access_users_v1'
];

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

function readState() {
  ensureDataFile();

  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');

    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch (err) {
    console.error('Failed to read state file:', err);
    return {};
  }
}

function parseObjectValue(value) {
  if (!value) return {};

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (err) {
      console.error('Failed to parse object value:', err);
      return {};
    }
  }

  return {};
}

function createBackup() {
  ensureDataFile();

  try {
    if (fs.existsSync(STATE_FILE)) {
      fs.copyFileSync(STATE_FILE, BACKUP_FILE);
    }
  } catch (err) {
    console.error('Failed to create state backup:', err);
  }
}

function writeState(incomingState) {
  ensureDataFile();

  const currentState = readState();
  const nextState = { ...currentState };

  for (const key of SYNC_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(incomingState, key)) {
      continue;
    }

    if (key === 'player_photos_v1') {
      const existingPhotos = parseObjectValue(currentState[key]);
      const incomingPhotos = parseObjectValue(incomingState[key]);

      const mergedPhotos = {
        ...existingPhotos,
        ...incomingPhotos
      };

      // Pertahankan format string agar kompatibel dengan HTML saat ini.
      nextState[key] = JSON.stringify(mergedPhotos);
    } else {
      nextState[key] = incomingState[key];
    }
  }

  const clean = {};
  for (const key of SYNC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(nextState, key)) {
      clean[key] = nextState[key];
    }
  }

  createBackup();

  try {
    fs.writeFileSync(
      TEMP_FILE,
      JSON.stringify(clean, null, 2),
      'utf8'
    );

    fs.renameSync(TEMP_FILE, STATE_FILE);
  } catch (err) {
    console.error('Failed to write state file:', err);

    // Bersihkan temporary file jika penulisan gagal.
    try {
      if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE);
    } catch (_cleanupErr) {}

    throw err;
  }

  return clean;
}

app.use(express.json({ limit: '100mb' }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'FC Sombong League',
    status: 'healthy'
  });
});

app.get('/api/state', (_req, res) => {
  res.json(readState());
});

app.post('/api/state', (req, res) => {
  try {
    const saved = writeState(req.body || {});

    res.json({
      ok: true,
      savedKeys: Object.keys(saved)
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: 'Gagal menyimpan data liga.'
    });
  }
});

function getStoredSuperAdminPassword() {
  const state = readState();

  try {
    const settingsRaw = state.competition_settings_v1;
    const settings = typeof settingsRaw === 'string'
      ? JSON.parse(settingsRaw || '{}')
      : (settingsRaw || {});

    return (
      settings.superAdminPassword ||
      process.env.SUPERADMIN_PASSWORD ||
      'superadmin'
    );
  } catch (_err) {
    return process.env.SUPERADMIN_PASSWORD || 'superadmin';
  }
}

app.post('/api/reset', (req, res) => {
  const password = String(
    (req.body && req.body.password) || ''
  ).trim();

  if (password !== getStoredSuperAdminPassword()) {
    return res.status(403).json({
      ok: false,
      error: 'Password Super Admin salah.'
    });
  }

  ensureDataFile();
  createBackup();

  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({}, null, 2),
    'utf8'
  );

  res.json({
    ok: true,
    reset: true
  });
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
  console.log(`Backup data file: ${BACKUP_FILE}`);
});
