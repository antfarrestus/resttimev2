const { TimeRecord, Employee, Schedule, Outlet } = require('../models');
const { Op } = require('sequelize');
const { format, parseISO, differenceInMinutes } = require('date-fns');

// Get time records for a specific date range
const getTimeRecords = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, outletId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    

    // startDate and endDate are strings, so we need to parse them for start from 00:00:00 for end 23:59:59 

    const startDateObj = new Date(startDate);
    // Set endDate to the end of the day (23:59:59.999)
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    // Check if the parsed dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

  // 2) Build your WHERE-conditions
  const whereConditions = {
    companyId,
    // clockInTime will be passed as a proper DATETIME parameter
    clockInTime: {
      [Op.between]: [ startDateObj, endDateObj ]
    }
  };

    // Add outlet filter if provided
    if (outletId) {
      whereConditions.outletId =outletId;
    }

    console.log('Query conditions:', whereConditions);
    
    // Define include options with error handling
    const includeOptions = [{
      model: Employee,
      attributes: ['id', 'firstName', 'lastName', 'outletId', 'sectionId'],
      required: false // Use LEFT JOIN to prevent records from being excluded if employee is missing
    }];

    const timeRecords = await TimeRecord.findAll({
      where: whereConditions,
      include: includeOptions
    });
    
    // Log warning for records without associated employee
    timeRecords.forEach(record => {
      if (!record.Employee) {
        console.warn(`TimeRecord ID ${record.id} has no associated Employee`);
      }
    });
    
    // Process time records to calculate duration and overtime
    const processedRecords = {};
    

    for (const record of timeRecords) {
      try {
        // Use record.date if available, otherwise extract from clockInTime
        let dateStr;
        try {
          if (record.date) {
            const dateObj = new Date(record.date);
            if (isNaN(dateObj.getTime())) {
              console.warn('Invalid date value for record:', record.id, record.date);
              continue;
            }
            dateStr = format(dateObj, 'yyyy-MM-dd');
          } else if (record.clockInTime) {
            const clockInObj = new Date(record.clockInTime);
            if (isNaN(clockInObj.getTime())) {
              console.warn('Invalid clockInTime value for record:', record.id, record.clockInTime);
              continue;
            }
            dateStr = format(clockInObj, 'yyyy-MM-dd');
          } else {
            // Skip records without a valid date
            console.warn('Skipping record without date or clockInTime:', record.id);
            continue;
          }
        } catch (dateError) {
          console.error('Error processing date for record:', record.id, dateError);
          continue;
        }
        
        // Calculate duration in hours
        let duration = record.duration || 0;
        let overtime = 0;
        
        if (record.clockInTime && record.clockOutTime) {
          try {
            // Validate date objects before calculations
            const clockInObj = new Date(record.clockInTime);
            const clockOutObj = new Date(record.clockOutTime);

            // timezone local time
            startDateObj.setHours(startDateObj.getHours() + 3);
            endDateObj.setHours(endDateObj.getHours() + 3);
            // strip z in the end

            startDateObj.setMilliseconds(0);
            endDateObj.setMilliseconds(0);
            
            if (isNaN(clockInObj.getTime()) || isNaN(clockOutObj.getTime())) {
              console.warn('Invalid clock in/out times for record:', record.id, 
                { clockIn: record.clockInTime, clockOut: record.clockOutTime });
              // Use stored duration or default to 0
              duration = record.duration || 0;
              overtime = 0;
            } else {
              // Total minutes worked
              let totalMinutes = differenceInMinutes(clockOutObj, clockInObj);
              
              // Validate totalMinutes is positive
              if (totalMinutes < 0) {
                console.warn('Negative duration detected for record:', record.id, 
                  { clockIn: record.clockInTime, clockOut: record.clockOutTime, minutes: totalMinutes });
                totalMinutes = Math.abs(totalMinutes); // Use absolute value as fallback
              }
              
              // Subtract break time if both break start and end exist
              if (record.breakStartTime && record.breakEndTime) {
                try {
                  const breakStartObj = new Date(record.breakStartTime);
                  const breakEndObj = new Date(record.breakEndTime);
                  
                  if (!isNaN(breakStartObj.getTime()) && !isNaN(breakEndObj.getTime())) {
                    const breakMinutes = differenceInMinutes(breakEndObj, breakStartObj);
                    if (breakMinutes > 0) {
                      totalMinutes -= breakMinutes;
                    }
                  }
                } catch (breakError) {
                  console.error('Error calculating break time for record:', record.id, breakError);
                }
              }
              
              // Subtract second break time if both exist
              if (record.break2StartTime && record.break2EndTime) {
                try {
                  const break2StartObj = new Date(record.break2StartTime);
                  const break2EndObj = new Date(record.break2EndTime);
                  
                  if (!isNaN(break2StartObj.getTime()) && !isNaN(break2EndObj.getTime())) {
                    const break2Minutes = differenceInMinutes(break2EndObj, break2StartObj);
                    if (break2Minutes > 0) {
                      totalMinutes -= break2Minutes;
                    }
                  }
                } catch (break2Error) {
                  console.error('Error calculating second break time for record:', record.id, break2Error);
                }
              }
              
              // Subtract third break time if both exist
              if (record.break3StartTime && record.break3EndTime) {
                try {
                  const break3StartObj = new Date(record.break3StartTime);
                  const break3EndObj = new Date(record.break3EndTime);
                  
                  if (!isNaN(break3StartObj.getTime()) && !isNaN(break3EndObj.getTime())) {
                    const break3Minutes = differenceInMinutes(break3EndObj, break3StartObj);
                    if (break3Minutes > 0) {
                      totalMinutes -= break3Minutes;
                    }
                  }
                } catch (break3Error) {
                  console.error('Error calculating third break time for record:', record.id, break3Error);
                }
              }
            
              // Convert minutes to hours (only if we're in the valid date branch)
              duration = (totalMinutes / 60).toFixed(2);
              
              // Calculate overtime based on employee's scheduled hours if available
              // Find matching schedule for this employee on this date
              const dateStr = format(clockInObj, 'yyyy-MM-dd');
              const employeeId = record.employeeId;
              
              try {
                // Try to find a matching schedule to get scheduled hours
                const Schedule = require('../models').Schedule;
                const matchingSchedule = await Schedule.findOne({
                  where: {
                    employeeId,
                    date: dateStr
                  }
                });
                
                // If we have a matching schedule with start and end times, use that for overtime calculation
                if (matchingSchedule && matchingSchedule.startTime && matchingSchedule.endTime) {
                  const scheduledStart = parseISO(`${dateStr}T${matchingSchedule.startTime}`);
                  const scheduledEnd = parseISO(`${dateStr}T${matchingSchedule.endTime}`);
                  
                  // Calculate scheduled minutes, accounting for breaks if defined
                  let scheduledMinutes = differenceInMinutes(scheduledEnd, scheduledStart);
                  
                  // Subtract scheduled break time if both break start and end exist
                  if (matchingSchedule.break1start && matchingSchedule.break1end) {
                    const breakStart = parseISO(`${dateStr}T${matchingSchedule.break1start}`);
                    const breakEnd = parseISO(`${dateStr}T${matchingSchedule.break1end}`);
                    const breakMinutes = differenceInMinutes(breakEnd, breakStart);
                    if (breakMinutes > 0) {
                      scheduledMinutes -= breakMinutes;
                    }
                  }
                  
                  // Calculate overtime as anything over scheduled hours
                  const scheduledHours = scheduledMinutes / 60;
                  overtime = Math.max(0, (totalMinutes / 60 - scheduledHours)).toFixed(2);
                } else {
                  // Fallback to standard 8-hour day if no schedule found
                  overtime = Math.max(0, (totalMinutes / 60 - 8)).toFixed(2);
                }
              } catch (scheduleError) {
                console.error('Error finding schedule for overtime calculation:', scheduleError);
                // Fallback to standard 8-hour day
                overtime = Math.max(0, (totalMinutes / 60 - 8)).toFixed(2);
              }
            }
          } catch (err) {
            console.error('Error calculating duration for record:', record.id, err);
            // Use the stored duration value if calculation fails
            duration = record.duration || 0;
            overtime = 0;
          }
        }

        // If the date doesn't exist in processedRecords, create it
        if (!processedRecords[dateStr]) {
          processedRecords[dateStr] = {};
        }

        const breaks = [];

    // Handle first break
    if (record.breakStartTime || record.breakEndTime) {
      breaks.push({
        start: record.breakStartTime,
        end: record.breakEndTime,
        label: record.break1Label || 'Break 1'
      });
    }
    
    // Handle second break
    if (record.break2StartTime || record.break2EndTime) {
      breaks.push({
        start: record.break2StartTime,
        end: record.break2EndTime,
        label: record.break2Label || 'Break 2'
      });
    }
    
    // Handle third break
    if (record.break3StartTime || record.break3EndTime) {
      breaks.push({
        start: record.break3StartTime,
        end: record.break3EndTime,
        label: record.break3Label || 'Break 3'
      });
    }

        // Add the record to the processed records
        processedRecords[dateStr][record.employeeId] = {
          id: record.id,
          employeeId: record.employeeId,
          clockIn: record.clockInTime,
          clockOut: record.clockOutTime,
          breaks,
          duration,
          overtime,
          img1: record.img1,
          img2: record.img2,
          img3: record.img3,
          img4: record.img4,
          img5: record.img5,
          img6: record.img6,
          img7: record.img7,
          img8: record.img8
        };
      } catch (err) {
        console.error('Error processing time record:', record.id, err);
        // Continue with next record
      }
    }
    

    // Validate the final processed records before sending response
    if (!processedRecords || typeof processedRecords !== 'object') {
      console.error('Invalid processed records structure:', processedRecords);
      return res.status(500).json({ message: 'Error processing time records data' });
    }
    
    // Send the response with proper error handling
    try {
      res.json(processedRecords);
    } catch (responseError) {
      console.error('Error sending time records response:', responseError);
      res.status(500).json({ message: 'Error sending time records data' });
    }
  } catch (error) {
    console.error('Error fetching time records:', error);
    res.status(500).json({ message: 'Failed to fetch time records' });
  }
};

