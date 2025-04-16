const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');

// Apply authentication middleware to all user routes
router.use(verifyToken);

// User routes
router.get('/', getUsers);
router.post('/', createUser);
router.put('/:userId', updateUser);
router.delete('/:userId', deleteUser);

module.exports = router;