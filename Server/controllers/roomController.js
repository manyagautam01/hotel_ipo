const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const isId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.getRooms = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.available === 'true') filter.isAvailable = true;
    const rooms = await Room.find(filter).sort({ roomNumber: 1 });
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
};

exports.getRoom = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid room id.' });
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    res.json({ room });
  } catch (err) {
    next(err);
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    const { roomNumber, type, price, capacity, description, image } = req.body;
    const errors = [];
    if (!String(roomNumber || '').trim()) errors.push('Room number is required.');
    if (!type) errors.push('Room type is required.');
    if (!(Number(price) > 0)) errors.push('Price must be greater than 0.');
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) errors.push('Capacity must be a whole number of at least 1.');
    if (String(description || '').trim().length < 10) errors.push('Description must be at least 10 characters.');
    if (image && !/^https?:\/\/\S+$/i.test(String(image).trim())) errors.push('Image must be a valid http(s) URL.');
    if (errors.length) return res.status(400).json({ message: errors.join(' ') });

    const room = await Room.create({
      roomNumber: String(roomNumber).trim(),
      type,
      price: Number(price),
      capacity: Number(capacity),
      description,
      image: image ? String(image).trim() : '',
    });
    res.status(201).json({ room });
  } catch (err) {
    next(err);
  }
};

exports.setAvailability = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid room id.' });
    if (typeof req.body.isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'isAvailable must be true or false.' });
    }
    const room = await Room.findByIdAndUpdate(req.params.id, { isAvailable: req.body.isAvailable }, { new: true });
    if (!room) return res.status(404).json({ message: 'Room not found.' });
    res.json({ room });
  } catch (err) {
    next(err);
  }
};

exports.deleteRoom = async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid room id.' });
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found.' });

    // Do not delete a room that still has upcoming confirmed stays.
    const upcoming = await Booking.exists({ room: room._id, status: 'confirmed', checkOut: { $gt: new Date() } });
    if (upcoming) {
      return res.status(409).json({ message: 'This room has active bookings. Cancel them first, or mark the room unavailable instead.' });
    }
    await room.deleteOne();
    res.json({ message: 'Room deleted.' });
  } catch (err) {
    next(err);
  }
};
