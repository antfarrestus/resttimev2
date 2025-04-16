const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getSections,
  createSection,
  updateSection,
  deleteSection
} = require('../controllers/section.controller');

// Apply authentication middleware to all section routes
router.use(verifyToken);

// Section routes
router.get('/', getSections);
router.post('/', createSection);
router.put('/:sectionId', updateSection);
router.delete('/:sectionId', deleteSection);

module.exports = router;