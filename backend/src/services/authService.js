const pool = require('../config/dbConfig');
const bcrypt = require('bcrypt');

async function createUser(username, password) {
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users(username,password) VALUES($1,$2)',
    [username, hash]
  );
}

async function findUser(username) {
  const res = await pool.query(
    'SELECT * FROM users WHERE username=$1', [username]
  );
  return res.rows[0];
}

module.exports = { createUser, findUser };
