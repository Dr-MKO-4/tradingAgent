const r = require('express').Router();
const { fetchData } = require('../controllers/fetchController');
r.post('/:symbol',fetchData);
module.exports = r;