const r = require('express').Router();
const { expressjwt: jwt } = require('express-jwt');
const { predict } = require('../controllers/predictController');
r.get('/', jwt({ secret: process.env.JWT_SECRET, algorithms:['HS256'] }), predict);
module.exports = r;