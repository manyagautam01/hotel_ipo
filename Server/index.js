require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { ensureAdmin } = require('./config/admin');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

app.use(notFound);
app.use(errorHandler);

async function start() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 16 || secret.startsWith('replace_with')) {
    console.error('\n✖ JWT_SECRET is missing or still the placeholder. Set a long random value in Server/.env\n');
    process.exit(1);
  }
  try {
    await connectDB();
  } catch (err) {
    console.error('\n✖ Could not connect to MongoDB:', err.message);
    console.error('  • Is MongoDB running locally (mongod)?  • Is MONGODB_URI correct in Server/.env?  • Atlas: is your IP allowed?\n');
    process.exit(1);
  }
  const result = await ensureAdmin();
  console.log(`Admin setup: ${result.message}`);

  const port = process.env.PORT || 8001;
  const server = app.listen(port, () => console.log(`Roomly API listening on http://localhost:${port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`\n✖ Port ${port} is already in use. Stop the other process or change PORT in Server/.env\n`);
    else console.error(err);
    process.exit(1);
  });
}

if (require.main === module) start();
module.exports = app;
