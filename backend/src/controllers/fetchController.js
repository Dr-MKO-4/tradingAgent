const { spawn } = require('child_process');
const path = require('path');

exports.fetchData = (req, res) => {
  const symbol = req.params.symbol;
  const script = path.resolve(__dirname, '../../../agent/fetch_and_store.py');
  const py = spawn('python',[script,symbol],{detached:true,stdio:'ignore'});
  py.unref();
  res.status(202).json({ status:'started', symbol });
};