// Get schedule comparison for time records
const getScheduleComparison = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { startDate, endDate, outletId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    // Parse date strings to Date objects with proper validation
    const startDateObj = new Date(startDate);
    // Set endDate to the end of the day (23:59:59.999)
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    // Check if the parsed dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // Get all time records for the date range
    const whereConditions = {
      companyId,
      clockInTime: {
        [Op.between]: [startDateObj, endDateObj]
      }
    };

    if (outletId) {
      whereConditions.outletId = outletId;
    }

    const timeRecords = await TimeRecord.findAll({
      where: whereConditions,
      include: [{
        model: Employee,
        attributes: ['id', 'firstName', 'lastName', 'outletId'],
        required: false // Use LEFT JOIN to prevent records from being excluded if employee is missing
      }]
    });

    // Get all schedules for the same date range
    const schedules = await Schedule.findAll({
      where: {
        companyId,
        date: {
          [Op.between]: [format(startDateObj, 'yyyy-MM-dd'), format(endDateObj, 'yyyy-MM-dd')]
        },
        ...(outletId ? { outletId } : {})
      },
      include: [{
        model: Employee,
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    // Get outlet grace periods
    const outlets = await Outlet.findAll({
      where: {
        companyId,
        ...(outletId ? { id: outletId } : {})
      },
      attributes: [
        'id',
        'earlyClockInGrace',
        'slightlyLateClockInGrace',
        'lateClockInGrace',
        'earlyClockOutGrace',
        'slightlyLateClockOutGrace',
        'lateClockOutGrace'
      ]
    });

    // Create a map of outlet grace periods
    const outletGracePeriods = {};
    outlets.forEach(outlet => {
      outletGracePeriods[outlet.id] = {
        earlyClockInGrace: outlet.earlyClockInGrace || 0,
        slightlyLateClockInGrace: outlet.slightlyLateClockInGrace || 0,
        lateClockInGrace: outlet.lateClockInGrace || 0,
        earlyClockOutGrace: outlet.earlyClockOutGrace || 0,
        slightlyLateClockOutGrace: outlet.slightlyLateClockOutGrace || 0,
        lateClockOutGrace: outlet.lateClockOutGrace || 0
      };
    });

    // Process comparison results
    const comparisonResults = {};

    // Process each time record
    for (const record of timeRecords) {
      try {
        // Skip records without an employee association
        if (!record.Employee) {
          console.warn(`TimeRecord ID ${record.id} has no associated Employee, skipping comparison`);
          continue;
        }

        // Use record.date if available, otherwise extract from clockInTime
        let dateStr;
        try {
          if (record.date) {
            const dateObj = new Date(record.date);
            if (isNaN(dateObj.getTime())) {
              console.warn('Invalid date value for record:', record.id, record.date);
              continue;
            }
            dateStr = format(dateObj, 'yyyy-MM-dd');
          } else if (record.clockInTime) {
            const clockInObj = new Date(record.clockInTime);
            if (isNaN(clockInObj.getTime())) {
              console.warn('Invalid clockInTime value for record:', record.id, record.clockInTime);
              continue;
            }
            dateStr = format(clockInObj, 'yyyy-MM-dd');
          } else {
            // Skip records without a valid date
            console.warn('Skipping comparison for record without date or clockInTime:', record.id);
            continue;
          }
        } catch (dateError) {
          console.error('Error processing date for record:', record.id, dateError);
          continue;
        }
        
        const employeeId = record.employeeId;
        
        // Initialize comparison results for this date and employee
        if (!comparisonResults[dateStr]) {
          comparisonResults[dateStr] = {};
        }
        
        // Find matching schedule for this employee on this date
        const matchingSchedule = schedules.find(s => {
          try {
            return s.employeeId === employeeId && 
                  format(new Date(s.date), 'yyyy-MM-dd') === dateStr;
          } catch (error) {
            console.error('Error comparing schedule dates:', error);
            return false;
          }
        });

        if (!matchingSchedule) {
          // No schedule found, no color needed
          comparisonResults[dateStr][employeeId] = {
            clockInColor: 'transparent',
            clockOutColor: 'transparent',
            breakStartColor: 'transparent',
            breakEndColor: 'transparent'
          };
          continue;
        }
        
        // Get grace periods for this outlet
        const gracePeriods = outletGracePeriods[record.outletId] || {
          earlyClockInGrace: 0,
          slightlyLateClockInGrace: 0,
          lateClockInGrace: 0,
          earlyClockOutGrace: 0,
          slightlyLateClockOutGrace: 0,
          lateClockOutGrace: 0
        };

        // Initialize colors
        let clockInColor = 'transparent';
        let clockOutColor = 'transparent';
        let breakStartColor = 'transparent';
        let breakEndColor = 'transparent';

        // Compare clock in time with scheduled start time
        if (record.clockInTime && matchingSchedule.startTime) {
          try {
            const scheduledStart = parseISO(`${dateStr}T${matchingSchedule.startTime}`);
            const actualClockIn = new Date(record.clockInTime);
            
            // Validate date objects
            if (isNaN(scheduledStart.getTime()) || isNaN(actualClockIn.getTime())) {
              console.warn('Invalid clock in or scheduled start time:', {
                recordId: record.id,
                clockIn: record.clockInTime,
                scheduledStart: matchingSchedule.startTime
              });
            } else {
              const diffMinutes = differenceInMinutes(actualClockIn, scheduledStart);

              // Early clock in (employee arrived before scheduled time)
              if (diffMinutes < 0 && Math.abs(diffMinutes) <= gracePeriods.earlyClockInGrace) {
                clockInColor = 'blue';
              }
              // Slightly late clock in
              else if (diffMinutes > 0 && diffMinutes <= gracePeriods.slightlyLateClockInGrace) {
                clockInColor = 'amber';
              }
              // Late clock in
              else if (diffMinutes > 0 && diffMinutes > gracePeriods.slightlyLateClockInGrace) {
                clockInColor = 'red';
              }
            }
          } catch (timeError) {
            console.error('Error comparing clock in times:', timeError);
          }
        }

        // Compare clock out time with scheduled end time
        if (record.clockOutTime && matchingSchedule.endTime) {
          try {
            const scheduledEnd = parseISO(`${dateStr}T${matchingSchedule.endTime}`);
            const actualClockOut = new Date(record.clockOutTime);
            
            // Validate date objects
            if (isNaN(scheduledEnd.getTime()) || isNaN(actualClockOut.getTime())) {
              console.warn('Invalid clock out or scheduled end time:', {
                recordId: record.id,
                clockOut: record.clockOutTime,
                scheduledEnd: matchingSchedule.endTime
              });
            } else {
              const diffMinutes = differenceInMinutes(actualClockOut, scheduledEnd);

              // Early clock out (employee left before scheduled end time)
              if (diffMinutes < 0 && Math.abs(diffMinutes) <= gracePeriods.earlyClockOutGrace) {
                clockOutColor = 'blue';
              }
              // Slightly late clock out
              else if (diffMinutes > 0 && diffMinutes <= gracePeriods.slightlyLateClockOutGrace) {
                clockOutColor = 'amber';
              }
              // Late clock out
              else if (diffMinutes > 0 && diffMinutes > gracePeriods.slightlyLateClockOutGrace) {
                clockOutColor = 'red';
              }
            }
          } catch (timeError) {
            console.error('Error comparing clock out times:', timeError);
          }
        }

        // Compare break start with scheduled break start
        if (record.breakStartTime && matchingSchedule.break1start) {
          try {
            const scheduledBreakStart = parseISO(`${dateStr}T${matchingSchedule.break1start}`);
            const actualBreakStart = new Date(record.breakStartTime);
            
            // Validate date objects
            if (isNaN(scheduledBreakStart.getTime()) || isNaN(actualBreakStart.getTime())) {
              console.warn('Invalid break start or scheduled break start time:', {
                recordId: record.id,
                breakStart: record.breakStartTime,
                scheduledBreakStart: matchingSchedule.break1start
              });
            } else {
              const diffMinutes = differenceInMinutes(actualBreakStart, scheduledBreakStart);

              // Apply the same clock in grace periods to break start
              if (diffMinutes < 0 && Math.abs(diffMinutes) <= gracePeriods.earlyClockInGrace) {
                breakStartColor = 'blue';
              }
              else if (diffMinutes > 0 && diffMinutes <= gracePeriods.slightlyLateClockInGrace) {
                breakStartColor = 'amber';
              }
              else if (diffMinutes > 0 && diffMinutes > gracePeriods.slightlyLateClockInGrace) {
                breakStartColor = 'red';
              }
            }
          } catch (timeError) {
            console.error('Error comparing break start times:', timeError);
          }
        }

        // Compare break end with scheduled break end
        if (record.breakEndTime && matchingSchedule.break1end) {
          try {
            const scheduledBreakEnd = parseISO(`${dateStr}T${matchingSchedule.break1end}`);
            const actualBreakEnd = new Date(record.breakEndTime);
            
            // Validate date objects
            if (isNaN(scheduledBreakEnd.getTime()) || isNaN(actualBreakEnd.getTime())) {
              console.warn('Invalid break end or scheduled break end time:', {
                recordId: record.id,
                breakEnd: record.breakEndTime,
                scheduledBreakEnd: matchingSchedule.break1end
              });
            } else {
              const diffMinutes = differenceInMinutes(actualBreakEnd, scheduledBreakEnd);

              // Apply the same clock out grace periods to break end
              if (diffMinutes < 0 && Math.abs(diffMinutes) <= gracePeriods.earlyClockOutGrace) {
                breakEndColor = 'blue';
              }
              else if (diffMinutes > 0 && diffMinutes <= gracePeriods.slightlyLateClockOutGrace) {
                breakEndColor = 'amber';
              }
              else if (diffMinutes > 0 && diffMinutes > gracePeriods.slightlyLateClockOutGrace) {
                breakEndColor = 'red';
              }
            }
          } catch (timeError) {
            console.error('Error comparing break end times:', timeError);
          }
        }

        // Store the comparison results
        comparisonResults[dateStr][employeeId] = {
          clockInColor,
          clockOutColor,
          breakStartColor,
          breakEndColor
        };
      } catch (err) {
        console.error('Error processing time record for comparison:', record.id, err);
        continue;
      }
    }
    
    // Validate the final comparison results before sending response
    if (!comparisonResults || typeof comparisonResults !== 'object') {
      console.error('Invalid comparison results structure:', comparisonResults);
      return res.status(500).json({ message: 'Error processing schedule comparison data' });
    }
    
    // Send the response with proper error handling
    try {
      res.json(comparisonResults);
    } catch (responseError) {
      console.error('Error sending schedule comparison response:', responseError);
      res.status(500).json({ message: 'Error sending schedule comparison data' });
    }
  } catch (error) {
    console.error('Error fetching schedule comparison:', error);
    res.status(500).json({ message: 'Failed to fetch schedule comparison' });
  }
};

module.exports = {
  getTimeRecords,
  getScheduleComparison
};