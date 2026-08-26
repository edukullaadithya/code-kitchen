const { INQUIRIES, setCorsHeaders, getSessionUser } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    const s = getSessionUser(req);
    const ownerEmail = (s && s.user) ? s.user.email : (req.query.ownerEmail || 'admin@rentright.com');
    const myInquiries = INQUIRIES.filter(i => (!i.ownerEmail) || i.ownerEmail === ownerEmail);
    return res.status(200).json({ inquiries: myInquiries });
  }

  if (req.method === 'POST') {
    const b = req.body || {};
    if (!b.listingName || !b.userName || !b.phone) return res.status(400).json({ error: 'Name, phone, and property name are required.' });
    const inquiry = {
      id: 'inq_' + Date.now(),
      listingId: b.listingId,
      listingName: b.listingName,
      ownerEmail: b.ownerEmail || 'admin@rentright.com',
      userName: b.userName,
      userEmail: b.userEmail || '',
      phone: b.phone,
      moveInDate: b.moveInDate || '',
      message: b.message || '',
      createdAt: new Date().toISOString()
    };
    INQUIRIES.push(inquiry);
    return res.status(201).json({ success: true, inquiry });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
