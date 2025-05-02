const fs = require('fs');
const path = require('path');
const JSON_PATH = path.resolve(__dirname, '../../../data/history.json');

function appendRecord(type, record) {
  let data = { history: [], metrics: [] };
  if (fs.existsSync(JSON_PATH)) {
    data = JSON.parse(fs.readFileSync(JSON_PATH));
  }
  data[type].push(record);
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
}

module.exports = { appendRecord };
