const pool = require('../config/dbConfig');
const { appendRecord } = require('../services/jsonService');
const { spawnSync } = require('child_process');
const path = require('path');

exports.predict = async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error:'symbol manquant' });

  const script = path.resolve(__dirname, '../../../agent/predict.py');
  const out = spawnSync('python',[script,symbol],{encoding:'utf8'});
  if (out.status !== 0) {
    return res.status(500).json({ error: out.stderr });
  }
  const { action, label } = JSON.parse(out.stdout);
  const timestamp = new Date().toISOString();

  try {
    await pool.query(
      'INSERT INTO history(symbol,timestamp,action) VALUES($1,$2,$3)',
      [symbol, timestamp, label]
    );
  } catch (e) {
    return res.status(500).json({ error:'DB error' });
  }

  appendRecord('history',{symbol,timestamp,action:label});
  res.json({ symbol, action: label, timestamp });
};
