const { User } = require('../models');

// Get all users for a company
const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { companyId: req.params.companyId }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new user
const createUser = async (req, res) => {
  try {
    const { username, password, type, outlets } = req.body;
    const companyId = req.params.companyId;

    // Create user with company association
    const user = await User.create({
      username,
      password,
      role: type.toLowerCase(),
      outletAccess: outlets,
      companyId,
      active: true
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.params.userId,
        companyId: req.params.companyId
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { type, outlets, ...otherData } = req.body;
    await user.update({
      ...otherData,
      role: type ? type.toLowerCase() : user.role,
      outletAccess: outlets // Ensure outlet IDs are properly saved
    });

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete user (hard delete)
const deleteUser = async (req, res) => {
  try {
    const result = await User.destroy({
      where: {
        id: req.params.userId,
        companyId: req.params.companyId
      }
    });

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};