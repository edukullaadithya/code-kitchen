const { getRecommendedListings, setCorsHeaders } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const preferences = req.body || {};
    const listings = getRecommendedListings(preferences);
    return res.status(200).json({ listings, count: listings.length });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
