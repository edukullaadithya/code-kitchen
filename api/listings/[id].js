const { LISTINGS, setCorsHeaders } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'DELETE') {
    const idToDelete = Number(req.query.id);
    for (const city of Object.keys(LISTINGS)) {
      const idx = LISTINGS[city].findIndex(item => item.id === idToDelete);
      if (idx !== -1) { LISTINGS[city].splice(idx, 1); return res.status(200).json({ success: true }); }
    }
    return res.status(400).json({ error: 'Listing not found.' });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
