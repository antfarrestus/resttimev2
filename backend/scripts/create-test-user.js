const { User } = require('../models');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    const testUser = await User.create({
      username: 'testadmin',
      password: 'test123', // Will be hashed by the model hooks
      role: 'admin',
      active: true
    });

    console.log('Test user created successfully:', testUser.username);
  } catch (error) {
    console.error('Error creating test user:', error.message);
  }
}

createTestUser();