const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token and loads the current user from the database,
// so role changes or deleted accounts take effect immediately.
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const expired = err.name === 'TokenExpiredError';
      return res.status(401).json({ message: expired ? 'Your session has expired. Please log in again.' : 'Invalid session. Please log in again.' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists.' });

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Must be used AFTER protect. Checks the role stored in the database.
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access required.' });
  }
  next();
}

module.exports = { protect, adminOnly };
