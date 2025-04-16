const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet
} = require('../controllers/outlet.controller');

// Apply authentication middleware to all outlet routes
router.use(verifyToken);

router.get('/', getOutlets);
router.post('/', createOutlet);
router.put('/:id', updateOutlet);
router.delete('/:id', deleteOutlet);

module.exports = router;