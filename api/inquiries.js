const { INQUIRIES, setCorsHeaders, getSessionUser, saveInquiryToDisk, loadDiskInquiries } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ===== GET: FETCH INQUIRIES =====
  if (req.method === 'GET') {
    const s = getSessionUser(req);
    const query = req.query || {};
    const type = query.type || ''; // 'sent' or 'received'
    const diskInquiries = loadDiskInquiries();
    const allInquiries = diskInquiries.length > 0 ? diskInquiries : INQUIRIES;

    const userEmail = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (query.userEmail ? String(query.userEmail).trim().toLowerCase() : '');
    const ownerEmail = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (query.ownerEmail ? String(query.ownerEmail).trim().toLowerCase() : '');
    const statusFilter = query.status ? String(query.status).trim().toLowerCase() : '';

    let results = [];

    if (type === 'sent' || query.userEmail) {
      // Inquiries submitted by this renter
      results = allInquiries.filter(i => i.userEmail && i.userEmail.toLowerCase() === userEmail);
    } else if (type === 'received' || query.ownerEmail) {
      // Inquiries received by this admin/landlord
      results = allInquiries.filter(i => i.ownerEmail && i.ownerEmail.toLowerCase() === ownerEmail);
    } else {
      // Default: If user is admin, show received inquiries; if renter, show sent inquiries
      if (s && s.user && s.user.role === 'admin') {
        results = allInquiries.filter(i => !i.ownerEmail || i.ownerEmail.toLowerCase() === userEmail);
      } else if (userEmail) {
        results = allInquiries.filter(i => (i.userEmail && i.userEmail.toLowerCase() === userEmail) || (i.ownerEmail && i.ownerEmail.toLowerCase() === userEmail));
      } else {
        results = allInquiries;
      }
    }

    if (statusFilter) {
      results = results.filter(i => (i.status || 'pending').toLowerCase() === statusFilter);
    }

    return res.status(200).json({ inquiries: results, count: results.length });
  }

  // ===== POST: SUBMIT INQUIRY =====
  if (req.method === 'POST') {
    const s = getSessionUser(req);
    const b = req.body || {};
    if (!b.listingName || !b.userName || !b.phone) {
      return res.status(400).json({ error: 'Renter name, phone, and property name are required.' });
    }

    const inquiry = {
      id: 'inq_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      listingId: String(b.listingId || ''),
      listingName: b.listingName,
      ownerEmail: b.ownerEmail ? String(b.ownerEmail).trim().toLowerCase() : '',
      userId: (s && s.user && s.user.id) ? s.user.id : (b.userId || ''),
      userName: b.userName.trim(),
      userEmail: (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (b.userEmail ? String(b.userEmail).trim().toLowerCase() : ''),
      phone: b.phone.trim(),
      moveInDate: b.moveInDate || '',
      preferredTourSlot: b.preferredTourSlot || 'Weekend Morning (10:00 AM - 1:00 PM)',
      message: b.message || '',
      status: 'pending',
      adminNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    INQUIRIES.unshift(inquiry);
    saveInquiryToDisk(inquiry);

    return res.status(201).json({ success: true, inquiry });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
