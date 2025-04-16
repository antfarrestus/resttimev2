const { Section } = require('../models');

// Get all sections for a company
const getSections = async (req, res) => {
  try {
    const { companyId } = req.params;
    const sections = await Section.findAll({
      where: { companyId },
      order: [['name', 'ASC']]
    });
    res.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: 'Failed to fetch sections' });
  }
};

// Create a new section
const createSection = async (req, res) => {
  try {
    const { companyId } = req.params;
    const sectionData = { 
      ...req.body, 
      companyId,
      createdBy: req.userId // Add the user ID who created the section
    };
    
    const section = await Section.create(sectionData);
    res.status(201).json(section);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ message: 'Failed to create section' });
  }
};

// Update a section
const updateSection = async (req, res) => {
  try {
    const { companyId, sectionId } = req.params;
    
    const section = await Section.findOne({
      where: { id: sectionId, companyId }
    });
    
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Add the user ID who updated the section
    const updateData = {
      ...req.body,
      updatedBy: req.userId
    };
    
    await section.update(updateData);
    res.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(500).json({ message: 'Failed to update section' });
  }
};

// Delete a section (hard delete)
const deleteSection = async (req, res) => {
  try {
    const { companyId, sectionId } = req.params;
    
    const section = await Section.findOne({
      where: { id: sectionId, companyId }
    });
    
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    await section.destroy();
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    res.status(500).json({ message: 'Failed to delete section' });
  }
};

module.exports = {
  getSections,
  createSection,
  updateSection,
  deleteSection
};