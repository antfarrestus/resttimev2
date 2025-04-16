const { Shift } = require('../models');

// Get all shifts for a company
const getShifts = async (req, res) => {
  try {
    const { companyId } = req.params;
    const shifts = await Shift.findAll({
      where: { CompanyId: companyId },
      order: [['name', 'ASC']]
    });
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ message: 'Failed to fetch shifts' });
  }
};

// Create a new shift
const createShift = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    // Process the request body to ensure proper handling of open shifts
    const shiftData = { 
      ...req.body, 
      CompanyId: companyId, // Using CompanyId to match Sequelize's association naming
      createdBy: req.userId // Add the user ID who created the shift
    };
    
    // Convert isOpenShift to boolean if it's a string
    if (typeof shiftData.isOpenShift === 'string') {
      shiftData.isOpenShift = shiftData.isOpenShift.toLowerCase() === 'true';
    }
    
    // Convert paid break flags to boolean if they're strings
    ['break1paid', 'break2paid', 'break3paid'].forEach(field => {
      if (typeof shiftData[field] === 'string') {
        shiftData[field] = shiftData[field].toLowerCase() === 'true';
      } else if (shiftData[field] === undefined || shiftData[field] === null) {
        // Default to false if not provided or null
        shiftData[field] = false;
      }
    });
    
    // Ensure startTime, endTime, and break times are explicitly set to null for open shifts
    if (shiftData.isOpenShift === true) {
      // For open shifts, provide default time values instead of null
      // since the database doesn't allow nulls for startTime
      shiftData.startTime = '00:00:00';
      shiftData.endTime = '00:00:00';
      // Also set all break start/end times to default values for open shifts
      shiftData.break1start = '00:00:00';
      shiftData.break1end = '00:00:00';
      shiftData.break2start = '00:00:00';
      shiftData.break2end = '00:00:00';
      shiftData.break3start = '00:00:00';
      shiftData.break3end = '00:00:00';
    } else {
      // For regular shifts, ensure startTime and endTime are properly formatted
      if (shiftData.startTime === '') shiftData.startTime = '00:00:00';
      if (shiftData.endTime === '') shiftData.endTime = '00:00:00';
      // Handle empty break times for regular shifts
      if (shiftData.break1start === '') shiftData.break1start = '00:00:00';
      if (shiftData.break1end === '') shiftData.break1end = '00:00:00';
      if (shiftData.break2start === '') shiftData.break2start = '00:00:00';
      if (shiftData.break2end === '') shiftData.break2end = '00:00:00';
      if (shiftData.break3start === '') shiftData.break3start = '00:00:00';
      if (shiftData.break3end === '') shiftData.break3end = '00:00:00';
    }

    // Convert numeric strings to numbers
    if (typeof shiftData.duration === 'string') {
      shiftData.duration = parseFloat(shiftData.duration);
    }
    if (typeof shiftData.shiftRate === 'string') {
      shiftData.shiftRate = parseFloat(shiftData.shiftRate);
    }
    
    // Handle break durations if they exist
    ['break1duration', 'break2duration', 'break3duration'].forEach(field => {
      if (typeof shiftData[field] === 'string' && shiftData[field] !== '') {
        shiftData[field] = parseFloat(shiftData[field]);
      } else if (shiftData[field] === '') {
        shiftData[field] = null;
      }
    });

    // Validate required fields
    if (shiftData.duration === undefined || shiftData.duration === null || isNaN(shiftData.duration)) {
      return res.status(400).json({ message: 'Shift duration is required and must be a number' });
    }
    if (shiftData.shiftRate === undefined || shiftData.shiftRate === null || isNaN(shiftData.shiftRate)) {
      return res.status(400).json({ message: 'Shift rate is required and must be a number' });
    }
    if (!shiftData.name) {
      return res.status(400).json({ message: 'Shift name is required' });
    }
    
    // Log the data being sent to the database for debugging
    console.log('Creating shift with data:', JSON.stringify(shiftData, null, 2));
    
    const shift = await Shift.create(shiftData);
    res.status(201).json(shift);
  } catch (error) {
    console.error('Error creating shift:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    
    // Check for specific error types
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'Validation error when creating shift', 
        errors: error.errors.map(e => ({ field: e.path, message: e.message })) 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create shift', 
      error: error.message,
      errorType: error.name
    });
  }
};

