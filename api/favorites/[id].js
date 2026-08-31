const { FAVORITES, setCorsHeaders, getSessionUser, removeFavoriteFromDisk } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const idToTarget = req.query.id;
  if (!idToTarget) return res.status(400).json({ error: 'Favorite or listing ID is required.' });

  if (req.method === 'DELETE') {
    const s = getSessionUser(req);
    const userId = (s && s.user && s.user.id) ? s.user.id : (req.query.userId || '');

    removeFavoriteFromDisk(idToTarget, userId);
    const idx = FAVORITES.findIndex(f => (String(f.id) === String(idToTarget) || String(f.listingId) === String(idToTarget)) && (!userId || String(f.userId) === String(userId)));
    if (idx !== -1) {
      FAVORITES.splice(idx, 1);
    }

    return res.status(200).json({ success: true, message: 'Removed from favorites.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
