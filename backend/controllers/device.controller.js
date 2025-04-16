const { Device, Outlet } = require('../models');

const deviceController = {
  // Get all devices for a company
  getAllDevices: async (req, res) => {
    try {
      const devices = await Device.findAll({
        where: { companyId: req.params.companyId },
        include: [{
          model: Outlet,
          attributes: ['id', 'name']
        }],
        order: [['createdAt', 'DESC']]
      });
      res.json(devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      res.status(500).json({ message: 'Error fetching devices' });
    }
  },

  // Create a new device
  createDevice: async (req, res) => {
    try {
      const { name, password, outletId } = req.body;
      const device = await Device.create({
        name,
        password, // Store password as plain text
        outletId,
        companyId: req.user.companyId
      });
      res.status(201).json(device);
    } catch (error) {
      console.error('Error creating device:', error);
      res.status(500).json({ message: 'Error creating device' });
    }
  },

  // Update a device
  updateDevice: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, password, outletId, active } = req.body;
      
      const device = await Device.findOne({
        where: { 
          id,
          companyId: req.user.companyId
        }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      await device.update({
        name,
        password, // Update password as plain text
        outletId,
        active
      });

      res.json(device);
    } catch (error) {
      console.error('Error updating device:', error);
      res.status(500).json({ message: 'Error updating device' });
    }
  },

  // Delete a device
  deleteDevice: async (req, res) => {
    try {
      const { id } = req.params;
      const device = await Device.findOne({
        where: { 
          id,
          companyId: req.user.companyId
        }
      });

      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }

      await device.destroy();
      res.json({ message: 'Device deleted successfully' });
    } catch (error) {
      console.error('Error deleting device:', error);
      res.status(500).json({ message: 'Error deleting device' });
    }
  }
};

module.exports = deviceController;