const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validPassword = await user.validPassword(password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        role: user.role,
        companyId: user.companyId,
        outletAccess: user.outletAccess
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      companyId: user.companyId,
      outletAccess: user.outletAccess,
      token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login
};