const { Employee, Section, Outlet, Shift } = require('../models');
const { Op } = require('sequelize');

// Get all employees for a company
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { companyId: req.params.companyId, active: true },
      include: [
        {
          model: Section,
          attributes: ['id', 'name']
        },
        {
          model: Outlet,
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'MondayShift',
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'TuesdayShift',
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'WednesdayShift',
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'ThursdayShift',
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'FridayShift',
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'SaturdayShift',
          attributes: ['id', 'name']
        },
        {
          model: Shift,
          as: 'SundayShift',
          attributes: ['id', 'name']
        }
      ],
      order: [
        [{ model: Section }, 'name', 'ASC'],
        [{ model: Outlet }, 'name', 'ASC'],
        ['createdAt', 'DESC']
      ]
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new employee
const createEmployee = async (req, res) => {
  try {
    const companyId = req.params.companyId;
    
    // Log the incoming request body to see what shift IDs are being received
    console.log('Incoming employee data:', JSON.stringify(req.body, null, 2));
    
    // Validate if section and outlet exist and belong to the company
    const { sectionId, outletId, mondayShiftId, tuesdayShiftId, wednesdayShiftId, thursdayShiftId, fridayShiftId, saturdayShiftId, sundayShiftId } = req.body;
    
    console.log('Extracted shift IDs:', { 
      mondayShiftId, 
      tuesdayShiftId, 
      wednesdayShiftId, 
      thursdayShiftId, 
      fridayShiftId, 
      saturdayShiftId, 
      sundayShiftId 
    });
    
    if (sectionId) {
      const section = await Section.findOne({
        where: { id: sectionId, companyId }
      });
      
      if (!section) {
        return res.status(400).json({
          message: 'Invalid sectionId. The section must exist and belong to the company.'
        });
      }
    }
    
    if (outletId) {
      const outlet = await Outlet.findOne({
        where: { id: outletId, companyId }
      });
      
      if (!outlet) {
        return res.status(400).json({
          message: 'Invalid outletId. The outlet must exist and belong to the company.'
        });
      }
    }
    
    // Validate weekday shift IDs if provided
    const shiftIds = [mondayShiftId, tuesdayShiftId, wednesdayShiftId, thursdayShiftId, fridayShiftId, saturdayShiftId, sundayShiftId].filter(id => id);
    
    console.log('Filtered shift IDs for validation:', shiftIds);
    
    if (shiftIds.length > 0) {
      // Check each shift ID individually to ensure it exists and belongs to the company
      for (const shiftId of shiftIds) {
        const shift = await Shift.findOne({
          where: {
            id: shiftId,
            companyId: req.params.companyId
          }
        });
        
        if (!shift) {
          return res.status(400).json({
            message: `Shift with ID ${shiftId} is invalid or does not belong to the company.`
          });
        }
      }
      
      console.log('All provided shift IDs are valid');
    }
    
    // Find the highest employee number for this company (including inactive employees)
    // We explicitly include both active and inactive employees to ensure we don't reuse numbers
    const highestNumberEmployee = await Employee.findOne({
      where: { 
        companyId,
        employeeNumber: { [Op.not]: null } // Only consider records with employee numbers
      },
      order: [['employeeNumber', 'DESC']],
      attributes: ['employeeNumber']
    });
    
    // Set the new employee number (start from 101 or increment from highest)
    const nextEmployeeNumber = highestNumberEmployee && highestNumberEmployee.employeeNumber 
      ? highestNumberEmployee.employeeNumber + 1 
      : 101;
    
    // Process the request body to handle empty strings for email
    const employeeData = { ...req.body };
    if (employeeData.email === '') {
      employeeData.email = null;
    }
    
    // Convert empty string shift IDs to null
    if (employeeData.mondayShiftId === '') employeeData.mondayShiftId = null;
    if (employeeData.tuesdayShiftId === '') employeeData.tuesdayShiftId = null;
    if (employeeData.wednesdayShiftId === '') employeeData.wednesdayShiftId = null;
    if (employeeData.thursdayShiftId === '') employeeData.thursdayShiftId = null;
    if (employeeData.fridayShiftId === '') employeeData.fridayShiftId = null;
    if (employeeData.saturdayShiftId === '') employeeData.saturdayShiftId = null;
    if (employeeData.sundayShiftId === '') employeeData.sundayShiftId = null;
    
    // Convert string shift IDs to integers - ensure we're handling all possible formats
    // Use explicit type conversion to ensure values are stored as integers
    if (employeeData.mondayShiftId !== null && employeeData.mondayShiftId !== undefined) {
      employeeData.mondayShiftId = Number(employeeData.mondayShiftId);
      if (isNaN(employeeData.mondayShiftId)) employeeData.mondayShiftId = null;
    }
    if (employeeData.tuesdayShiftId !== null && employeeData.tuesdayShiftId !== undefined) {
      employeeData.tuesdayShiftId = Number(employeeData.tuesdayShiftId);
      if (isNaN(employeeData.tuesdayShiftId)) employeeData.tuesdayShiftId = null;
    }
    if (employeeData.wednesdayShiftId !== null && employeeData.wednesdayShiftId !== undefined) {
      employeeData.wednesdayShiftId = Number(employeeData.wednesdayShiftId);
      if (isNaN(employeeData.wednesdayShiftId)) employeeData.wednesdayShiftId = null;
    }
    if (employeeData.thursdayShiftId !== null && employeeData.thursdayShiftId !== undefined) {
      employeeData.thursdayShiftId = Number(employeeData.thursdayShiftId);
      if (isNaN(employeeData.thursdayShiftId)) employeeData.thursdayShiftId = null;
    }
    if (employeeData.fridayShiftId !== null && employeeData.fridayShiftId !== undefined) {
      employeeData.fridayShiftId = Number(employeeData.fridayShiftId);
      if (isNaN(employeeData.fridayShiftId)) employeeData.fridayShiftId = null;
    }
    if (employeeData.saturdayShiftId !== null && employeeData.saturdayShiftId !== undefined) {
      employeeData.saturdayShiftId = Number(employeeData.saturdayShiftId);
      if (isNaN(employeeData.saturdayShiftId)) employeeData.saturdayShiftId = null;
    }
    if (employeeData.sundayShiftId !== null && employeeData.sundayShiftId !== undefined) {
      employeeData.sundayShiftId = Number(employeeData.sundayShiftId);
      if (isNaN(employeeData.sundayShiftId)) employeeData.sundayShiftId = null;
    }
    
    console.log('Processed employee data before creation:', {
      mondayShiftId: employeeData.mondayShiftId,
      tuesdayShiftId: employeeData.tuesdayShiftId,
      wednesdayShiftId: employeeData.wednesdayShiftId,
      thursdayShiftId: employeeData.thursdayShiftId,
      fridayShiftId: employeeData.fridayShiftId,
      saturdayShiftId: employeeData.saturdayShiftId,
      sundayShiftId: employeeData.sundayShiftId
    });
    
    // Create employee with company association and employee number
    const employee = await Employee.create({
      ...employeeData,
      companyId,
      employeeNumber: nextEmployeeNumber
    });

    console.log('Created employee with shift IDs:', {
      mondayShiftId: employee.mondayShiftId,
      tuesdayShiftId: employee.tuesdayShiftId,
      wednesdayShiftId: employee.wednesdayShiftId,
      thursdayShiftId: employee.thursdayShiftId,
      fridayShiftId: employee.fridayShiftId,
      saturdayShiftId: employee.saturdayShiftId,
      sundayShiftId: employee.sundayShiftId
    });
    
    // Reload the employee to get the latest data from the database
    await employee.reload();
    
    // Log the employee data after reload to verify shift IDs were saved in the database
    console.log('Reloaded employee with shift IDs:', {
      mondayShiftId: employee.mondayShiftId,
      tuesdayShiftId: employee.tuesdayShiftId,
      wednesdayShiftId: employee.wednesdayShiftId,
      thursdayShiftId: employee.thursdayShiftId,
      fridayShiftId: employee.fridayShiftId,
      saturdayShiftId: employee.saturdayShiftId,
      sundayShiftId: employee.sundayShiftId
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.employeeId,
        companyId: req.params.companyId
      }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Log the incoming request body to see what shift IDs are being received
    console.log('Incoming employee update data:', JSON.stringify(req.body, null, 2));

    // Validate if section and outlet exist and belong to the company
    const { sectionId, outletId, mondayShiftId, tuesdayShiftId, wednesdayShiftId, thursdayShiftId, fridayShiftId, saturdayShiftId, sundayShiftId } = req.body;
    
    console.log('Extracted shift IDs for update:', { 
      mondayShiftId, 
      tuesdayShiftId, 
      wednesdayShiftId, 
      thursdayShiftId, 
      fridayShiftId, 
      saturdayShiftId, 
      sundayShiftId 
    });
    
    if (sectionId) {
      const section = await Section.findOne({
        where: { id: sectionId, companyId: req.params.companyId }
      });
      
      if (!section) {
        return res.status(400).json({
          message: 'Invalid sectionId. The section must exist and belong to the company.'
        });
      }
    }
    
    if (outletId) {
      const outlet = await Outlet.findOne({
        where: { id: outletId, companyId: req.params.companyId }
      });
      
      if (!outlet) {
        return res.status(400).json({
          message: 'Invalid outletId. The outlet must exist and belong to the company.'
        });
      }
    }
    
    // Validate weekday shift IDs if provided
    const shiftIds = [mondayShiftId, tuesdayShiftId, wednesdayShiftId, thursdayShiftId, fridayShiftId, saturdayShiftId, sundayShiftId].filter(id => id);
    
    console.log('Filtered shift IDs for validation in update:', shiftIds);
    
    if (shiftIds.length > 0) {
      // Check each shift ID individually to ensure it exists and belongs to the company
      for (const shiftId of shiftIds) {
        const shift = await Shift.findOne({
          where: {
            id: shiftId,
            companyId: req.params.companyId
          }
        });
        
        if (!shift) {
          return res.status(400).json({
            message: `Shift with ID ${shiftId} is invalid or does not belong to the company.`
          });
        }
      }
      
      console.log('All provided shift IDs are valid');
    }

    // Process the request body to handle empty strings for email
    const employeeData = { ...req.body };
    if (employeeData.email === '') {
      employeeData.email = null;
    }
    
    // Convert empty string shift IDs to null
    if (employeeData.mondayShiftId === '') employeeData.mondayShiftId = null;
    if (employeeData.tuesdayShiftId === '') employeeData.tuesdayShiftId = null;
    if (employeeData.wednesdayShiftId === '') employeeData.wednesdayShiftId = null;
    if (employeeData.thursdayShiftId === '') employeeData.thursdayShiftId = null;
    if (employeeData.fridayShiftId === '') employeeData.fridayShiftId = null;
    if (employeeData.saturdayShiftId === '') employeeData.saturdayShiftId = null;
    if (employeeData.sundayShiftId === '') employeeData.sundayShiftId = null;

    // Convert string shift IDs to integers - ensure we're handling all possible formats
    // Use explicit type conversion to ensure values are stored as integers
    if (employeeData.mondayShiftId !== null && employeeData.mondayShiftId !== undefined) {
      employeeData.mondayShiftId = Number(employeeData.mondayShiftId);
      if (isNaN(employeeData.mondayShiftId)) employeeData.mondayShiftId = null;
    }
    if (employeeData.tuesdayShiftId !== null && employeeData.tuesdayShiftId !== undefined) {
      employeeData.tuesdayShiftId = Number(employeeData.tuesdayShiftId);
      if (isNaN(employeeData.tuesdayShiftId)) employeeData.tuesdayShiftId = null;
    }
    if (employeeData.wednesdayShiftId !== null && employeeData.wednesdayShiftId !== undefined) {
      employeeData.wednesdayShiftId = Number(employeeData.wednesdayShiftId);
      if (isNaN(employeeData.wednesdayShiftId)) employeeData.wednesdayShiftId = null;
    }
    if (employeeData.thursdayShiftId !== null && employeeData.thursdayShiftId !== undefined) {
      employeeData.thursdayShiftId = Number(employeeData.thursdayShiftId);
      if (isNaN(employeeData.thursdayShiftId)) employeeData.thursdayShiftId = null;
    }
    if (employeeData.fridayShiftId !== null && employeeData.fridayShiftId !== undefined) {
      employeeData.fridayShiftId = Number(employeeData.fridayShiftId);
      if (isNaN(employeeData.fridayShiftId)) employeeData.fridayShiftId = null;
    }
    if (employeeData.saturdayShiftId !== null && employeeData.saturdayShiftId !== undefined) {
      employeeData.saturdayShiftId = Number(employeeData.saturdayShiftId);
      if (isNaN(employeeData.saturdayShiftId)) employeeData.saturdayShiftId = null;
    }
    if (employeeData.sundayShiftId !== null && employeeData.sundayShiftId !== undefined) {
      employeeData.sundayShiftId = Number(employeeData.sundayShiftId);
      if (isNaN(employeeData.sundayShiftId)) employeeData.sundayShiftId = null;
    }
    
    console.log('Processed employee data before update:', {
      mondayShiftId: employeeData.mondayShiftId,
      tuesdayShiftId: employeeData.tuesdayShiftId,
      wednesdayShiftId: employeeData.wednesdayShiftId,
      thursdayShiftId: employeeData.thursdayShiftId,
      fridayShiftId: employeeData.fridayShiftId,
      saturdayShiftId: employeeData.saturdayShiftId,
      sundayShiftId: employeeData.sundayShiftId
    });
    await employee.update(employeeData);
    
    // Log the employee data after update to verify shift IDs were saved
    console.log('Updated employee with shift IDs:', {
      mondayShiftId: employee.mondayShiftId,
      tuesdayShiftId: employee.tuesdayShiftId,
      wednesdayShiftId: employee.wednesdayShiftId,
      thursdayShiftId: employee.thursdayShiftId,
      fridayShiftId: employee.fridayShiftId,
      saturdayShiftId: employee.saturdayShiftId,
      sundayShiftId: employee.sundayShiftId
    });
    
    // Reload the employee to get the latest data from the database
    await employee.reload();
    
    // Log the employee data after reload to verify shift IDs were saved in the database
    console.log('Reloaded employee with shift IDs:', {
      mondayShiftId: employee.mondayShiftId,
      tuesdayShiftId: employee.tuesdayShiftId,
      wednesdayShiftId: employee.wednesdayShiftId,
      thursdayShiftId: employee.thursdayShiftId,
      fridayShiftId: employee.fridayShiftId,
      saturdayShiftId: employee.saturdayShiftId,
      sundayShiftId: employee.sundayShiftId
    });
    
    res.json(employee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete employee (soft delete)
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: {
        id: req.params.employeeId,
        companyId: req.params.companyId
      }
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await employee.update({ active: false });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
};