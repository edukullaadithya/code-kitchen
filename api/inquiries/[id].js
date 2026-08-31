const { INQUIRIES, setCorsHeaders, getSessionUser, updateInquiryOnDisk, deleteInquiryFromDisk, loadDiskInquiries } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const inqId = req.query.id;
  if (!inqId) return res.status(400).json({ error: 'Inquiry ID is required.' });

  // ===== PUT: UPDATE INQUIRY STATUS / NOTES =====
  if (req.method === 'PUT') {
    const s = getSessionUser(req);
    const body = req.body || {};
    const updates = {};

    if (body.status) updates.status = String(body.status).toLowerCase();
    if (body.adminNotes !== undefined) updates.adminNotes = String(body.adminNotes);
    if (body.scheduledTourDate) updates.scheduledTourDate = body.scheduledTourDate;
    updates.updatedAt = new Date().toISOString();

    const idx = INQUIRIES.findIndex(i => String(i.id) === String(inqId));
    if (idx !== -1) {
      INQUIRIES[idx] = Object.assign({}, INQUIRIES[idx], updates);
    }
    const updated = updateInquiryOnDisk(inqId, updates);
    if (!updated && idx === -1) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    return res.status(200).json({ success: true, inquiry: updated || INQUIRIES[idx] });
  }

  // ===== DELETE: REMOVE INQUIRY =====
  if (req.method === 'DELETE') {
    const idx = INQUIRIES.findIndex(i => String(i.id) === String(inqId));
    if (idx !== -1) INQUIRIES.splice(idx, 1);
    deleteInquiryFromDisk(inqId);

    return res.status(200).json({ success: true, message: 'Inquiry removed successfully.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
