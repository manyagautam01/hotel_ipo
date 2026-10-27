const router = require('express').Router();
const { getUsers } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getUsers);

module.exports = router;