// Update a shift
const updateShift = async (req, res) => {
  try {
    const { companyId, shiftId } = req.params;
    
    const shift = await Shift.findOne({
      where: { id: shiftId, CompanyId: companyId }
    });
    
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    // Add the user ID who updated the shift
    const updateData = {
      ...req.body,
      updatedBy: req.userId
    };
    
    // Convert isOpenShift to boolean if it's a string
    if (typeof updateData.isOpenShift === 'string') {
      updateData.isOpenShift = updateData.isOpenShift.toLowerCase() === 'true';
    }
    
    // Convert paid break flags to boolean if they're strings
    ['break1paid', 'break2paid', 'break3paid'].forEach(field => {
      if (typeof updateData[field] === 'string') {
        updateData[field] = updateData[field].toLowerCase() === 'true';
      } else if (updateData[field] === undefined) {
        // Default to false if not provided
        updateData[field] = false;
      }
    });
    
    // Ensure startTime, endTime, and break times are explicitly set to null for open shifts
    if (updateData.isOpenShift === true) {
      // For open shifts, provide default time values instead of null
      updateData.startTime = '00:00:00';
      updateData.endTime = '00:00:00';
      // Also set all break start/end times to default values for open shifts
      updateData.break1start = '00:00:00';
      updateData.break1end = '00:00:00';
      updateData.break2start = '00:00:00';
      updateData.break2end = '00:00:00';
      updateData.break3start = '00:00:00';
      updateData.break3end = '00:00:00';
    } else {
      // For regular shifts, ensure startTime and endTime are properly formatted
      if (updateData.startTime === '') updateData.startTime = '00:00:00';
      if (updateData.endTime === '') updateData.endTime = '00:00:00';
      // Handle empty break times for regular shifts
      if (updateData.break1start === '') updateData.break1start = '00:00:00';
      if (updateData.break1end === '') updateData.break1end = '00:00:00';
      if (updateData.break2start === '') updateData.break2start = '00:00:00';
      if (updateData.break2end === '') updateData.break2end = '00:00:00';
      if (updateData.break3start === '') updateData.break3start = '00:00:00';
      if (updateData.break3end === '') updateData.break3end = '00:00:00';
    }
    
    // Convert numeric strings to numbers
    if (typeof updateData.duration === 'string') {
      updateData.duration = parseFloat(updateData.duration);
    }
    if (typeof updateData.shiftRate === 'string') {
      updateData.shiftRate = parseFloat(updateData.shiftRate);
    }
    
    // Handle break durations if they exist
    ['break1duration', 'break2duration', 'break3duration'].forEach(field => {
      if (typeof updateData[field] === 'string' && updateData[field] !== '') {
        updateData[field] = parseFloat(updateData[field]);
      } else if (updateData[field] === '') {
        updateData[field] = null;
      }
    });
    
    // Log the data being sent to the database for debugging
    console.log('Updating shift with data:', JSON.stringify(updateData, null, 2));
    
    await shift.update(updateData);
    res.json(shift);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ message: 'Failed to update shift', error: error.message });
  }
};

// Delete a shift (hard delete)
const deleteShift = async (req, res) => {
  try {
    const { companyId, shiftId } = req.params;
    
    const shift = await Shift.findOne({
      where: { id: shiftId, CompanyId: companyId }
    });
    
    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' });
    }
    
    await shift.destroy();
    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift:', error);
    res.status(500).json({ message: 'Failed to delete shift' });
  }
};

module.exports = {
  getShifts,
  createShift,
  updateShift,
  deleteShift
};