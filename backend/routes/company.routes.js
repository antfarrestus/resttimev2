const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} = require('../controllers/company.controller');
const userRoutes = require('./user.routes');
const outletRoutes = require('./outlet.routes');
const deviceRoutes = require('./device.routes');
const sectionRoutes = require('./section.routes');
const shiftRoutes = require('./shift.routes');
const employeeRoutes = require('./employee.routes');

// Apply authentication middleware to all company routes
router.use(verifyToken);

// Mount user routes
router.use('/:companyId/users', userRoutes);

// Mount outlet routes
router.use('/:companyId/outlets', outletRoutes);

// Mount device routes
router.use('/:companyId/devices', deviceRoutes);

// Mount section routes
router.use('/:companyId/sections', sectionRoutes);

// Mount shift routes
router.use('/:companyId/shifts', shiftRoutes);

// Mount employee routes
router.use('/:companyId/employees', employeeRoutes);

router.get('/', getAllCompanies);
router.get('/:id', getCompanyById);
router.post('/', createCompany);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;