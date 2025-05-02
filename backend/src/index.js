require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/fetch-data',require('./routes/fetch'));
app.use('/api/predict',   require('./routes/predict'));
app.use('/api/metrics',   require('./routes/metrics'));
app.use('/api/history',   require('./routes/history'));

app.listen(process.env.PORT, () =>
  console.log(`Listening on port ${process.env.PORT}`));
