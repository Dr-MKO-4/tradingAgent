const { appendRecord } = require('../services/jsonService');
const pool = require('../config/dbConfig');

exports.metrics = async (req,res) => {
  const { rows } = await pool.query('SELECT * FROM metrics');
  res.json(rows);
};
