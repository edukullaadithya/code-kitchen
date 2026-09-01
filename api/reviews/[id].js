const { REVIEWS, setCorsHeaders, getSessionUser, deleteReviewFromDisk } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const reviewId = req.query.id;
  if (!reviewId) return res.status(400).json({ error: 'Review ID is required.' });

  if (req.method === 'DELETE') {
    const s = getSessionUser(req);
    const idx = REVIEWS.findIndex(r => String(r.id) === String(reviewId));
    if (idx !== -1) {
      const rev = REVIEWS[idx];
      // Check author or admin permission
      if (s && s.user && s.user.role !== 'admin' && rev.authorEmail && s.user.email.toLowerCase() !== rev.authorEmail.toLowerCase()) {
        return res.status(403).json({ error: 'You do not have permission to delete this review.' });
      }
      REVIEWS.splice(idx, 1);
    }
    deleteReviewFromDisk(reviewId);

    return res.status(200).json({ success: true, message: 'Review removed successfully.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
