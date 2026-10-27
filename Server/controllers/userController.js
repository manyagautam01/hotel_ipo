const User = require('../models/User');

exports.getUsers = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }); // password is select:false
    res.json({ users });
  } catch (err) {
    next(err);
  }
};
