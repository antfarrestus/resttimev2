const { Schedule, Employee } = require('../models');
const { Op } = require('sequelize');
const { startOfWeek, endOfWeek, format } = require('date-fns');

// Get schedules for a specific week and outlet
const getWeekSchedules = async (req, res) => {
  try {
    const { companyId, outletId } = req.params;
    const { weekStart } = req.query;

    // Calculate week start and end dates
    const startDate = weekStart ? new Date(weekStart) : startOfWeek(new Date(), { weekStartsOn: 1 });
    const endDate = endOfWeek(startDate, { weekStartsOn: 1 });

    const schedules = await Schedule.findAll({
      where: {
        companyId,
        outletId,
        date: {
          [Op.between]: [format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')]
        }
      },
      include: [{
        model: Employee,
        attributes: ['id', 'firstName', 'lastName']
      }],
      attributes: [
        'id', 'employeeId', 'companyId', 'outletId', 'date',
        'startTime', 'endTime', 'duration', 'shiftRate', 'overtimeRate', 'color',
        'break1start', 'break1end', 'break1duration', 'break1paid',
        'break2start', 'break2end', 'break2duration', 'break2paid',
        'break3start', 'break3end', 'break3duration', 'break3paid'
      ],
      order: [
        ['date', 'ASC'],
        [{ model: Employee }, 'firstName', 'ASC']
      ]
    });

    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Failed to fetch schedules' });
  }
};

// Create a new schedule
const createSchedule = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { breaks, ...scheduleData } = req.body;

    console.log('Received schedule data:', scheduleData);

    // Ensure startTime, endTime and duration are properly set from the request body
    // and not overridden by default values
    const schedule = {
      ...scheduleData,
      companyId,
      isOpenShift: scheduleData.isOpenShift || false,
      duration: scheduleData.duration !== undefined ? scheduleData.duration : 8.00,
      createdBy: req.userId || 1 // Fallback to admin user if userId is not available
    };

    // Handle time values and duration for open shifts
    if (schedule.isOpenShift) {
      schedule.startTime = '00:00:00';
      schedule.endTime = '00:00:00';
      // Preserve manually entered duration for open shifts
      // Use explicit check for undefined to preserve 0 values
      schedule.duration = scheduleData.duration !== undefined ? parseFloat(scheduleData.duration) : 0;
      // Only set break times if breaks are explicitly provided
      if (breaks && Array.isArray(breaks) && breaks.length > 0) {
        breaks.forEach((breakItem, index) => {
          const breakNumber = index + 1;
          if (breakNumber <= 3) {
            schedule[`break${breakNumber}start`] = breakItem.startTime || '00:00:00';
            schedule[`break${breakNumber}end`] = breakItem.endTime || '00:00:00';
            schedule[`break${breakNumber}duration`] = breakItem.duration || 0;
            schedule[`break${breakNumber}paid`] = Boolean(breakItem.paid);
          }
        });
      }
    } else {
      // For regular shifts, ensure consistent time format
      const startTime = new Date(scheduleData.startTime);
      const endTime = new Date(scheduleData.endTime);
      schedule.startTime = startTime.toTimeString().split(' ')[0];
      schedule.endTime = endTime.toTimeString().split(' ')[0];
    }
    
    console.log('Processed schedule data with explicit time values:', {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      duration: schedule.duration
    });

    // Validate required fields
    if (!schedule.employeeId || !schedule.date || !schedule.outletId) {
      return res.status(400).json({ message: 'Employee ID, date, and outlet ID are required' });
    }

    // Validate duration
    if (schedule.duration === undefined || schedule.duration === null || isNaN(schedule.duration) || schedule.duration < 0) {
      return res.status(400).json({ message: 'Invalid duration value' });
    }

    // Validate shiftRate and overtimeRate
    if (schedule.shiftRate === undefined || schedule.shiftRate === null || isNaN(schedule.shiftRate)) {
      return res.status(400).json({ message: 'Shift rate is required and must be a number' });
    }

    if (schedule.overtimeRate === undefined || schedule.overtimeRate === null || isNaN(schedule.overtimeRate)) {
      schedule.overtimeRate = 1.00; // Set default value if not provided
    }

    // Check for existing schedule
    const existingSchedule = await Schedule.findOne({
      where: {
        employeeId: schedule.employeeId,
        date: schedule.date
      }
    });

    if (existingSchedule) {
      return res.status(400).json({ message: 'Schedule already exists for this employee on this date' });
    }

    // Map and validate break data
    if (breaks && Array.isArray(breaks)) {
      breaks.forEach((breakItem, index) => {
        const breakNumber = index + 1;
        if (breakNumber <= 3) {
          // Validate break times
          if (breakItem.startTime && breakItem.endTime) {
            // Extract time portion only for comparison
            const startTime = new Date(breakItem.startTime);
            const endTime = new Date(breakItem.endTime);
            
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
              throw new Error(`Invalid time format for break ${breakNumber}`);
            }
            
            // Only compare times if they're not set to midnight
            const isMidnight = startTime.getHours() === 0 && 
                             startTime.getMinutes() === 0 && 
                             endTime.getHours() === 0 && 
                             endTime.getMinutes() === 0;
            
            if (!isMidnight && endTime <= startTime) {
              throw new Error(`Break ${breakNumber} end time must be after start time`);
            }
          }

          // Validate break duration
          if (breakItem.duration !== undefined && breakItem.duration !== null) {
            if (isNaN(breakItem.duration) || breakItem.duration < 0) {
              throw new Error(`Invalid duration for break ${breakNumber}`);
            }
          }

          // Store only the time portion for break times
          schedule[`break${breakNumber}start`] = breakItem.startTime ? 
            new Date(breakItem.startTime).toTimeString().split(' ')[0] : null;
          schedule[`break${breakNumber}end`] = breakItem.endTime ? 
            new Date(breakItem.endTime).toTimeString().split(' ')[0] : null;
          schedule[`break${breakNumber}duration`] = breakItem.duration || null;
          schedule[`break${breakNumber}paid`] = Boolean(breakItem.paid);
        }
      });
    }

    console.log('Creating schedule with data:', schedule);
    const createdSchedule = await Schedule.create(schedule);
    res.status(201).json(createdSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Failed to create schedule', error: error.message });
  }
};

