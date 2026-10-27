// Loads every server module to catch syntax errors / missing imports (no database needed).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check_only_secret_value_123';
const files = [
  '../config/db', '../config/admin',
  '../models/User', '../models/Room', '../models/Booking',
  '../middleware/auth', '../middleware/error',
  '../controllers/authController', '../controllers/roomController',
  '../controllers/userController', '../controllers/bookingController',
  '../routes/authRoutes', '../routes/roomRoutes', '../routes/userRoutes', '../routes/bookingRoutes',
  '../index',
];
files.forEach((f) => require(f));
console.log(`OK: ${files.length} modules loaded.`);
process.exit(0);
