// metrics.js
const r = require('express').Router();
const { metrics } = require('../controllers/metricsController');
r.get('/', metrics);
module.exports = r;