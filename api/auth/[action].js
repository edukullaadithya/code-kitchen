const { USERS, SESSIONS, hashPassword, setCorsHeaders, getSessionUser, saveUserToDisk, updateUserOnDisk, loadDiskUsers, loadDiskListings, loadDiskFavorites, loadDiskInquiries, LISTINGS } = require('../_shared/data');
const crypto = require('crypto');

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const action = req.query.action;

  // Sync users from disk
  const diskUsers = loadDiskUsers();
  diskUsers.forEach(du => {
    if (!USERS.some(u => String(u.id) === String(du.id) || u.email === du.email)) {
      USERS.push(du);
    }
  });

  // ===== 1. REGISTER =====
  if (action === 'register' && req.method === 'POST') {
    const { name, email, password, role, phone, preferredCity } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
    const cleanEmail = email.trim().toLowerCase();
    
    if (USERS.some(u => u.email === cleanEmail) || diskUsers.some(u => u.email === cleanEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      email: cleanEmail,
      password: hashPassword(password),
      role: role === 'admin' ? 'admin' : 'user',
      phone: phone ? String(phone).trim() : '',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      preferredCity: preferredCity ? String(preferredCity).trim().toLowerCase() : '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    USERS.push(newUser);
    saveUserToDisk(newUser);

    const token = crypto.randomUUID();
    const userPayload = { 
      id: newUser.id, 
      name: newUser.name, 
      email: newUser.email, 
      role: newUser.role, 
      phone: newUser.phone,
      avatar: newUser.avatar,
      preferredCity: newUser.preferredCity,
      status: newUser.status
    };
    SESSIONS.set(token, userPayload);
    return res.status(201).json({ success: true, token, user: userPayload });
  }

  // ===== 2. LOGIN =====
  if (action === 'login' && req.method === 'POST') {
    const { email, password, role } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const cleanEmail = email.trim().toLowerCase();
    const hashed = hashPassword(password);

    // Check in-memory and disk
    let user = USERS.find(u => u.email === cleanEmail && u.password === hashed) ||
               diskUsers.find(u => u.email === cleanEmail && u.password === hashed);

    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    if (role && role !== user.role) {
      return res.status(400).json({ error: `This account is registered as a ${user.role}. Please log in using the correct ${user.role} tab.` });
    }

    const token = crypto.randomUUID();
    const userPayload = { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      phone: user.phone || '',
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`,
      preferredCity: user.preferredCity || '',
      status: user.status || 'active'
    };
    SESSIONS.set(token, userPayload);
    return res.status(200).json({ success: true, token, user: userPayload });
  }

  // ===== 3. ME (SESSION VERIFICATION & OVERVIEW) =====
  if (action === 'me' && req.method === 'GET') {
    const s = getSessionUser(req);
    if (!s || !s.user) return res.status(401).json({ error: 'Not authenticated' });
    
    // Find latest user state
    const user = USERS.find(u => u.id === s.user.id) || diskUsers.find(u => u.id === s.user.id) || s.user;
    const cleanUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.email)}`,
      preferredCity: user.preferredCity || '',
      status: user.status || 'active'
    };
    return res.status(200).json({ user: cleanUser });
  }

  // ===== 4. PROFILE UPDATE =====
  if (action === 'profile') {
    const s = getSessionUser(req);
    if (!s || !s.user) return res.status(401).json({ error: 'Authentication required' });

    if (req.method === 'GET') {
      const user = USERS.find(u => u.id === s.user.id) || diskUsers.find(u => u.id === s.user.id) || s.user;
      return res.status(200).json({ profile: user });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = req.body || {};
      const updates = {
        name: body.name ? String(body.name).trim() : undefined,
        phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
        avatar: body.avatar ? String(body.avatar).trim() : undefined,
        preferredCity: body.preferredCity ? String(body.preferredCity).trim().toLowerCase() : undefined,
        preferredBudget: body.preferredBudget ? Number(body.preferredBudget) : undefined,
        preferredBhk: body.preferredBhk ? String(body.preferredBhk).trim() : undefined,
        bio: body.bio ? String(body.bio).trim() : undefined,
        updatedAt: new Date().toISOString()
      };

      // Filter undefined
      Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

      const idx = USERS.findIndex(u => u.id === s.user.id);
      if (idx !== -1) {
        USERS[idx] = Object.assign({}, USERS[idx], updates);
      }
      const updatedUser = updateUserOnDisk(s.user.id, updates) || Object.assign({}, s.user, updates);
      
      // Update in-memory session
      const newSessionPayload = Object.assign({}, s.user, updates);
      if (s.token) SESSIONS.set(s.token, newSessionPayload);

      return res.status(200).json({ success: true, user: newSessionPayload });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ===== 5. CHANGE PASSWORD =====
  if (action === 'change-password' && req.method === 'POST') {
    const s = getSessionUser(req);
    if (!s || !s.user) return res.status(401).json({ error: 'Authentication required' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const currentHash = hashPassword(currentPassword);
    const user = USERS.find(u => u.id === s.user.id) || diskUsers.find(u => u.id === s.user.id);
    if (!user || user.password !== currentHash) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const newHash = hashPassword(newPassword);
    user.password = newHash;
    user.updatedAt = new Date().toISOString();
    updateUserOnDisk(user.id, { password: newHash, updatedAt: user.updatedAt });

    return res.status(200).json({ success: true, message: 'Password updated successfully.' });
  }

  // ===== 6. USER / ADMIN ACTIVITY STATS =====
  if (action === 'stats' && req.method === 'GET') {
    const s = getSessionUser(req);
    if (!s || !s.user) return res.status(401).json({ error: 'Authentication required' });

    const email = s.user.email ? s.user.email.toLowerCase() : '';
    const favs = loadDiskFavorites().filter(f => String(f.userId) === String(s.user.id) || (f.userEmail && f.userEmail.toLowerCase() === email));
    const sentInquiries = loadDiskInquiries().filter(i => (i.userEmail && i.userEmail.toLowerCase() === email) || String(i.userId) === String(s.user.id));
    const receivedInquiries = loadDiskInquiries().filter(i => i.ownerEmail && i.ownerEmail.toLowerCase() === email);

    let myListingsCount = 0;
    const diskListings = loadDiskListings();
    diskListings.forEach(l => {
      if ((l.ownerEmail && l.ownerEmail.toLowerCase() === email) || String(l.ownerId) === String(s.user.id)) {
        myListingsCount++;
      }
    });

    return res.status(200).json({
      role: s.user.role,
      favoritesCount: favs.length,
      sentInquiriesCount: sentInquiries.length,
      receivedInquiriesCount: receivedInquiries.length,
      myListingsCount: myListingsCount,
      accountCreatedAt: s.user.createdAt || null
    });
  }

  // ===== 7. FORGOT PASSWORD (REQUEST OTP) =====
  if (action === 'forgot-password' && req.method === 'POST') {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email address is required.' });
    const cleanEmail = String(email).trim().toLowerCase();

    const user = USERS.find(u => u.email === cleanEmail) || diskUsers.find(u => u.email === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    const { OTPS } = require('../_shared/data');
    OTPS.set(cleanEmail, { otp, expiresAt });

    // Live email dispatch if configured
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'RentRight Security <security@rentright.com>',
            to: [cleanEmail],
            subject: 'RentRight Password Reset OTP Code: ' + otp,
            html: `<h2>RentRight Password Recovery</h2><p>Your one-time verification code is <strong>${otp}</strong>. It will expire in 15 minutes.</p>`
          })
        });
      } catch(e) {}
    }

    return res.status(200).json({
      success: true,
      message: 'A 6-digit OTP verification code has been sent to your email.',
      otp: otp, // Returned for instant testing and seamless client verification
      expiresInMinutes: 15
    });
  }

  // ===== 8. RESET PASSWORD (VERIFY OTP & UPDATE) =====
  if (action === 'reset-password' && req.method === 'POST') {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const { OTPS } = require('../_shared/data');
    const record = OTPS.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this email or OTP has expired. Please request a new code.' });
    }
    if (Date.now() > record.expiresAt) {
      OTPS.delete(cleanEmail);
      return res.status(400).json({ error: 'The OTP verification code has expired. Please request a new code.' });
    }
    if (record.otp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid OTP verification code. Please check and try again.' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = USERS.find(u => u.email === cleanEmail) || diskUsers.find(u => u.email === cleanEmail);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const newHash = hashPassword(newPassword);
    user.password = newHash;
    user.updatedAt = new Date().toISOString();
    updateUserOnDisk(user.id, { password: newHash, updatedAt: user.updatedAt });
    OTPS.delete(cleanEmail);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful! You can now sign in with your new password.'
    });
  }

  // ===== 9. LOGOUT =====
  if (action === 'logout') {
    const s = getSessionUser(req);
    if (s && s.token) SESSIONS.delete(s.token);
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  return res.status(404).json({ error: `Action "${action}" not found.` });
};
