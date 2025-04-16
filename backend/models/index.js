const Company = require('./Company');
const User = require('./User');
const Outlet = require('./Outlet');
const Section = require('./Section');
const Device = require('./Device');
const Employee = require('./Employee');
const TimeRecord = require('./TimeRecord');
const Shift = require('./Shift');
const Schedule = require('./Schedule');

const db = {
  Company,
  User,
  Outlet,
  Section,
  Device,
  Employee,
  TimeRecord,
  Shift,
  Schedule
};

// Define associations after all models are imported
const defineAssociations = () => {
  // Company relationships
  Company.hasMany(User);
  Company.hasMany(Outlet);
  Company.hasMany(Section);
  Company.hasMany(Device);
  Company.hasMany(Employee);
  Company.hasMany(TimeRecord);
  Company.hasMany(Schedule);

  // User relationships
  User.belongsTo(Company);

  // Outlet relationships
  Outlet.belongsTo(Company);
  Outlet.hasMany(Device);
  Outlet.hasMany(Employee);
  Outlet.hasMany(TimeRecord);
  Outlet.hasMany(Schedule);

  // Section relationships
  Section.belongsTo(Company);
  Section.hasMany(Employee);

  // Device relationships
  Device.belongsTo(Company);
  Device.belongsTo(Outlet);
  Device.hasMany(TimeRecord);

  // Employee relationships
  Employee.belongsTo(Company);
  Employee.belongsTo(Outlet);
  Employee.belongsTo(Section);
  Employee.hasMany(TimeRecord);
  Employee.hasMany(Schedule);
  
  // Employee weekday shift relationships
  Employee.belongsTo(Shift, { as: 'MondayShift', foreignKey: 'mondayShiftId' });
  Employee.belongsTo(Shift, { as: 'TuesdayShift', foreignKey: 'tuesdayShiftId' });
  Employee.belongsTo(Shift, { as: 'WednesdayShift', foreignKey: 'wednesdayShiftId' });
  Employee.belongsTo(Shift, { as: 'ThursdayShift', foreignKey: 'thursdayShiftId' });
  Employee.belongsTo(Shift, { as: 'FridayShift', foreignKey: 'fridayShiftId' });
  Employee.belongsTo(Shift, { as: 'SaturdayShift', foreignKey: 'saturdayShiftId' });
  Employee.belongsTo(Shift, { as: 'SundayShift', foreignKey: 'sundayShiftId' });

  // TimeRecord relationships
  TimeRecord.belongsTo(Company);
  TimeRecord.belongsTo(Outlet);
  TimeRecord.belongsTo(Employee);
  TimeRecord.belongsTo(Device);
  
  // Shift relationships
  Shift.belongsTo(Company);
  Company.hasMany(Shift);

  // Schedule relationships
  Schedule.belongsTo(Company);
  Schedule.belongsTo(Outlet);
  Schedule.belongsTo(Employee);
};

defineAssociations();

module.exports = {
  Company,
  User,
  Outlet,
  Section,
  Device,
  Employee,
  TimeRecord,
  Shift,
  Schedule,
  defineAssociations
};