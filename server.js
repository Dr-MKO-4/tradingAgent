require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

const useJSON = process.env.USE_JSON === 'true';
let pool = null;
if (!useJSON) {
  pool = new Pool({
    user:     process.env.PGUSER,
    host:     process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port:     process.env.PGPORT,
  });
}

// helpers JSON
const JSON_PATH = 'backend/data/history.json';
function readJSON() {
  return JSON.parse(fs.readFileSync(JSON_PATH));
}
function writeJSON(data) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

// — Route POST /simulate — lance le training ou une simulation
app.post('/simulate', (req, res) => {
  const { symbol, episodes } = req.body;
  // option : appeler ton script python en tâche de fond
  const py = spawn('python', ['train.py', symbol, episodes], { cwd: '..' });
  py.stdout.on('data', d => console.log(`PYTHON: ${d}`));
  py.stderr.on('data', d => console.error(`PY ERR: ${d}`));
  res.json({ status: 'started', symbol, episodes });
});

// — Route GET /metrics — valeurs de portefeuille dans le temps
app.get('/metrics', async (req, res) => {
  if (!useJSON) {
    const result = await pool.query('SELECT date, portfolio_value FROM metrics ORDER BY date');
    return res.json(result.rows);
  } else {
    const data = readJSON().metrics || [];
    return res.json(data);
  }
});

// — Route GET /history — historique des trades
app.get('/history', async (req, res) => {
  if (!useJSON) {
    const result = await pool.query('SELECT * FROM history ORDER BY timestamp');
    return res.json(result.rows);
  } else {
    const data = readJSON().history || [];
    return res.json(data);
  }
});

// — Optionnel : route pour effacer l’historique JSON
app.delete('/history', (req, res) => {
  if (useJSON) {
    const d = readJSON();
    d.history = [];
    d.metrics = [];
    writeJSON(d);
    res.json({ status: 'cleared' });
  } else {
    res.status(400).json({ error: 'Not using JSON mode' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🍖🍜API running on http://localhost:${port}`));
