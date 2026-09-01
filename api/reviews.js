const { REVIEWS, setCorsHeaders, getSessionUser, saveReviewToDisk, loadDiskReviews } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ===== GET: FETCH REVIEWS & AGGREGATES =====
  if (req.method === 'GET') {
    const query = req.query || {};
    const listingId = query.listingId ? String(query.listingId).trim() : '';
    const userEmail = query.userEmail ? String(query.userEmail).trim().toLowerCase() : '';

    const diskReviews = loadDiskReviews();
    const allReviews = diskReviews.length > 0 ? diskReviews : REVIEWS;

    let filtered = allReviews;
    if (listingId) {
      filtered = filtered.filter(r => String(r.listingId) === listingId);
    }
    if (userEmail) {
      filtered = filtered.filter(r => r.authorEmail && r.authorEmail.toLowerCase() === userEmail);
    }

    // Calculate detailed aggregates
    const count = filtered.length;
    let avgRating = 0;
    let avgSafety = 0;
    let avgLandlord = 0;
    let avgWaterPower = 0;
    const starDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    if (count > 0) {
      const sumRating = filtered.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      const sumSafety = filtered.reduce((acc, r) => acc + (Number(r.safetyScore) || Number(r.rating) || 0), 0);
      const sumLandlord = filtered.reduce((acc, r) => acc + (Number(r.landlordScore) || Number(r.rating) || 0), 0);
      const sumWaterPower = filtered.reduce((acc, r) => acc + (Number(r.waterPowerScore) || Number(r.rating) || 0), 0);

      avgRating = Number((sumRating / count).toFixed(1));
      avgSafety = Number((sumSafety / count).toFixed(1));
      avgLandlord = Number((sumLandlord / count).toFixed(1));
      avgWaterPower = Number((sumWaterPower / count).toFixed(1));

      filtered.forEach(r => {
        const rounded = Math.round(Number(r.rating) || 5);
        const star = Math.max(1, Math.min(5, rounded));
        starDistribution[star] = (starDistribution[star] || 0) + 1;
      });
    }

    return res.status(200).json({
      reviews: filtered,
      totalCount: count,
      aggregates: {
        averageRating: avgRating,
        safetyRating: avgSafety,
        landlordRating: avgLandlord,
        waterPowerRating: avgWaterPower,
        starDistribution: starDistribution
      }
    });
  }

  // ===== POST: SUBMIT TENANT REVIEW =====
  if (req.method === 'POST') {
    const s = getSessionUser(req);
    const body = req.body || {};

    const { listingId, listingName, rating, comment, safetyScore, landlordScore, waterPowerScore, authorName, authorEmail, tenantStatus } = body;

    if (!listingId || !rating || !comment) {
      return res.status(400).json({ error: 'Property listingId, star rating (1-5), and review comment are required.' });
    }

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const numSafety = Number(safetyScore) || numRating;
    const numLandlord = Number(landlordScore) || numRating;
    const numWater = Number(waterPowerScore) || numRating;

    const email = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (authorEmail ? String(authorEmail).trim().toLowerCase() : '');
    const name = (s && s.user && s.user.name) ? s.user.name : (authorName ? String(authorName).trim() : 'Verified Renter');

    const newReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      listingId: String(listingId),
      listingName: listingName || 'Rental Property',
      rating: numRating,
      safetyScore: numSafety,
      landlordScore: numLandlord,
      waterPowerScore: numWater,
      comment: String(comment).trim(),
      authorName: name,
      authorEmail: email,
      authorAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email || name)}`,
      tenantStatus: tenantStatus || 'Verified Resident',
      verifiedResident: true,
      helpfulVotes: 0,
      createdAt: new Date().toISOString()
    };

    REVIEWS.unshift(newReview);
    saveReviewToDisk(newReview);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: newReview
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
