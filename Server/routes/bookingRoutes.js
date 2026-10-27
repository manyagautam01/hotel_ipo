const router = require('express').Router();
const c = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, c.createBooking);
router.get('/mine', protect, c.getMyBookings); // must stay above any "/:id" route
router.get('/', protect, adminOnly, c.getAllBookings);
router.patch('/:id/cancel', protect, c.cancelBooking);
router.patch('/:id/status', protect, adminOnly, c.updateStatus);

module.exports = router;
