const User = require('../models/User');

const PLACEHOLDERS = ['replace_with_a_strong_password', 'password', 'admin123'];

function isStrongPassword(pw) {
  return (
    typeof pw === 'string' &&
    pw.length >= 10 &&
    /[A-Za-z]/.test(pw) &&
    /\d/.test(pw) &&
    !PLACEHOLDERS.includes(pw.toLowerCase())
  );
}

/**
 * Creates the administrator from ADMIN_EMAIL / ADMIN_PASSWORD.
 * - Missing account  -> created with role "admin".
 * - Existing account -> promoted to admin (password kept unless resetPassword = true).
 * Credentials only ever come from the backend .env file.
 */
async function ensureAdmin({ resetPassword = false } = {}) {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    return { status: 'skipped', message: 'ADMIN_EMAIL / ADMIN_PASSWORD not set; no admin created.' };
  }
  if (!isStrongPassword(password)) {
    return {
      status: 'skipped',
      message:
        'ADMIN_PASSWORD is too weak or still the placeholder (need 10+ chars with letters and digits). Admin not created.',
    };
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    await User.create({ name: 'Roomly Admin', email, password, role: 'admin' });
    return { status: 'created', message: `Admin account created for ${email}.` };
  }
  let changed = false;
  if (user.role !== 'admin') {
    user.role = 'admin';
    changed = true;
  }
  if (resetPassword) {
    user.password = password; // re-hashed by the pre-save hook
    changed = true;
  }
  if (changed) await user.save();
  return {
    status: changed ? 'updated' : 'exists',
    message: `Admin account ${changed ? 'updated' : 'already exists'} for ${email}.`,
  };
}

module.exports = { ensureAdmin, isStrongPassword };
