const { appendRecord } = require('../services/jsonService');
const pool = require('../config/dbConfig');

exports.history = async (req,res) => {
  const { rows } = await pool.query('SELECT * FROM history');
  res.json(rows);
};
