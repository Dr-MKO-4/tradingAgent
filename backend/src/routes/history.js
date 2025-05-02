// history.js
const r = require('express').Router();
const { history } = require('../controllers/historyController');
r.get('/', history);
module.exports = r;