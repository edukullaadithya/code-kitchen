const { MESSAGES, setCorsHeaders, getSessionUser, deleteMessageFromDisk } = require('../_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const msgId = req.query.id;
  if (!msgId) return res.status(400).json({ error: 'Message ID is required.' });

  // ===== PUT: MARK AS READ =====
  if (req.method === 'PUT') {
    const idx = MESSAGES.findIndex(m => String(m.id) === String(msgId));
    if (idx !== -1) {
      MESSAGES[idx].read = true;
      MESSAGES[idx].readAt = new Date().toISOString();
      return res.status(200).json({ success: true, message: MESSAGES[idx] });
    }
    return res.status(404).json({ error: 'Message not found.' });
  }

  // ===== DELETE: REMOVE MESSAGE =====
  if (req.method === 'DELETE') {
    const idx = MESSAGES.findIndex(m => String(m.id) === String(msgId));
    if (idx !== -1) MESSAGES.splice(idx, 1);
    deleteMessageFromDisk(msgId);
    return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
