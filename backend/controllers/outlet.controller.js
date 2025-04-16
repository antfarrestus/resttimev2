const { Outlet } = require('../models');

// Get all outlets for a company
const getOutlets = async (req, res) => {
  try {
    const outlets = await Outlet.findAll({
      where: { companyId: req.params.companyId, active: true },
      order: [['name', 'ASC']]
    });
    res.json(outlets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create outlet
const createOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.create({
      ...req.body,
      companyId: req.params.companyId
    });

    // Find all admin users of the company and update their outletAccess
    const { User } = require('../models');
    const adminUsers = await User.findAll({
      where: {
        companyId: req.params.companyId,
        role: 'admin'
      }
    });

    // Update outletAccess for each admin user
    for (const user of adminUsers) {
      let currentOutlets = [];
      
      // Parse existing outletAccess, handle both array and string formats
      if (user.outletAccess) {
        try {
          currentOutlets = typeof user.outletAccess === 'string' 
            ? JSON.parse(user.outletAccess)
            : user.outletAccess;
        } catch (e) {
          console.error('Error parsing outletAccess:', e);
          currentOutlets = [];
        }
      }

      // Ensure currentOutlets is an array
      if (!Array.isArray(currentOutlets)) {
        currentOutlets = [];
      }

      // Add new outlet ID if not already present
      if (!currentOutlets.includes(outlet.id)) {
        currentOutlets.push(outlet.id);
        await user.update({
          outletAccess: JSON.stringify(currentOutlets)
        });
      }
    }

    res.status(201).json(outlet);
  } catch (error) {
    console.error('Error creating outlet:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update outlet
const updateOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findOne({
      where: {
        id: req.params.id,
        companyId: req.params.companyId
      }
    });
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }
    await outlet.update(req.body);
    res.json(outlet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete outlet
const deleteOutlet = async (req, res) => {
  try {
    const outlet = await Outlet.findOne({
      where: {
        id: req.params.id,
        companyId: req.params.companyId
      }
    });
    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    // Find all users (both admin and manager) of the company
    const { User } = require('../models');
    const users = await User.findAll({
      where: {
        companyId: req.params.companyId,
        role: ['admin', 'manager']
      }
    });

    // Update outletAccess for each user
    for (const user of users) {
      let currentOutlets = [];
      
      // Parse existing outletAccess, handle both array and string formats
      if (user.outletAccess) {
        try {
          currentOutlets = typeof user.outletAccess === 'string' 
            ? JSON.parse(user.outletAccess)
            : user.outletAccess;
        } catch (e) {
          console.error('Error parsing outletAccess:', e);
          currentOutlets = [];
        }
      }

      // Ensure currentOutlets is an array
      if (!Array.isArray(currentOutlets)) {
        currentOutlets = [];
      }

      // Remove the outlet ID from the array
      const updatedOutlets = currentOutlets.filter(id => id !== outlet.id);
      
      // Update user if the array has changed
      if (currentOutlets.length !== updatedOutlets.length) {
        await user.update({
          outletAccess: JSON.stringify(updatedOutlets)
        });
      }
    }

    await outlet.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet
};