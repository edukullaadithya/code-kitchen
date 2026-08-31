const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { setCorsHeaders, getSessionUser } = require('./_shared/data');

const UPLOADS_DIR = process.platform === 'win32'
  ? path.join(__dirname, '..', 'uploads')
  : path.join('/tmp', 'uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {}

module.exports = async function(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to upload images.' });
  }

  try {
    const s = getSessionUser(req);
    const body = req.body || {};
    const base64Data = body.image || body.file || body.data;
    const filename = body.filename || ('img_' + Date.now() + '.jpg');

    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided. Send base64 data URI (data:image/jpeg;base64,...).' });
    }

    // Extract mime type and clean base64 string
    let mimeType = 'image/jpeg';
    let rawBase64 = base64Data;
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    }

    // Supported image types
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF, AVIF.' });
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    // Max 10MB limit
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds 10MB limit.' });
    }

    const ext = mimeType.split('/')[1] || 'jpg';
    const uniqueName = crypto.randomBytes(8).toString('hex') + '_' + Date.now() + '.' + ext;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    try {
      fs.writeFileSync(filePath, buffer);
    } catch (writeErr) {
      // In serverless read-only contexts, fallback to standard Data URI
    }

    // Return both the data URI and URL reference
    const dataUri = `data:${mimeType};base64,${rawBase64}`;

    return res.status(201).json({
      success: true,
      url: dataUri,
      filename: uniqueName,
      size: buffer.length,
      mimeType: mimeType,
      uploadedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
};
