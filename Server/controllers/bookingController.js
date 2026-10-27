const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// All dates are handled as UTC midnight so comparisons are consistent.
function parseDay(str) {
  if (!DATE_RE.test(String(str))) return null;
  const d = new Date(`${str}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== str ? null : d;
}
function todayUTC() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()));
}

const populate = [
  { path: 'room', select: 'roomNumber type price capacity image' },
  { path: 'user', select: 'name email' },
];

// Another confirmed booking overlaps if it starts before we leave AND ends after we arrive.
function findOverlap(roomId, checkIn, checkOut, excludeId) {
  const q = { room: roomId, status: 'confirmed', checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } };
  if (excludeId) q._id = { $ne: excludeId };
  return Booking.findOne(q);
}

exports.createBooking = async (req, res, next) => {
  try {
    const { roomId, checkIn: inStr, checkOut: outStr } = req.body;
    const guests = Number(req.body.guests);

    if (!mongoose.Types.ObjectId.isValid(roomId)) return res.status(400).json({ message: 'Please choose a valid room.' });
    const checkIn = parseDay(inStr);
    const checkOut = parseDay(outStr);
    if (!checkIn || !checkOut) return res.status(400).json({ message: 'Please provide valid check-in and check-out dates.' });
    if (checkIn < todayUTC()) return res.status(400).json({ message: 'Check-in cannot be in the past.' });
    if (checkOut <= checkIn) return res.status(400).json({ message: 'Check-out must be after check-in.' });
    if (!Number.isInteger(guests) || guests < 1) return res.status(400).json({ message: 'Guest count must be at least 1.' });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    if (!room.isAvailable) return res.status(409).json({ message: 'This room is currently unavailable.' });
    if (guests > room.capacity) return res.status(400).json({ message: `This room sleeps at most ${room.capacity} guest(s).` });

    if (await findOverlap(room._id, checkIn, checkOut)) {
      return res.status(409).json({ message: 'This room is already booked for some of those dates. Try different dates.' });
    }

    const nights = Math.round((checkOut - checkIn) / DAY_MS);
    const booking = await Booking.create({
      user: req.user._id,
      room: room._id,
      checkIn,
      checkOut,
      guests,
      nights,
      totalPrice: nights * room.price,
    });
    await booking.populate(populate);
    res.status(201).json({ booking });
  } catch (err) {
    next(err);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate(populate).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
};

exports.getAllBookings = async (_req, res, next) => {
  try {
    const bookings = await Booking.find().populate(populate).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid booking id.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    const isOwner = booking.user.equals(req.user._id);
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only cancel your own bookings.' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(409).json({ message: `This booking is already ${booking.status}.` });
    }
    if (req.user.role !== 'admin' && booking.checkIn < todayUTC()) {
      return res.status(409).json({ message: 'A stay that has already started cannot be cancelled online.' });
    }
    booking.status = 'cancelled';
    await booking.save();
    await booking.populate(populate);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
};

// Admin: mark a confirmed booking as completed (after the stay) or cancelled.
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "completed" or "cancelled".' });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid booking id.' });
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (booking.status !== 'confirmed') return res.status(409).json({ message: `This booking is already ${booking.status}.` });
    booking.status = status;
    await booking.save();
    await booking.populate(populate);
    res.json({ booking });
  } catch (err) {
    next(err);
  }
};
