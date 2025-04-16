const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/employee.controller');

// Apply authentication middleware to all employee routes
router.use(verifyToken);

// Employee routes
router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/:employeeId', updateEmployee);
router.delete('/:employeeId', deleteEmployee);

module.exports = router;