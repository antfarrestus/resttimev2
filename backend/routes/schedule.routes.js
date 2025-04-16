const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const scheduleController = require('../controllers/schedule.controller');

// Get schedules for a specific week and outlet
router.get('/companies/:companyId/outlets/:outletId/schedules',
  verifyToken,
  scheduleController.getWeekSchedules
);

// Create a new schedule
router.post('/companies/:companyId/schedules',
  verifyToken,
  scheduleController.createSchedule
);

// Update a schedule
router.put('/schedules/:id',
  verifyToken,
  scheduleController.updateSchedule
);

// Delete a schedule
router.delete('/schedules/:id',
  verifyToken,
  scheduleController.deleteSchedule
);

module.exports = router;