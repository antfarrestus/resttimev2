const { Company, User } = require('../models');

// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { active: true }
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create company
const createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update company
const updateCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // If company is being set to inactive, deactivate all its users
    if (req.body.active === false) {
      await User.update(
        { active: false },
        { where: { companyId: company.id } }
      );
    }

    await company.update(req.body);
    res.json(company);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete company (soft delete)
const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Deactivate all users of the company
    await User.update(
      { active: false },
      { where: { companyId: company.id } }
    );

    await company.update({ active: false });
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
};