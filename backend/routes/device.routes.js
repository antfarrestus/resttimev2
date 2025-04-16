const express = require('express');
const router = express.Router({ mergeParams: true });
const { Device, Outlet } = require('../models');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all device routes
router.use(verifyToken);

// Get all devices for a company
router.get('/', async (req, res) => {
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
    res.status(500).json({ message: 'Failed to fetch devices' });
  }
});

// Create a new device
router.post('/', async (req, res) => {
  try {
    const { name, password, outletId } = req.body;

    // Validate required fields
    if (!name || !password || !outletId) {
      return res.status(400).json({
        message: 'Missing required fields. Name, password, and outletId are required.'
      });
    }

    // Validate if outlet exists and belongs to the company
    const { Outlet } = require('../models');
    const outlet = await Outlet.findOne({
      where: {
        id: outletId,
        companyId: req.params.companyId
      }
    });

    if (!outlet) {
      return res.status(400).json({
        message: 'Invalid outletId. The outlet must exist and belong to the company.'
      });
    }

    const device = await Device.create({
      name,
      password,
      outletId,
      companyId: req.params.companyId,
      active: true
    });

    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({
      message: 'Failed to create device',
      error: error.message
    });
  }
});

// Update a device
router.put('/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({
      where: {
        id: req.params.deviceId,
        companyId: req.params.companyId
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    await device.update(req.body);
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ message: 'Failed to update device' });
  }
});

// Delete a device
router.delete('/:deviceId', async (req, res) => {
  try {
    const device = await Device.findOne({
      where: {
        id: req.params.deviceId,
        companyId: req.params.companyId
      }
    });

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    await device.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ message: 'Failed to delete device' });
  }
});

module.exports = router;