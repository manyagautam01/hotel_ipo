const router = require('express').Router();
const c = require('../controllers/roomController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', c.getRooms);
router.get('/:id', c.getRoom);
router.post('/', protect, adminOnly, c.createRoom);
router.patch('/:id/availability', protect, adminOnly, c.setAvailability);
router.delete('/:id', protect, adminOnly, c.deleteRoom);

module.exports = router;
