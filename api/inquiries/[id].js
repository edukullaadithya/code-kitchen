const { INQUIRIES, setCorsHeaders } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'DELETE') {
    const idx = INQUIRIES.findIndex(i => i.id === req.query.id);
    if (idx !== -1) INQUIRIES.splice(idx, 1);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
