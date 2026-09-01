const { MESSAGES, setCorsHeaders, getSessionUser, saveMessageToDisk, loadDiskMessages } = require('./_shared/data');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const s = getSessionUser(req);
  const myEmail = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (req.query.myEmail ? String(req.query.myEmail).trim().toLowerCase() : '');

  // ===== GET: RETRIEVE MESSAGES & CONVERSATION THREADS =====
  if (req.method === 'GET') {
    const query = req.query || {};
    const chatWith = query.chatWith ? String(query.chatWith).trim().toLowerCase() : '';
    const listingId = query.listingId ? String(query.listingId).trim() : '';
    const mode = query.mode || ''; // 'threads' or 'conversation'

    const diskMsgs = loadDiskMessages();
    const allMsgs = diskMsgs.length > 0 ? diskMsgs : MESSAGES;

    // Mode: Thread Summaries (for In-App Chat Inbox)
    if (mode === 'threads' || (!chatWith && !listingId && s && s.user)) {
      const threadsMap = new Map();

      allMsgs.forEach(m => {
        const sEmail = (m.senderEmail || '').toLowerCase();
        const rEmail = (m.recipientEmail || '').toLowerCase();

        // Check if message belongs to current user
        if (sEmail === myEmail || rEmail === myEmail || !myEmail) {
          const otherParty = sEmail === myEmail ? rEmail : sEmail;
          const key = otherParty || m.listingId || 'general';

          if (!threadsMap.has(key)) {
            threadsMap.set(key, {
              contactEmail: otherParty,
              contactName: sEmail === myEmail ? (m.recipientName || otherParty) : (m.senderName || otherParty),
              listingId: m.listingId || '',
              listingName: m.listingName || 'General Inquiry',
              lastMessage: m.message,
              lastMessageAt: m.createdAt,
              unreadCount: (rEmail === myEmail && !m.read) ? 1 : 0,
              totalMessages: 1
            });
          } else {
            const thread = threadsMap.get(key);
            thread.totalMessages++;
            if (rEmail === myEmail && !m.read) thread.unreadCount++;
            if (new Date(m.createdAt) > new Date(thread.lastMessageAt)) {
              thread.lastMessage = m.message;
              thread.lastMessageAt = m.createdAt;
            }
          }
        }
      });

      const threadList = Array.from(threadsMap.values()).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      return res.status(200).json({ threads: threadList, count: threadList.length });
    }

    // Specific Conversation Thread
    let thread = allMsgs.filter(m => {
      const sEmail = (m.senderEmail || '').toLowerCase();
      const rEmail = (m.recipientEmail || '').toLowerCase();

      if (listingId && String(m.listingId) !== String(listingId)) {
        return false;
      }

      if (chatWith) {
        const isParticipant = (sEmail === chatWith || rEmail === chatWith);
        if (!isParticipant) return false;
      }

      if (myEmail) {
        const isMyMsg = (sEmail === myEmail || rEmail === myEmail);
        if (!isMyMsg) return false;
      }

      return true;
    });

    // Sort chronologically
    thread.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.status(200).json({
      messages: thread,
      count: thread.length,
      chatWith: chatWith,
      listingId: listingId
    });
  }

  // ===== POST: SEND REAL-TIME MESSAGE =====
  if (req.method === 'POST') {
    const body = req.body || {};
    const { recipientEmail, recipientName, listingId, listingName, message, senderName, senderEmail } = body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    const sEmail = (s && s.user && s.user.email) ? s.user.email.toLowerCase() : (senderEmail ? String(senderEmail).trim().toLowerCase() : 'guest@rentright.com');
    const sName = (s && s.user && s.user.name) ? s.user.name : (senderName ? String(senderName).trim() : 'Prospective Renter');
    const rEmail = recipientEmail ? String(recipientEmail).trim().toLowerCase() : 'admin@rentright.com';
    const rName = recipientName ? String(recipientName).trim() : 'Property Manager';

    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      listingId: String(listingId || ''),
      listingName: listingName || '',
      senderId: (s && s.user && s.user.id) ? s.user.id : 'usr_' + Date.now(),
      senderName: sName,
      senderEmail: sEmail,
      senderRole: (s && s.user && s.user.role) ? s.user.role : 'user',
      senderAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sEmail)}`,
      recipientEmail: rEmail,
      recipientName: rName,
      message: String(message).trim(),
      read: false,
      status: 'delivered',
      createdAt: new Date().toISOString()
    };

    MESSAGES.push(newMsg);
    saveMessageToDisk(newMsg);

    return res.status(201).json({
      success: true,
      message: newMsg
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
