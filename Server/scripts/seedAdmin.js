// Usage: npm run seed:admin            -> create/promote the admin from .env
//        npm run seed:admin -- --reset -> also reset the admin password to ADMIN_PASSWORD
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ensureAdmin } = require('../config/admin');

(async () => {
  try {
    await connectDB();
    const result = await ensureAdmin({ resetPassword: process.argv.includes('--reset') });
    console.log(result.message);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
