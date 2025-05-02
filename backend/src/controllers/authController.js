const jwt = require('jsonwebtoken');
const { createUser, findUser } = require('../services/authService');

exports.register = async (req,res) => {
  const { username, password } = req.body;
  if (await findUser(username)) {
    return res.status(409).json({ error:'User exists' });
  }
  await createUser(username, password);
  res.status(201).json({ status:'registered' });
};

exports.login = async (req,res) => {
  const { username, password } = req.body;
  const user = await findUser(username);
  if (!user) return res.status(401).json({ error:'Bad creds' });
  const match = await require('bcrypt').compare(password, user.password);
  if (!match) return res.status(401).json({ error:'Bad creds' });
  const token = jwt.sign({ id:user.id }, process.env.JWT_SECRET);
  res.json({ access_token: token });
};
