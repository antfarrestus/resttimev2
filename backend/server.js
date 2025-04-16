const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db.config');
require('dotenv').config();

// Import models
const models = require('./models');

// Import routes
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const scheduleRoutes = require('./routes/schedule.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use( cors({
  // origin: "http://localhost:3000", // remove this line to allow all origins
  methods: "GET,POST,PUT,DELETE",
  credentials: true, // Allows cookies & authorization headers
}));
app.use(express.json());

// Routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Restime API',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login'
      },
      companies: {
        list: 'GET /api/companies',
        getById: 'GET /api/companies/:id',
        create: 'POST /api/companies',
        update: 'PUT /api/companies/:id',
        delete: 'DELETE /api/companies/:id'
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api', scheduleRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Restime API' });
});

// Sync database & start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Model associations are already defined in models/index.js
    // No need to call defineAssociations() again
    
    // Sync database (in development)
    await sequelize.sync();
    console.log('Database synchronized');

    // Create super admin user if not exists
    const { User } = require('./models');
    const superAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!superAdmin) {
      await User.create({
        username: 'admin',
        password: 'password',
        role: 'super_admin',
        active: true
      });
      console.log('Super admin user created successfully');
    }
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();