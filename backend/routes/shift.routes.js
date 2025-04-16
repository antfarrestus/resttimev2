const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getShifts,
  createShift,
  updateShift,
  deleteShift
} = require('../controllers/shift.controller');

// Apply authentication middleware to all shift routes
router.use(verifyToken);

// Shift routes
router.get('/', getShifts);
router.post('/', createShift);
router.put('/:shiftId', updateShift);
router.delete('/:shiftId', deleteShift);

module.exports = router;