const { setCorsHeaders } = require('./_shared/data');

module.exports = function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  res.status(200).json({ status: 'ok', platform: 'vercel-serverless' });
};
