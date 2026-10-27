// Optional: npm run seed:rooms  -> inserts sample rooms (skips room numbers that already exist)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Room = require('../models/Room');

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`;
const rooms = [
  { roomNumber: '101', type: 'Standard', price: 2800, capacity: 2, description: 'A calm garden-facing room with a queen bed, writing desk and rain shower.', image: U('photo-1631049307264-da0ec9d70304') },
  { roomNumber: '102', type: 'Standard', price: 3000, capacity: 2, description: 'Bright corner room with warm timber finishes and a reading nook by the window.', image: U('photo-1611892440504-42a792e24d32') },
  { roomNumber: '201', type: 'Deluxe', price: 4800, capacity: 3, description: 'Spacious deluxe room with a king bed, sitting area and a private balcony.', image: U('photo-1590490360182-c33d57733427') },
  { roomNumber: '202', type: 'Deluxe', price: 5200, capacity: 3, description: 'Light-filled deluxe room overlooking the courtyard with a soaking tub.', image: U('photo-1566665797739-1674de7a421a') },
  { roomNumber: '301', type: 'Suite', price: 8500, capacity: 4, description: 'Two-room suite with a separate lounge, dining nook and panoramic city views.', image: U('photo-1578683010236-d716f9a3f461') },
  { roomNumber: '302', type: 'Family', price: 6500, capacity: 5, description: 'Generous family room with two double beds, play corner and a connecting door.', image: U('photo-1595576508898-0ad5c879a061') },
  { roomNumber: '401', type: 'Presidential', price: 15000, capacity: 4, description: 'Our signature top-floor residence with a private terrace, butler service and a grand lounge.', image: U('photo-1631049552057-403cdb8f0658') },
];

(async () => {
  try {
    await connectDB();
    let added = 0;
    for (const r of rooms) {
      if (!(await Room.exists({ roomNumber: r.roomNumber }))) {
        await Room.create(r);
        added++;
      }
    }
    console.log(`Sample rooms added: ${added}`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