// Update a schedule
const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { breaks, ...scheduleData } = req.body;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Handle open shifts by setting default time values
    if (scheduleData.isOpenShift) {
      scheduleData.startTime = '00:00:00';
      scheduleData.endTime = '00:00:00';
      scheduleData.break1start = '00:00:00';
      scheduleData.break1end = '00:00:00';
      scheduleData.break2start = '00:00:00';
      scheduleData.break2end = '00:00:00';
      scheduleData.break3start = '00:00:00';
      scheduleData.break3end = '00:00:00';
      // Ensure we preserve the manually entered duration for open shifts
      // and don't calculate it from start/end times which are both 00:00:00
      if (scheduleData.duration !== undefined && scheduleData.duration !== null) {
        scheduleData.duration = parseFloat(scheduleData.duration);
      } else {
        // If no duration provided, set a default value for open shifts
        scheduleData.duration = schedule.duration || 0;
      }
    }

    // Process break data
    if (breaks && Array.isArray(breaks)) {
      breaks.forEach((breakItem, index) => {
        const breakNumber = index + 1;
        if (breakNumber <= 3) {
          // Set default values when break is deleted or not provided
          scheduleData[`break${breakNumber}start`] = breakItem.startTime || '00:00:00';
          scheduleData[`break${breakNumber}end`] = breakItem.endTime || '00:00:00';
          scheduleData[`break${breakNumber}duration`] = breakItem.duration || null;
          scheduleData[`break${breakNumber}paid`] = Boolean(breakItem.paid);
        }
      });
      
      // Ensure duration is properly parsed as a number
      if (scheduleData.duration !== undefined && scheduleData.duration !== null) {
        scheduleData.duration = parseFloat(scheduleData.duration);
      }

      // Handle removed breaks by setting default values for any break not included
      for (let i = breaks.length + 1; i <= 3; i++) {
        scheduleData[`break${i}start`] = '00:00:00';
        scheduleData[`break${i}end`] = '00:00:00';
        scheduleData[`break${i}duration`] = null;
        scheduleData[`break${i}paid`] = false;
      }
    } else {
      // If no breaks array provided, set all breaks to default values
      for (let i = 1; i <= 3; i++) {
        scheduleData[`break${i}start`] = '00:00:00';
        scheduleData[`break${i}end`] = '00:00:00';
        scheduleData[`break${i}duration`] = null;
        scheduleData[`break${i}paid`] = false;
      }
    }

    // Add updatedBy field
    scheduleData.updatedBy = req.userId;

    await schedule.update(scheduleData);
    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Failed to update schedule' });
  }
};

// Delete a schedule
const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    await schedule.destroy();
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ message: 'Failed to delete schedule' });
  }
};

module.exports = {
  getWeekSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule
};