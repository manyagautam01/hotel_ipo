const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: [true, 'Room number is required'], unique: true, trim: true, maxlength: 10 },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: ['Standard', 'Deluxe', 'Suite', 'Family', 'Presidential'],
    },
    price: { type: Number, required: [true, 'Price is required'], min: [1, 'Price must be greater than 0'] },
    capacity: { type: Number, required: [true, 'Capacity is required'], min: 1, max: 12, validate: Number.isInteger },
    description: { type: String, required: [true, 'Description is required'], trim: true, minlength: 10, maxlength: 600 },
    image: { type: String, trim: true, default: '' },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ isAvailable: 1, price: 1 });

module.exports = mongoose.model('Room', roomSchema);
