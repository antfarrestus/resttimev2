const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getTimeRecords,
  getScheduleComparison
} = require('../controllers/timeRecord.controller');
const { TimeRecord } = require('../models');

// Apply authentication middleware to all time record routes
router.use(verifyToken);

// Time record routes
router.get('/', getTimeRecords);
router.get('/comparison', getScheduleComparison);

// Create a new time record
router.post('/', async (req, res) => {
  try {
    const { companyId } = req.params;
    const timeRecordData = req.body;
    
    // Ensure companyId is set
    timeRecordData.companyId = parseInt(companyId);
    
    // Create the time record
    const newTimeRecord = await TimeRecord.create(timeRecordData);
    
    res.status(201).json(newTimeRecord);
  } catch (error) {
    console.error('Error creating time record:', error);
    res.status(500).json({ message: error.message || 'Failed to create time record' });
  }
});

// Update a time record
router.put('/:timeRecordId', async (req, res) => {
  try {
    const { companyId, timeRecordId } = req.params;
    const timeRecordData = req.body;
    
    // Find the time record
    const timeRecord = await TimeRecord.findOne({
      where: {
        id: timeRecordId,
        companyId: parseInt(companyId)
      }
    });
    
    if (!timeRecord) {
      return res.status(404).json({ message: 'Time record not found' });
    }
    
    // Update the time record
    await timeRecord.update(timeRecordData);
    
    res.json(timeRecord);
  } catch (error) {
    console.error('Error updating time record:', error);
    res.status(500).json({ message: error.message || 'Failed to update time record' });
  }
});

module.exports = router;