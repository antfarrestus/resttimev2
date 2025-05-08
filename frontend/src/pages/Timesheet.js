import React, { useState, useEffect, useRef } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { format, startOfWeek, add, sub, parseISO, formatISO, isValid, endOfMonth, startOfMonth } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getOutlets, getSections, getEmployees, getTimeRecords, getScheduleComparison, createTimeRecord, updateTimeRecord } from '../services/api';
import { ChevronDownIcon, FunnelIcon, PlusIcon, EyeIcon, ClockIcon, TrashIcon, XMarkIcon, UserCircleIcon, MagnifyingGlassIcon, ArrowUpTrayIcon, QueueListIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { Menu, Switch } from '@headlessui/react';
import ManualTimeEntryModal from '../components/ManualTimeEntryModal';
import TimeEditNoteModal from '../components/TimeEditNoteModal';
import ViewNoteModal from '../components/NoteViewModal';
import { startOfDay, endOfDay } from 'date-fns';

const Timesheet = ({ darkMode }) => {
  const { selectedCompany } = useCompany();
  const [selectedOutlet, setSelectedOutlet] = useState(() => {
    if (!selectedCompany?.id) return null;
    const savedOutletId = localStorage.getItem(`selectedOutlet_${selectedCompany.id}`);
    if (!savedOutletId) return null; // If no saved outlet ID, return null
    return savedOutletId; // Return the saved outlet ID if it exists
  });
  const [outlets, setOutlets] = useState([]);
  const [sections, setSections] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeRecords, setTimeRecords] = useState({});
  const [scheduleComparison, setScheduleComparison] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const handleEditStart = (dateStr, employeeId, field) => {
    // Capture the original value when editing starts
    const originalValue = timeRecords[dateStr]?.[employeeId]?.[field] || null;
    setEditingCell({ dateStr, employeeId, field, originalValue });
  };
  const getInitialDateRange = () => {
    const saved = sessionStorage.getItem('dateRange');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
        };
      } catch (e) {
        console.error('Invalid saved date range:', e);
      }
    }
    return {
      startDate: startOfDay(new Date()),
      endDate: endOfDay(new Date()),
    };
  };
  const handleClearField = (dateStr, employeeId, field) => {
    const updatedRecords = { ...timeRecords };

    // Ensure field exists for the employee and date
    if (updatedRecords[dateStr] && updatedRecords[dateStr][employeeId]) {
      // Capture the original time value before clearing it
      let originalTimeValue = '-';
      if (updatedRecords[dateStr][employeeId][field]) {
        originalTimeValue = formatTime(updatedRecords[dateStr][employeeId][field]);
      }
      
      // Clear the field
      updatedRecords[dateStr][employeeId][field] = null;

      // Optionally clear duration and overtime if clockIn/Out is cleared
      if (['clockIn', 'clockOut'].includes(field)) {
        updatedRecords[dateStr][employeeId].duration = null;
        updatedRecords[dateStr][employeeId].overtime = null;
      }

      // Update state with the cleared field
      setTimeRecords(updatedRecords);

      // Trigger saving changes to the database after state has been updated
      setEditingCell({ dateStr, employeeId, field }); // Set the editing context
    }
  };
  
  // Handle saving changes when editing is complete
  const handleEditEnd = async () => {
    if (!editingCell) return;
    
    const { dateStr, employeeId, field, originalValue } = editingCell;
    
    // Now get the current (potentially updated) record
    const record = timeRecords[dateStr]?.[employeeId];
    
    if (!record) {
      setEditingCell(null);
      return;
    }

    // Format the original time value for display
    let originalTimeValue = originalValue ? formatTime(originalValue) : '-';
    
    if (record && record.id) {
      try {
        // Build a minimal payload
        const updateData = {};

        // Map field to correct DB key
        const fieldMap = {
          clockIn: 'clockInTime',
          clockOut: 'clockOutTime',
          breakStart: 'breakStartTime',
          breakEnd: 'breakEndTime',
          duration: 'duration',
          overtime: 'overtime',
        };

        const apiField = fieldMap[field];

        if (apiField) {
          // If this is a time field (not duration/overtime), prompt for a note
          if (['clockInTime', 'clockOutTime', 'breakStartTime', 'breakEndTime'].includes(apiField)) {
            // Now update the data
            updateData[apiField] = record[field] ?? null; // Explicitly set null
            
            const defaultNote = `Original ${field.charAt(0).toUpperCase() + field.slice(1)} time: ${originalTimeValue}`;
            const noteField = `${field}Note`;
            
            // Save both the new time value and the default note immediately
            const updateDataWithNote = {
              [apiField]: record[field] ?? null,
              [noteField]: defaultNote,
            };
            
            await updateTimeRecord(selectedCompany.id, record.id, updateDataWithNote);
            console.log(`Updated ${apiField} and added default ${noteField} for employee ${employeeId} on ${dateStr}`);
            
            // Open the note modal with the default note pre-filled
            openNoteModal(dateStr, employeeId, field, defaultNote);
            
            setEditingCell(null);
            return; // Exit early as we'll handle the note separately
          } else {
            // For non-time fields
            updateData[apiField] = record[field] ?? null; // Explicitly set null
          }
        }

        // Optional: send duration/overtime only when they were edited directly
        if (field === 'duration' || field === 'overtime') {
          updateData.duration = record.duration;
          updateData.overtime = record.overtime;
        }
        
        // Handle break array fields (like breakStart-0, breakEnd-1, etc.)
        if (field.includes('-')) {
          const [baseField, indexStr] = field.split('-');
          const index = parseInt(indexStr);
          
          if (record.breaks && record.breaks[index]) {
            // Map to the correct API field name based on the break index
            const breakFieldMap = {
              'breakStart': ['breakStartTime', 'break2StartTime', 'break3StartTime'],
              'breakEnd': ['breakEndTime', 'break2EndTime', 'break3EndTime']
            };
            
            const apiBreakField = breakFieldMap[baseField][index];
            const breakField = baseField === 'breakStart' ? 'start' : 'end';
            
            if (apiBreakField) {
              updateData[apiBreakField] = record.breaks[index][breakField] ?? null;
              
              // Create a note for the break field
              const noteFieldMap = {
                'breakStartTime': 'breakStartNote',
                'breakEndTime': 'breakEndNote',
                'break2StartTime': 'break2StartNote',
                'break2EndTime': 'break2EndNote',
                'break3StartTime': 'break3StartNote',
                'break3EndTime': 'break3EndNote'
              };
              
              const noteField = noteFieldMap[apiBreakField];
              const defaultNote = `Original ${baseField.charAt(0).toUpperCase() + baseField.slice(1)} time: ${originalTimeValue}`;
              
              updateData[noteField] = defaultNote;
            }
          }
        }

        // Now send only the changed field
        await updateTimeRecord(selectedCompany.id, record.id, updateData);
        console.log(`Updated ${apiField} for employee ${employeeId} on ${dateStr}`);
      } catch (error) {
        console.error('Error updating time record:', error);
      }
    } else {
      // For records without an ID, use the old saveTimeRecord method
      saveTimeRecord(dateStr, employeeId);
    }
    
    setEditingCell(null);
  };
  
  // Save the time record to the database
  const saveTimeRecord = (dateStr, employeeId) => {
    const record = timeRecords[dateStr]?.[employeeId];
    if (!record) return;
    
    // If the record has an ID, update it; otherwise create a new one
    if (record.id) {
      // Prepare data for update
      const updateData = {
        clockInTime: record.clockIn,
        clockOutTime: record.clockOut,
        breakStartTime: record.breakStart,
        breakEndTime: record.breakEnd,
        clockInNote: record.clockInNote,
        clockOutNote: record.clockOutNote,
        breakStartNote: record.breakStartNote,
        breakEndNote: record.breakEndNote,
        duration: record.duration,
        overtime: record.overtime
      };
      
      // Remove null or undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === null || updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Update the record
      updateTimeRecord(selectedCompany.id, record.id, updateData)
        .catch(error => console.error('Error updating time record:', error));
    } else {
      // Create a new record
      // This would typically be handled by the ManualTimeEntryModal
      console.warn('Creating new time records directly is not implemented');
    }
  };


  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteModalData, setNoteModalData] = useState({
    dateStr: '',
    employeeId: null,
    field: '',
    originalTime: ''
  });

  const openImagePreview = (url) => {
    setPreviewImageUrl(url); // Adds modal behavior
  };

  const closeImagePreview = () => {
    setPreviewImageUrl(null);
  };
  
  const openNoteModal = (dateStr, employeeId, field, originalTime) => {
    setNoteModalData({
      dateStr,
      employeeId,
      field,
      originalTime
    });
    setIsNoteModalOpen(true);
  };
  
  const closeNoteModal = () => {
    setIsNoteModalOpen(false);
  };
  
  const saveTimeEditNote = (note) => {
    const { dateStr, employeeId, field } = noteModalData;
    const updatedRecords = { ...timeRecords };
    
    if (!updatedRecords[dateStr]) updatedRecords[dateStr] = {};
    if (!updatedRecords[dateStr][employeeId]) updatedRecords[dateStr][employeeId] = {};
    
    // Add note to the appropriate field
    const noteField = `${field}Note`;
    updatedRecords[dateStr][employeeId][noteField] = note;
    
    setTimeRecords(updatedRecords);
    
    // Save the note to the database
    if (updatedRecords[dateStr][employeeId].id) {
      const updateData = {
        [noteField]: note
      };
      
      updateTimeRecord(selectedCompany.id, updatedRecords[dateStr][employeeId].id, updateData)
        .catch(error => console.error('Error saving time edit note:', error));
    }
  };



  const [dateRange, setDateRange] = useState(getInitialDateRange);

  useEffect(() => {
    sessionStorage.setItem('dateRange', JSON.stringify({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    }));
  }, [dateRange]);


  const [isMainOutletDropdownOpen, setIsMainOutletDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [filters, setFilters] = useState({
    section: '',
    outlet: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'employee'
  const [showTotalsOnly, setShowTotalsOnly] = useState(false); // Track if only totals should be shown
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false); // State for manual entry modal
  const [isNoteViewOpen, setIsNoteViewOpen] = useState(false);
  const [viewNoteText, setViewNoteText] = useState('');



  // Handle click outside of search field
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    section: true,
    outlet: true,
    mobile: false,
    payroll: false,
    login: true,
    logout: true,
    breakStart: true,
    breakEnd: true,
    duration: true,
    overtime: false,
    cost: true
  });

  // Load from localStorage on first render
  useEffect(() => {
    const savedColumns = localStorage.getItem('visibleColumns');
    if (savedColumns) {
      setVisibleColumns(JSON.parse(savedColumns));
    }
  }, []);

  // Generate days within the selected date range
  const getDaysInRange = () => {
    const days = [];
    let currentDate = dateRange.startDate;

    while (currentDate <= dateRange.endDate) {
      days.push({
        name: format(currentDate, 'EEEE'),
        date: format(currentDate, 'dd/MM'),
        fullDate: currentDate
      });
      currentDate = add(currentDate, { days: 1 });
    }

    return days;
  };

  const handleDeleteTimeField = (dateStr, employeeId, field) => {
    const updatedRecords = { ...timeRecords };
    if (!updatedRecords[dateStr]) updatedRecords[dateStr] = {};
    if (!updatedRecords[dateStr][employeeId]) updatedRecords[dateStr][employeeId] = {};

    // Capture the original time value before clearing it
    let originalTimeValue = '-';
    if (updatedRecords[dateStr][employeeId][field]) {
      originalTimeValue = formatTime(updatedRecords[dateStr][employeeId][field]);
    }

    updatedRecords[dateStr][employeeId][field] = null; // Ensure UI data is null
    setEditingCell({ dateStr, employeeId, field });
    setTimeRecords(updatedRecords);
  };




  const weekDays = getDaysInRange();

  // Get ribbon class based on color from schedule comparison
  const getRibbonClass = (dateStr, employeeId, field) => {
    // Default to transparent if no comparison data
    if (!scheduleComparison[dateStr] || !scheduleComparison[dateStr][employeeId]) {
      return 'bg-transparent';
    }

    // Use the schedule comparison data that's already fetched
    const comparison = scheduleComparison[dateStr][employeeId];
    let color = 'transparent';

    // Map field to the corresponding color field in comparison data
    if (field === 'clockIn') {
      color = comparison.clockInColor;
    } else if (field === 'clockOut') {
      color = comparison.clockOutColor;
    } else if (field === 'breakStart') {
      color = comparison.breakStartColor;
    } else if (field === 'breakEnd') {
      color = comparison.breakEndColor;
    }

    // Map color to CSS class
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      case 'amber':
        return 'bg-amber-100 text-amber-700';
      case 'red':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-transparent';
    }
  };



  // Calculate cost for a specific duration using employee's hourly pay rate
  const calculateCost = (duration, employeeId) => {
    // Find the employee by ID to get their hourly pay rate
    const employee = employees.find(emp => emp.id === employeeId);
    // Use employee's hourlyPay if available, otherwise fallback to 0
    const hourlyRate = employee?.hourlyPay || 0;
    const cost = hourlyRate * parseFloat(duration);
    return cost.toFixed(2);
  };

  // Calculate totals for an employee across all days
  const calculateEmployeeTotals = (employeeId) => {
    let totalDuration = 0;
    let totalOvertime = 0;
    let totalCost = 0;

    weekDays.forEach(day => {
      const dateStr = format(day.fullDate, 'yyyy-MM-dd');
      const record = timeRecords[dateStr]?.[employeeId];
      if (record) {
        totalDuration += parseFloat(record.duration) || 0;
        totalOvertime += parseFloat(record.overtime) || 0;
        totalCost += parseFloat(calculateCost(record.duration, employeeId)) || 0;
      }
    });

    return {
      duration: totalDuration.toFixed(2),
      overtime: totalOvertime.toFixed(2),
      cost: totalCost.toFixed(2)
    };
  };

  // Calculate totals for a specific date across all employees
  const calculateDateTotals = (dateStr) => {
    let totalDuration = 0;
    let totalOvertime = 0;
    let totalCost = 0;

    // Get all employees that match the current filters
    const filteredEmployees = getFilteredEmployees();

    // Calculate totals for the filtered employees
    filteredEmployees.forEach(employee => {
      const record = timeRecords[dateStr]?.[employee.id];
      if (record) {
        totalDuration += parseFloat(record.duration) || 0;
        totalOvertime += parseFloat(record.overtime) || 0;
        totalCost += parseFloat(calculateCost(record.duration, employee.id)) || 0;
      }
    });

    return {
      duration: totalDuration.toFixed(2),
      overtime: totalOvertime.toFixed(2),
      cost: totalCost.toFixed(2)
    };
  };

  // Calculate grand totals across all employees
  const calculateGrandTotals = () => {
    let totalDuration = 0;
    let totalOvertime = 0;
    let totalCost = 0;

    // Get all employees that match the current filters
    const filteredEmployees = getFilteredEmployees();

    filteredEmployees.forEach(employee => {
      const employeeTotals = calculateEmployeeTotals(employee.id);
      totalDuration += parseFloat(employeeTotals.duration);
      totalOvertime += parseFloat(employeeTotals.overtime);
      totalCost += parseFloat(employeeTotals.cost);
    });

    return {
      duration: totalDuration.toFixed(2),
      overtime: totalOvertime.toFixed(2),
      cost: totalCost.toFixed(2)
    };
  };

  // Get filtered employees based on all active filters
  const getFilteredEmployees = () => {
    return employees.filter(employee => {
      if (!employee.active) return false;
      if (filters.section && employee.Section?.name !== filters.section) return false;
      if (filters.outlet && employee.Outlet?.name !== filters.outlet) return false;
      if (searchTerm) {
        const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
        const employeeNumber = employee.employeeNumber?.toString().toLowerCase() || '';
        const searchLower = searchTerm.toLowerCase();
        if (!fullName.includes(searchLower) && !employeeNumber.includes(searchLower)) return false;
      }
      return true;
    });
  };

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchOutlets();
      fetchSections();
      fetchEmployees();
    }
  }, [selectedCompany]);

  // Fetch real time records when employees or date range changes
  useEffect(() => {
    if (employees.length > 0 && selectedCompany?.id) {
      fetchTimeRecords();
    }
  }, [employees, dateRange, selectedCompany, selectedOutlet]);

  const fetchOutlets = async () => {
    if (selectedCompany?.id) {
      try {
        const data = await getOutlets(selectedCompany.id);
        setOutlets(data || []);

        // Try to restore the selected outlet from localStorage
        const savedOutletId = localStorage.getItem(`selectedOutlet_${selectedCompany.id}`);
        if (savedOutletId) {
          const savedOutlet = data.find(o => o.id === parseInt(savedOutletId));
          if (savedOutlet) {
            setSelectedOutlet(savedOutlet);
          }
        }
      } catch (error) {
        console.error('Error fetching outlets:', error);
        setOutlets([]);
      }
    }
  };

  const fetchSections = async () => {
    if (selectedCompany?.id) {
      try {
        const data = await getSections(selectedCompany.id);
        setSections(data || []);
      } catch (error) {
        console.error('Error fetching sections:', error);
        setSections([]);
      }
    }
  };

  const fetchEmployees = async () => {
    if (selectedCompany?.id) {
      try {
        const data = await getEmployees(selectedCompany.id);
        setEmployees(data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      }
    }
  };

  // Fetch real time records from the API
  const fetchTimeRecords = async () => {
    if (!selectedCompany?.id) return;

    try {
      // Format dates for API request
      const startDateStr = format(dateRange.startDate, 'yyyy-MM-dd');

      // If start and end dates are the same (single day selection), add one day to the end date
      // to ensure the backend includes the full day in its query
      const adjustedEndDate = dateRange.startDate.getTime() === dateRange.endDate.getTime()
        ? add(dateRange.endDate, { days: 1 })
        : dateRange.endDate;

      const endDateStr = format(adjustedEndDate, 'yyyy-MM-dd');

      // Validate date range
      if (isNaN(new Date(startDateStr).getTime()) || isNaN(new Date(endDateStr).getTime())) {
        console.error('Invalid date range selected:', { startDate: startDateStr, endDate: endDateStr });
        setTimeRecords({});
        setScheduleComparison({});
        return;
      }

      // Fetch time records with improved error handling
      let records = {};
      try {
        records = await getTimeRecords(
          selectedCompany.id,
          startDateStr,
          endDateStr,
          selectedOutlet?.id
        );

        // Validate records structure
        if (!records || typeof records !== 'object') {
          console.warn('Invalid time records format received:', records);
          records = {};
        }
      } catch (recordsError) {
        console.error('Error fetching time records:', recordsError);

        // Check for specific error types and provide more helpful messages
        if (recordsError.response && recordsError.response.status === 500) {
          console.error('Server error occurred. This might be due to invalid data in the database or a server configuration issue.');
        } else if (recordsError.response && recordsError.response.status === 400) {
          console.error('Bad request error. Please check the date range parameters.');
        } else if (recordsError.code === 'ECONNABORTED') {
          console.error('Request timeout. The server took too long to respond.');
        }

        records = {};
      }

      // Fetch schedule comparison data for color ribbons with error handling
      let comparison = {};
      try {
        comparison = await getScheduleComparison(
          selectedCompany.id,
          startDateStr,
          endDateStr,
          selectedOutlet?.id
        );

        // Validate comparison structure
        if (!comparison || typeof comparison !== 'object') {
          console.warn('Invalid schedule comparison format received:', comparison);
          comparison = {};
        }
      } catch (comparisonError) {
        console.error('Error fetching schedule comparison:', comparisonError);
        comparison = {};
      }

      setTimeRecords(records);
      setScheduleComparison(comparison);
    } catch (error) {
      console.error('Error in fetchTimeRecords function:', error);
      // Set empty objects to prevent UI crashes
      setTimeRecords({});
      setScheduleComparison({});
    }
  };

  // Format time for display (HH:MM)
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    try {
      const localString = isoString.replace('Z', ''); // strip Z if present
      const date = new Date(localString);
      return format(date, 'HH:mm');
    } catch {
      return '-';
    }
  };

  // Handle editing of time fields
  const handleTimeChange = (e, dateStr, employeeId, field) => {
    let timeValue = e.target.value;

    // Format the input if it doesn't include a colon
    // This handles cases like "1500" and converts to "15:00"
    if (timeValue && !timeValue.includes(':') && timeValue.length >= 3) {
      // If input is like "1500", format it as "15:00"
      const hours = timeValue.substring(0, timeValue.length - 2);
      const minutes = timeValue.substring(timeValue.length - 2);
      timeValue = `${hours}:${minutes}`;
    }

    // ✅ Block invalid input early
    if (!timeValue || !timeValue.includes(':')) return;

    const [hours, minutes] = timeValue.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;

    // Validate hours and minutes are within valid ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return;

    // If this is the first edit for this cell, store the original value in editingCell
    // This ensures we capture the original time before any changes
    if (!editingCell || 
        editingCell.dateStr !== dateStr || 
        editingCell.employeeId !== employeeId || 
        editingCell.field !== field) {
      // Store the original record before making any changes
      const originalValue = timeRecords[dateStr]?.[employeeId]?.[field] || null;
      setEditingCell({ 
        dateStr, 
        employeeId, 
        field,
        originalValue // Store the original value for reference
      });
    }

    // ✅ Defensive copy of records
    const updatedRecords = { ...timeRecords };
    if (!updatedRecords[dateStr]) updatedRecords[dateStr] = {};
    if (!updatedRecords[dateStr][employeeId]) updatedRecords[dateStr][employeeId] = {};

    // Check if this is a break array field (like breakStart-0, breakEnd-1, etc.)
    if (field.includes('-')) {
      const [baseField, indexStr] = field.split('-');
      const index = parseInt(indexStr);
      
      // Ensure the breaks array exists
      if (!updatedRecords[dateStr][employeeId].breaks) {
        updatedRecords[dateStr][employeeId].breaks = [];
      }
      
      // Ensure the break at this index exists
      if (!updatedRecords[dateStr][employeeId].breaks[index]) {
        updatedRecords[dateStr][employeeId].breaks[index] = {};
      }
      
      // Update the appropriate field in the break
      const breakField = baseField === 'breakStart' ? 'start' : 'end';
      const localTimeStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
      updatedRecords[dateStr][employeeId].breaks[index][breakField] = localTimeStr;
    } else {
      const existingRaw = updatedRecords[dateStr][employeeId][field];

      let baseDate;
      try {
        baseDate = existingRaw && typeof existingRaw === 'string' && existingRaw.includes('T')
          ? parseISO(existingRaw)
          : new Date(); // Fallback: today
      } catch (err) {
        console.error('parseISO error:', err, 'Value:', existingRaw);
        baseDate = new Date(); // Safe fallback
      }

      if (!isValid(baseDate)) baseDate = new Date();

      // ✅ Apply new time
      // Add Z suffix to indicate UTC time, matching the format used in ManualTimeEntryModal
      const localTimeStr = `${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`;
      updatedRecords[dateStr][employeeId][field] = localTimeStr;

      // ✅ Recalculate duration and overtime
      if (['clockIn', 'clockOut', 'breakStart', 'breakEnd'].includes(field)) {
        const record = updatedRecords[dateStr][employeeId];
        try {
          // Check if all required fields exist before parsing
          if (record.clockIn && record.clockOut && record.breakStart && record.breakEnd) {
            const clockIn = parseISO(record.clockIn);
            const clockOut = parseISO(record.clockOut);
            const breakStart = parseISO(record.breakStart);
            const breakEnd = parseISO(record.breakEnd);

            if (isValid(clockIn) && isValid(clockOut) && isValid(breakStart) && isValid(breakEnd)) {
              const workMinutes = (clockOut - clockIn) / 60000 - (breakEnd - breakStart) / 60000;
              record.duration = (workMinutes / 60).toFixed(2);
              record.overtime = Math.max(0, (workMinutes / 60 - 8)).toFixed(2);
            }
          }
        } catch (e) {
          console.warn('Duration/overtime calculation skipped due to invalid data:', e);
        }
      }
    }

    setTimeRecords(updatedRecords);
  };

  // Function to handle blur event on time inputs
  const handleTimeBlur = () => {
    // Call handleEditEnd to save changes to the database
    handleEditEnd();
  };

  // Add a function to handle the blur event (when input loses focus)
  const handleTimeInputBlur = () => {
    // Call handleEditEnd to save changes to the database
    handleEditEnd();
  };
  
  // Check if a time field has a note
  const hasNote = (dateStr, employeeId, field) => {
    const noteField = `${field}Note`;
    return !!timeRecords[dateStr]?.[employeeId]?.[noteField];
  };
  
  // Get the note for a time field
  const getNote = (dateStr, employeeId, field) => {
    const noteField = `${field}Note`;
    return timeRecords[dateStr]?.[employeeId]?.[noteField] || '';
  };
  
  // Render a note icon if a note exists for this field
  const renderNoteIcon = (dateStr, employeeId, field) => {
    if (hasNote(dateStr, employeeId, field)) {
      return (
        <div className="relative inline-block ml-1">
          <PencilSquareIcon 
            className="h-4 w-4 text-amber-500 cursor-pointer" 
            title="View note"
            onClick={() => alert(getNote(dateStr, employeeId, field))}
          />
        </div>
      );
    }
    return null;
  };


  // Handle direct editing of duration field
  const handleDurationChange = (e, dateStr, employeeId) => {
    const durationValue = parseFloat(e.target.value);
    if (isNaN(durationValue)) return;

    const updatedRecords = { ...timeRecords };
    updatedRecords[dateStr][employeeId].duration = durationValue.toFixed(2);

    // Update overtime based on new duration
    updatedRecords[dateStr][employeeId].overtime = Math.max(0, durationValue - 8).toFixed(2);

    // Set the editing cell so handleEditEnd knows which record to save
    setEditingCell({ dateStr, employeeId, field: 'duration' });

    setTimeRecords(updatedRecords);
  };

  // Add a function to handle the blur event for duration inputs
  const handleDurationBlur = (dateStr, employeeId) => {
    // Call handleEditEnd to save changes to the database
    handleEditEnd();
  };

  // The handleEditEnd function has been merged and moved up in the file




  // Handle click outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close main outlet dropdown if click is outside
      if (isMainOutletDropdownOpen && !event.target.closest('[data-dropdown="main-outlet"]')) {
        setIsMainOutletDropdownOpen(false);
      }

      // Close filter dropdowns if click is outside
      if (activeFilter && !event.target.closest('.filter-dropdown')) {
        setActiveFilter(null);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMainOutletDropdownOpen, activeFilter]);

  const handleDateRangeChange = (start, end) => {
    setDateRange({ startDate: start, endDate: end });
  };

  const handleToday = () => {
    const today = new Date();
    handleDateRangeChange(today, today);
  };

  const handleThisWeek = () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = add(weekStart, { days: 6 });
    handleDateRangeChange(weekStart, weekEnd);
  };

  const handleThisMonth = () => {
    const today = new Date();
    handleDateRangeChange(startOfMonth(today), endOfMonth(today));
  };

  const handleLastWeek = () => {
    const today = new Date();
    const lastWeekStart = sub(startOfWeek(today, { weekStartsOn: 1 }), { weeks: 1 });
    const lastWeekEnd = add(lastWeekStart, { days: 6 });
    handleDateRangeChange(lastWeekStart, lastWeekEnd);
  };

  const handleLastMonth = () => {
    const today = new Date();
    const lastMonth = sub(today, { months: 1 });
    handleDateRangeChange(startOfMonth(lastMonth), endOfMonth(lastMonth));
  };

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => {
      const updated = {
        ...prev,
        [columnKey]: !prev[columnKey]
      };
      localStorage.setItem('visibleColumns', JSON.stringify(updated));
      return updated;
    });
  };


  const handleFilterClick = (filterType) => {
    setActiveFilter(activeFilter === filterType ? null : filterType);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setActiveFilter(null);
  };

  const getUniqueValues = (data, key) => {
    const values = new Set();
    data.forEach(item => {
      if (key === 'section') {
        values.add(item.Section?.name);
      } else if (key === 'outlet') {
        values.add(item.Outlet?.name);
      }
    });
    return Array.from(values).filter(Boolean).sort();
  };

  const FilterDropdown = ({ type, values }) => {
    const dropdownRef = useRef(null);

    return (
      <div ref={dropdownRef} className="fixed z-[100] mt-2 w-48 rounded-md shadow-lg filter-dropdown" style={{ top: 'auto' }}>
        <div className={`rounded-md ring-1 ring-black ring-opacity-5 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="py-1">
            <button
              onClick={() => handleFilterChange(type, '')}
              className={`block w-full px-4 py-2 text-sm text-left ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              All
            </button>
            {values.map((value) => (
              <button
                key={value}
                onClick={() => handleFilterChange(type, value)}
                className={`block w-full px-4 py-2 text-sm text-left ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Handle manual time entry submission
  const handleManualTimeEntrySubmit = async (formData) => {
    try {
      if (!selectedCompany?.id) return;

      // Submit the time record
      await createTimeRecord(selectedCompany.id, formData);

      // Close the modal
      setIsManualEntryModalOpen(false);

      // Refresh time records
      fetchTimeRecords();
    } catch (error) {
      console.error('Error creating manual time record:', error);
      alert('Failed to create time record. Please try again.');
    }
  };

  // Render employee row with time records
  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const employeeNumber = employee.employeeNumber?.toString().toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || fullName.includes(searchLower) || employeeNumber.includes(searchLower);
  });

  const renderEmployeeRow = (employee) => {
    const employeeTotals = calculateEmployeeTotals(employee.id);

    return (
      <React.Fragment key={employee.id}>
        {/* Employee time records row */}
        <tr className={`${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} transition-colors duration-150`}>
          {visibleColumns.name && <td className="px-4 py-2 whitespace-nowrap text-sm">{`${employee.firstName} ${employee.lastName}`}</td>}
          {visibleColumns.section && <td className="px-4 py-2 whitespace-nowrap text-sm">{employee.Section?.name}</td>}
          {visibleColumns.outlet && <td className="px-4 py-2 whitespace-nowrap text-sm">{employee.Outlet?.name}</td>}
          {visibleColumns.mobile && <td className="px-4 py-2 whitespace-nowrap text-sm">{employee.mobile}</td>}
          {visibleColumns.payroll && <td className="px-4 py-2 whitespace-nowrap text-sm">{employee.payrollNumber}</td>}

          {weekDays.map(day => {
            const dateStr = format(day.fullDate, 'yyyy-MM-dd');
            const record = timeRecords[dateStr]?.[employee.id];

            return (
              <React.Fragment key={dateStr}>
                {visibleColumns.login && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-md ${getRibbonClass(dateStr, employee.id, 'clockIn')}`}>
                      {record ? formatTime(record.clockIn) : '-'}
                    </span>
                  </td>
                )}
                {visibleColumns.logout && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-md ${getRibbonClass(dateStr, employee.id, 'clockOut')}`}>
                      {record ? formatTime(record.clockOut) : '-'}
                    </span>
                  </td>
                )}
                {visibleColumns.breakStart && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-md ${getRibbonClass(dateStr, employee.id, 'breakStart')}`}>
                      {record ? formatTime(record.breakStart) : '-'}
                    </span>
                  </td>
                )}
                {visibleColumns.breakEnd && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-md ${getRibbonClass(dateStr, employee.id, 'breakEnd')}`}>
                      {record ? formatTime(record.breakEnd) : '-'}
                    </span>
                  </td>
                )}
                {visibleColumns.duration && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                    {record ? record.duration : ''}
                  </td>
                )}
                {visibleColumns.overtime && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                    {record ? record.overtime : ''}
                  </td>
                )}
                {visibleColumns.cost && (
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                    {record ? `€${calculateCost(record.duration)}` : '€0.00'}
                  </td>
                )}
              </React.Fragment>
            );
          })}
        </tr>

        {/* Employee totals row */}
        <tr className={`${darkMode ? 'bg-slate-700/30' : 'bg-slate-100'} font-medium`}>
          {/* Create cells for all possible columns, showing only those that are visible */}
          {visibleColumns.name && <td className="px-4 py-2 text-sm">Employee Total</td>}
          {visibleColumns.section && <td className="px-4 py-2 text-sm"></td>}
          {visibleColumns.outlet && <td className="px-4 py-2 text-sm"></td>}
          {visibleColumns.mobile && <td className="px-4 py-2 text-sm"></td>}
          {visibleColumns.payroll && <td className="px-4 py-2 text-sm"></td>}

          {/* Time columns before the totals */}
          {visibleColumns.login && <td className="px-4 py-2 text-sm"></td>}
          {visibleColumns.logout && <td className="px-4 py-2 text-sm"></td>}
          {visibleColumns.breakStart && <td className="px-4 py-2 text-sm"></td>}
          {visibleColumns.breakEnd && <td className="px-4 py-2 text-sm"></td>}

          {/* Total columns that need to be aligned */}
          {visibleColumns.duration && <td className="px-4 py-2 text-sm text-right">{employeeTotals.duration}</td>}
          {visibleColumns.overtime && <td className="px-4 py-2 text-sm text-right">{employeeTotals.overtime}</td>}
          {visibleColumns.cost && <td className="px-4 py-2 text-sm text-right">€{employeeTotals.cost}</td>}
        </tr>
      </React.Fragment>
    );
  };

  return (
    <div className={`w-full ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="mb-6">
        <div className={`flex flex-col gap-4 p-4 rounded-lg mb-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>

          {/* First Row */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            {/* Title and Outlet Dropdown */}
            <div className="flex items-center gap-4">
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Timesheet
              </h1>

              {/* Outlet Dropdown */}
              <div className="relative" data-dropdown="main-outlet">
                <button
                  onClick={() => setIsMainOutletDropdownOpen(!isMainOutletDropdownOpen)}
                  className={`w-64 p-2 pr-3 rounded-lg border flex justify-between items-center ${darkMode ? 'bg-slate-700 border-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className={selectedOutlet ? 'font-medium' : ''}>
                    {selectedOutlet ? selectedOutlet.name : 'Select Outlet'}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                </button>

                {isMainOutletDropdownOpen && (
                  <div className={`absolute z-50 mt-1 w-64 rounded-md shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
                    <div className="py-1">
                      {outlets.map(outlet => (
                        <button
                          key={outlet.id}
                          onClick={() => {
                            setSelectedOutlet(outlet);
                            if (selectedCompany?.id) {
                              localStorage.setItem(`selectedOutlet_${selectedCompany.id}`, outlet.id.toString());
                            }
                            setIsMainOutletDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm ${selectedOutlet?.id === outlet.id ? (darkMode ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900') : (darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100')}`}
                        >
                          {outlet.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Shortcuts and Datepicker */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex flex-wrap">
                <div className="inline-flex rounded-md">
                  <button
                    onClick={handleToday}
                    className={`h-[42px] px-3 py-2 text-sm font-medium rounded-l-lg border-y border-l ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={handleThisWeek}
                    className={`h-[42px] px-3 py-2 text-sm font-medium border-y border-l ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={handleLastWeek}
                    className={`h-[42px] px-3 py-2 text-sm font-medium border-y border-l ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    Last Week
                  </button>
                  <button
                    onClick={handleThisMonth}
                    className={`h-[42px] px-3 py-2 text-sm font-medium border-y border-l ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={handleLastMonth}
                    className={`h-[42px] px-3 py-2 text-sm font-medium rounded-r-lg border ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    Last Month
                  </button>
                </div>
              </div>

              {/* DatePicker */}
              <div className="flex items-center">
                <DatePicker
                  selectsRange
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={(dates) => handleDateRangeChange(dates[0], dates[1])}
                  dateFormat="dd/MM/yyyy"
                  className={`h-[42px] px-3 py-2 text-sm font-medium rounded-lg ${darkMode ? 'bg-slate-700 text-slate-200 border-slate-600' : 'bg-white text-slate-700 border-slate-200'} border`}
                />
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="flex flex-wrap items-center gap-2">

            {/* Search Bar (Always Open, Left Side) */}
            <div className="flex items-center w-96 relative">
              <MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or number"
                className={`w-full pl-10 pr-4 py-2 h-11 rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-700 text-slate-200 placeholder-slate-400 border-slate-700' : 'bg-white text-slate-800 placeholder-slate-400 border-slate-200'}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Add Time Button */}
              <button
                className={`px-4 py-2 h-11 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                title="Export Payroll"
              >
                <ArrowUpTrayIcon className="h-4 w-4 text-emerald-500" />
              </button>
              {/* Add Time Button */}
              <button
                onClick={() => setIsManualEntryModalOpen(true)}
                className={`px-4 py-2 h-11 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`}
                title="Add Employee time"
              >
                <PlusIcon className="h-4 w-4 text-emerald-500" />
              </button>

              {/* Column Visibility Dropdown */}
              <div className="relative">
                <Menu as="div" className="relative inline-block text-left">
                  <Menu.Button className={`px-4 py-2 h-11 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'}`} title="Show/Hide Columns">
                    <EyeIcon className="h-4 w-4 text-emerald-500" />
                  </Menu.Button>
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg shadow-lg dark:bg-slate-800 bg-white border dark:border-slate-700/50 border-slate-200 focus:outline-none z-10">
                    <div className="p-2 space-y-1">
                      <div className="flex items-center px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={Object.values(visibleColumns).every(v => v)}
                          onChange={() => {
                            const allChecked = Object.values(visibleColumns).every(v => v);
                            const newValue = !allChecked;
                            const updatedColumns = {};
                            Object.keys(visibleColumns).forEach(key => {
                              if (key === 'name') {
                                updatedColumns[key] = true;
                              } else {
                                updatedColumns[key] = newValue;
                              }
                            });
                            setVisibleColumns(updatedColumns);
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                        />
                        <label
                          htmlFor="select-all"
                          className="ml-2 text-sm dark:text-slate-300 text-slate-700 font-medium"
                        >
                          Select All
                        </label>
                      </div>
                      <div className="border-t dark:border-slate-700/50 border-slate-200 my-1"></div>

                      {/* Employee Columns Section */}
                      {Object.entries(visibleColumns)
                        .filter(([key]) => ['name', 'section', 'outlet', 'mobile', 'payroll'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                            <input
                              type="checkbox"
                              id={`column-${key}`}
                              checked={value}
                              onChange={() => toggleColumnVisibility(key)}
                              disabled={key === 'name'}
                              className={`h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 ${(key === 'name') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            <label
                              htmlFor={`column-${key}`}
                              className={`ml-2 text-sm dark:text-slate-300 text-slate-700 capitalize ${(key === 'name') ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {key === 'number' ? 'Employee Number' : key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                          </div>
                        ))}

                      {/* TimeRecord Columns Section */}
                      {Object.entries(visibleColumns)
                        .filter(([key]) => ['login', 'logout', 'breakStart', 'breakEnd', 'duration', 'overtime', 'cost'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                            <input
                              type="checkbox"
                              id={`column-${key}`}
                              checked={value}
                              onChange={() => toggleColumnVisibility(key)}
                              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                            />
                            <label
                              htmlFor={`column-${key}`}
                              className="ml-2 text-sm dark:text-slate-300 text-slate-700 capitalize"
                            >
                              {key === 'login' ? 'Clock In' :
                                key === 'logout' ? 'Clock Out' :
                                  key === 'breakStart' ? 'Break Start' :
                                    key === 'breakEnd' ? 'Break End' :
                                      key === 'duration' ? 'Worked' :
                                        key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                          </div>
                        ))}
                    </div>
                  </Menu.Items>
                </Menu>
              </div>

              <button
                onClick={() => setShowTotalsOnly(!showTotalsOnly)}
                className={`px-4 py-2 h-11 rounded-lg ${showTotalsOnly ?
                  (darkMode ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-white') :
                  (darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200')}`}
                title="View Totals only"
              >
                <QueueListIcon className={`h-4 w-4 ${showTotalsOnly ? 'text-white' : 'text-emerald-500'}`} />
              </button>

              {/* View Toggle */}
              <div className={`flex items-center gap-2 px-3 py-2 h-11 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${viewMode === 'daily' ? 'font-medium' : 'text-slate-500'}`}>Daily Totals</span>
                  <Switch
                    checked={viewMode === 'employee'}
                    onChange={() => setViewMode(viewMode === 'daily' ? 'employee' : 'daily')}
                    className={`${viewMode === 'employee' ? 'bg-emerald-500' : 'bg-emerald-500'}
                  relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${viewMode === 'employee' ? 'translate-x-5' : 'translate-x-0'}
                    pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                  <span className={`text-sm ${viewMode === 'employee' ? 'font-medium' : 'text-slate-500'}`}>Employee Totals</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Timesheet Table */}
      <div className={`overflow-x-auto rounded-lg border ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <table className={`min-w-full divide-y ${darkMode ? 'divide-slate-700/50' : 'divide-slate-200'}`}>
          <thead className={`${darkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>

            <tr>
              <th className="px-4 py-2 text-left">Date</th>

              {/* Employee Columns */}

              {visibleColumns.name && (
                <th className="px-4 py-2 text-left">Name</th>
              )}
              {visibleColumns.section && (
                <th className="px-4 py-2 text-left relative">
                  <button
                    onClick={() => handleFilterClick('section')}
                    className={`hover:text-slate-400 dark:hover:text-slate-400 ${filters.section ? 'text-slate-700 dark:text-slate-300' : ''} flex items-center justify-center space-x-1`}
                  >
                    <span>Section</span>
                    <FunnelIcon className="h-4 w-4" />
                    {filters.section ? ` (${filters.section})` : ''}
                  </button>
                  {activeFilter === 'section' && (
                    <FilterDropdown type="section" values={getUniqueValues(employees, 'section')} />
                  )}
                </th>
              )}
              {visibleColumns.outlet && (
                <th className="px-4 py-2 text-left relative">
                  <button
                    onClick={() => handleFilterClick('outlet')}
                    className={`hover:text-slate-400 dark:hover:text-slate-400 ${filters.outlet ? 'text-slate-700 dark:text-slate-300' : ''} flex items-center justify-center space-x-1`}
                  >
                    <span>Outlet</span>
                    <FunnelIcon className="h-4 w-4" />
                    {filters.outlet ? ` (${filters.outlet})` : ''}
                  </button>
                  {activeFilter === 'outlet' && (
                    <FilterDropdown type="outlet" values={getUniqueValues(employees, 'outlet')} />
                  )}
                </th>
              )}
              {visibleColumns.mobile && (
                <th className="px-4 py-2 text-left">Mobile</th>
              )}
              {visibleColumns.payroll && (
                <th className="px-4 py-2 text-left">Payroll</th>
              )}

              {/* TimeRecord Columns */}
              {visibleColumns.login && (
                <th className="px-4 py-2 text-left">Clock In</th>
              )}
              {visibleColumns.breakStart && (
                <th className="px-4 py-2 text-left">Break Start</th>
              )}
              {visibleColumns.breakEnd && (
                <th className="px-4 py-2 text-left">Break End</th>
              )}
              {visibleColumns.logout && (
                <th className="px-4 py-2 text-left">Clock Out</th>
              )}
                            {visibleColumns.duration && (
                <th className="px-4 py-2 text-right">Worked</th>
              )}
              {visibleColumns.overtime && (
                <th className="px-4 py-2 text-right">Overtime</th>
              )}
              {visibleColumns.cost && (
                <th className="px-4 py-2 text-right">Cost</th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'bg-slate-800/50 divide-slate-700/50' : 'bg-white/80 divide-slate-200'}`}>
            {viewMode === 'daily' ? (
              // Daily View - Group by date
              weekDays.map((day, index) => {
                const dateStr = format(day.fullDate, 'yyyy-MM-dd');
                const dayRecords = timeRecords[dateStr] || {};
                const employeesWithRecords = Object.keys(dayRecords).map(id => parseInt(id));

                // Filter employees based on selected filters and search term
                const filteredEmployees = getFilteredEmployees().filter(emp => employeesWithRecords.includes(emp.id));

                if (filteredEmployees.length === 0) {
                  return null; // Don't render this row for this date

                  return (
                    <tr key={index} className={`${darkMode ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
                      <td className="px-4 py-3 font-medium">
                        <div className="flex flex-col">
                          <span>{day.name}</span>
                          <span className="text-sm text-slate-500">{day.date}</span>
                        </div>
                      </td>

                      {/* Create cells for all possible columns, showing only those that are visible */}
                      {visibleColumns.name && (
                        <td className="px-4 py-3">
                          <div className="flex justify-center items-center h-10 text-slate-500">
                            {selectedOutlet ? 'No time records available' : 'Please select an outlet'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.section && <td className="px-4 py-3"></td>}
                      {visibleColumns.outlet && <td className="px-4 py-3"></td>}
                      {visibleColumns.mobile && <td className="px-4 py-3"></td>}
                      {visibleColumns.payroll && <td className="px-4 py-3"></td>}

                      {/* Time columns */}
                      {visibleColumns.login && <td className="px-4 py-3"></td>}
                      {visibleColumns.logout && <td className="px-4 py-3"></td>}
                      {visibleColumns.breakStart && <td className="px-4 py-3"></td>}
                      {visibleColumns.breakEnd && <td className="px-4 py-3"></td>}
                      {visibleColumns.duration && <td className="px-4 py-3"></td>}
                      {visibleColumns.overtime && <td className="px-4 py-3"></td>}
                      {visibleColumns.cost && <td className="px-4 py-3"></td>}
                    </tr>
                  );
                }

                return (
                  <React.Fragment key={index}>
                    <tr className={`${darkMode ? 'bg-emerald-800/20 border-t border-slate-700' : 'bg-emerald-200/20 border-t border-slate-200'}`}>
                      {/* Create a cell for the date column */}
                      <td className="px-4 py-3 font-medium">
                        <span className="font-semibold">{day.name}</span>
                        <span className="ml-2 text-sm text-slate-500">{day.date}</span>
                      </td>

                      {/* Create cells for all possible columns, showing only those that are visible */}
                      {visibleColumns.name && <td className="px-4 py-3"></td>}
                      {visibleColumns.section && <td className="px-4 py-3"></td>}
                      {visibleColumns.outlet && <td className="px-4 py-3"></td>}
                      {visibleColumns.mobile && <td className="px-4 py-3"></td>}
                      {visibleColumns.payroll && <td className="px-4 py-3"></td>}

                      {/* Time columns before the totals */}
                      {visibleColumns.login && <td className="px-4 py-3"></td>}
                      {visibleColumns.logout && <td className="px-4 py-3"></td>}
                      {visibleColumns.breakStart && <td className="px-4 py-3"></td>}
                      {visibleColumns.breakEnd && <td className="px-4 py-3"></td>}

                      {/* Total columns with values */}
                      {visibleColumns.duration && (
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-medium text-emerald-500"><span className="font-medium text-medium text-emerald-500">{calculateDateTotals(dateStr).duration}</span> hrs</span>
                        </td>
                      )}
                      {visibleColumns.overtime && (
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-medium text-emerald-500"><span className="font-medium text-medium text-emerald-500">{calculateDateTotals(dateStr).overtime}</span> hrs</span>
                        </td>
                      )}
                      {visibleColumns.cost && (
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-medium text-emerald-500"><span className="font-medium text-medium text-emerald-500">€{calculateDateTotals(dateStr).cost}</span></span>
                        </td>
                      )}
                    </tr>

                    {!showTotalsOnly && filteredEmployees.map(employee => {
                      const record = dayRecords[employee.id];
                      if (!record) return null;

                      return (
                        <tr key={`${index}-${employee.id}`} className={`${darkMode ? 'border-t border-slate-700/50 hover:bg-slate-700/30' : 'border-t border-slate-200/50 hover:bg-slate-100/50'}`}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500">{format(day.fullDate, 'dd/MM/yyyy')}</span>
                            </div>
                          </td>

                          {/* Employee columns */}

                          {visibleColumns.name && (
                            <td className="px-4 py-3 text-sm font-medium">{`${employee.firstName} ${employee.lastName} - ${employee.employeeNumber || ''}`}</td>
                          )}
                          {visibleColumns.section && (
                            <td className="px-4 py-3 text-sm">{employee.Section?.name || '-'}</td>
                          )}
                          {visibleColumns.outlet && (
                            <td className="px-4 py-3 text-sm">{employee.Outlet?.name || '-'}</td>
                          )}
                          {visibleColumns.mobile && (
                            <td className="px-4 py-3 text-sm">{employee.mobile || '-'}</td>
                          )}
                          {visibleColumns.payroll && (
                            <td className="px-4 py-3 text-sm">{employee.payrollNumber || '-'}</td>
                          )}

                          {/* Time record columns - editable */}
                          {visibleColumns.login && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                editingCell?.field === 'clockIn' ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    className={`w-24 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                    value={formatTime(record.clockIn)}
                                    onChange={(e) => handleTimeChange(e, dateStr, employee.id, 'clockIn')}
                                    onBlur={handleEditEnd}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditEnd();
                                    }}
                                    autoFocus
                                  />
                                  <TrashIcon
                                    className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                                    onClick={() => handleDeleteTimeField(dateStr, employee.id, 'clockIn')}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer flex items-center hover:text-blue-500 space-x-2"
                                  onClick={() => handleEditStart(dateStr, employee.id, 'clockIn')}
                                >
                                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(dateStr, employee.id, 'clockOut')}`}>
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{formatTime(record.clockIn)}</span>
                                  </div>
                                  {record.img1 && (
                                    <UserCircleIcon
                                      className="h-5 w-5 text-emerald-500 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openImagePreview(record.img1);
                                      }}
                                    />
                                  )}
                                  {record.clockInNote && (
                                      <PencilSquareIcon 
                                        className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                        title={record.clockInNote}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewNoteText(record.clockInNote);
                                          setIsNoteViewOpen(true);
                                        }}
                                        
                                      />
                                    )}
                                </div>
                              )}
                            </td>
                          )}
                          
                          {visibleColumns.breakStart && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                (editingCell?.field === 'breakStart' || editingCell?.field.startsWith('breakStart-')) ? (
                                <input
                                  type="time"
                                  className={`w-24 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                  value={editingCell?.field === 'breakStart' 
                                    ? formatTime(record.breakStart) 
                                    : (editingCell?.field.startsWith('breakStart-') && record.breaks) 
                                      ? formatTime(record.breaks[parseInt(editingCell.field.split('-')[1])].start)
                                      : ''}
                                  onChange={(e) => handleTimeChange(e, dateStr, employee.id, editingCell.field)}
                                  onBlur={handleEditEnd}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditEnd(); // Trigger save on Enter key press
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  {/* Display first break from the legacy single field if it exists */}
                                  {record.breakStart && (
                                    <div
                                      className="cursor-pointer flex items-center hover:text-blue-500"
                                      onClick={() => handleEditStart(dateStr, employee.id, 'breakStart')}
                                    >
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(dateStr, employee.id, 'breakEnd')}`}>
                                        <ClockIcon className="h-4 w-4" />
                                        <span>{formatTime(record.breakStart)}</span>
                                        {record.breakStartNote && (
                                          <PencilSquareIcon 
                                            className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                            title={record.breakStartNote}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewNoteText(record.breakStartNote);
                                              setIsNoteViewOpen(true);
                                            }}
                                          />
                                        )}
                                      </div>
                                      {/* Display img if exists */}
                                      {record[`img${3 + (index * 2)}`] && (
                                        <UserCircleIcon
                                          className="h-5 w-5 text-emerald-500 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openImagePreview(record[`img${3 + (index * 2)}`]);
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Display breaks from the array if it exists */}
                                  {record.breaks && record.breaks.length > 0 && record.breaks.map((breakItem, index) => (
                                    // Check if we should skip the first break when a legacy breakStart exists
                                    (index === 0 && record.breakStart) ? null : (
                                      <div
                                        key={`break-start-${index}`}
                                        className="cursor-pointer flex items-center hover:text-blue-500"
                                        onClick={() => handleEditStart(dateStr, employee.id, `breakStart-${index}`)}
                                      >
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full`}>
                                          <ClockIcon className="h-4 w-4" />
                                          <span>{breakItem.start ? formatTime(breakItem.start) : '-'}</span>
                                        </div>
                                        {/* Display img if exists */}
                                        {record[`img${3 + (index * 2)}`] && (
                                          <UserCircleIcon
                                            className="h-5 w-5 text-emerald-500 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openImagePreview(record[`img${3 + (index * 2)}`]);
                                            }}
                                          />
                                        )}
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}
                            </td>
                          )}

                          {visibleColumns.breakEnd && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                (editingCell?.field === 'breakEnd' || editingCell?.field.startsWith('breakEnd-')) ? (
                                <input
                                  type="time"
                                  className={`w-24 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                  value={editingCell?.field === 'breakEnd' 
                                    ? formatTime(record.breakEnd) 
                                    : (editingCell?.field.startsWith('breakEnd-') && record.breaks) 
                                      ? formatTime(record.breaks[parseInt(editingCell.field.split('-')[1])].end)
                                      : ''}
                                  onChange={(e) => handleTimeChange(e, dateStr, employee.id, editingCell.field)}
                                  onBlur={handleEditEnd}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditEnd(); // Trigger save on Enter key press
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  {/* Display first break from the legacy single field if it exists */}
                                  {record.breakEnd && (
                                    <div
                                      className="cursor-pointer flex items-center hover:text-blue-500"
                                      onClick={() => handleEditStart(dateStr, employee.id, 'breakEnd')}
                                    >
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(dateStr, employee.id, 'breakEnd')}`}>
                                        <ClockIcon className="h-4 w-4" />
                                        <span>{formatTime(record.breakEnd)}</span>
                                        {record.breakEndNote && (
                                          <PencilSquareIcon 
                                            className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                            title={record.breakEndNote}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewNoteText(record.breakEndNote);
                                              setIsNoteViewOpen(true);
                                            }}
                                          />
                                        )}
                                      </div>
                                      {/* Display img if exists */}
                                      {record[`img${4 + (index * 2)}`] && (
                                        <UserCircleIcon
                                          className="h-5 w-5 text-emerald-500 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openImagePreview(record[`img${4 + (index * 2)}`]);
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Display breaks from the array if it exists */}
                                  {record.breaks && record.breaks.length > 0 && record.breaks.map((breakItem, index) => (
                                    // Skip if we already have a legacy breakEnd field
                                    (index === 0 && record.breakEnd) ? null : (
                                      <div
                                        key={`break-end-${index}`}
                                        className="cursor-pointer flex items-center hover:text-blue-500"
                                        onClick={() => handleEditStart(dateStr, employee.id, `breakEnd-${index}`)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleEditEnd(); // Trigger save on Enter key press
                                          }
                                        }}
                                      >
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full`}>
                                          <ClockIcon className="h-4 w-4" />
                                          <span>{breakItem.end ? formatTime(breakItem.end) : '-'}</span>
                                        </div>
                                        {/* Display img if exists */}
                                        {record[`img${4 + (index * 2)}`] && (
                                          <UserCircleIcon
                                            className="h-5 w-5 text-emerald-500 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openImagePreview(record[`img${4 + (index * 2)}`]);
                                            }}
                                          />
                                        )}
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}
                            </td>
                          )}

{visibleColumns.logout && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                editingCell?.field === 'clockOut' ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    className={`w-24 px-2 py-1 rounded border ${darkMode
                                        ? 'bg-slate-700 border-slate-600 text-slate-200'
                                        : 'bg-white border-slate-300 text-slate-700'
                                      }`}
                                    value={record.clockOut ? formatTime(record.clockOut) : ''}
                                    onChange={(e) => handleTimeChange(e, dateStr, employee.id, 'clockOut')}
                                    onBlur={handleEditEnd}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditEnd(); // Trigger save on Enter key press
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <TrashIcon
                                    className="h-5 w-5 text-red-500 cursor-pointer"
                                    onClick={() => handleClearField(dateStr, employee.id, 'clockOut')}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer flex items-center hover:text-blue-500"
                                  onClick={() => handleEditStart(dateStr, employee.id, 'clockOut')}
                                >
                                  <div
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(
                                      dateStr,
                                      employee.id,
                                      'clockOut'
                                    )}`}
                                  >
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{formatTime(record.clockOut)}</span>
                                    {record.clockOutNote && (
                                      <PencilSquareIcon 
                                        className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                        title={record.clockOutNote}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewNoteText(record.clockOutNote);
                                          setIsNoteViewOpen(true);
                                        }}
                                      />
                                    )}
                                  </div>
                                  {record.img2 && (
                                    <UserCircleIcon
                                      className="h-5 w-5 text-emerald-500 hover:text-blue-500 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the clock-out edit
                                        openImagePreview(record.img2);
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </td>
                          )}


                          {visibleColumns.duration && (
                            <td className="px-4 py-3 text-sm text-right">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                editingCell?.field === 'duration' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="24"
                                  className={`w-20 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                  value={record.duration}
                                  onChange={(e) => handleDurationChange(e, dateStr, employee.id)}
                                  onBlur={handleEditEnd}
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="cursor-pointer hover:text-blue-500"
                                  onClick={() => handleEditStart(dateStr, employee.id, 'duration')}
                                >
                                  {record.duration} hrs
                                </div>
                              )}
                            </td>
                          )}
                          {visibleColumns.overtime && (
                            <td className="px-4 py-3 text-sm text-right">
                              {record.overtime > 0 ? (
                                <span className="text-amber-500 dark:text-amber-400">{record.overtime} hrs</span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.cost && (
                            <td className="px-4 py-3 text-sm text-right">
                              €{calculateCost(record.duration || 0, employee.id)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            ) : (
              // Employee View - Group by employee
              getFilteredEmployees().map(employee => {
                // Check if employee has any time records in the selected date range
                const hasRecords = weekDays.some(day => {
                  const dateStr = format(day.fullDate, 'yyyy-MM-dd');
                  const record = timeRecords[dateStr]?.[employee.id];
                  if (!record) return false;
                  return true;
                });

                if (!hasRecords) return null;

                return (
                  <React.Fragment key={employee.id}>
                    {/* Employee header row with totals */}
                    <tr className={`${darkMode ? 'bg-emerald-800/20 border-t border-slate-700' : 'bg-emerald-200/20 border-t border-slate-200'}`}>
                      <td className="px-4 py-3 font-medium">
                        <span className="font-semibold">{`${employee.firstName} ${employee.lastName}`}</span>
                      </td>

                      {/* Empty cells for other columns */}
                      {visibleColumns.name && <td className="px-4 py-3"></td>}
                      {visibleColumns.section && <td className="px-4 py-3"></td>}
                      {visibleColumns.outlet && <td className="px-4 py-3"></td>}
                      {visibleColumns.mobile && <td className="px-4 py-3"></td>}
                      {visibleColumns.payroll && <td className="px-4 py-3"></td>}
                      {visibleColumns.login && <td className="px-4 py-3"></td>}
                      {visibleColumns.logout && <td className="px-4 py-3"></td>}
                      {visibleColumns.breakStart && <td className="px-4 py-3"></td>}
                      {visibleColumns.breakEnd && <td className="px-4 py-3"></td>}

                      {/* Totals */}
                      {visibleColumns.duration && (
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-emerald-500">{calculateEmployeeTotals(employee.id).duration} hrs</span>
                        </td>
                      )}
                      {visibleColumns.overtime && (
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-emerald-500">{calculateEmployeeTotals(employee.id).overtime} hrs</span>
                        </td>
                      )}
                      {visibleColumns.cost && (
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-emerald-500">€{calculateEmployeeTotals(employee.id).cost}</span>
                        </td>
                      )}
                    </tr>

                    {/* Days for this employee */}
                    {!showTotalsOnly && weekDays.map((day, index) => {
                      const dateStr = format(day.fullDate, 'yyyy-MM-dd');
                      const record = timeRecords[dateStr]?.[employee.id];

                      if (!record) return null;

                      return (
                        <tr key={`${employee.id}-${index}`} className={`${darkMode ? 'border-t border-slate-700/50 hover:bg-slate-700/30' : 'border-t border-slate-200/50 hover:bg-slate-100/50'}`}>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span>{day.name}</span>
                              <span className="text-xs text-slate-500">{day.date}</span>
                            </div>
                          </td>

                          {/* Name column */}
                          {visibleColumns.name && (
                            <td className="px-4 py-3 text-sm font-medium">{`${employee.firstName} ${employee.lastName} - ${employee.employeeNumber || ''}`}</td>
                          )}

                          {/* Section column */}
                          {visibleColumns.section && (
                            <td className="px-4 py-3 text-sm">
                              {employee.Section?.name || '-'}
                            </td>
                          )}

                          {/* Outlet column */}
                          {visibleColumns.outlet && (
                            <td className="px-4 py-3 text-sm">
                              {employee.Outlet?.name || '-'}
                            </td>
                          )}

                          {/* Mobile column */}
                          {visibleColumns.mobile && (
                            <td className="px-4 py-3 text-sm">
                              {employee.mobile || '-'}
                            </td>
                          )}

                          {/* Payroll column */}
                          {visibleColumns.payroll && (
                            <td className="px-4 py-3 text-sm">
                              {employee.payrollNumber || '-'}
                            </td>
                          )}

                          {/* Time record columns - editable */}
                          {visibleColumns.login && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                editingCell?.field === 'clockIn' ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    className={`w-24 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                    value={formatTime(record.clockIn)}
                                    onChange={(e) => handleTimeChange(e, dateStr, employee.id, 'clockIn')}
                                    onBlur={handleEditEnd}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleEditEnd();
                                    }}
                                    autoFocus
                                  />
                                  <TrashIcon
                                    className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                                    onClick={() => handleDeleteTimeField(dateStr, employee.id, 'clockIn')}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer flex items-center hover:text-blue-500 space-x-2"
                                  onClick={() => handleEditStart(dateStr, employee.id, 'clockIn')}
                                >
                                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(dateStr, employee.id, 'clockOut')}`}>
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{formatTime(record.clockIn)}</span>
                                  </div>
                                  {record.img1 && (
                                    <UserCircleIcon
                                      className="h-5 w-5 text-emerald-500 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openImagePreview(record.img1);
                                      }}
                                    />
                                  )}
                                  {record.clockInNote && (
                                      <PencilSquareIcon 
                                        className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                        title={record.clockInNote}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewNoteText(record.clockInNote);
                                          setIsNoteViewOpen(true);
                                        }}
                                        
                                      />
                                    )}
                                </div>
                              )}
                            </td>
                          )}
                          
                          {visibleColumns.breakStart && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                (editingCell?.field === 'breakStart' || editingCell?.field.startsWith('breakStart-')) ? (
                                <input
                                  type="time"
                                  className={`w-24 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                  value={editingCell?.field === 'breakStart' 
                                    ? formatTime(record.breakStart) 
                                    : (editingCell?.field.startsWith('breakStart-') && record.breaks) 
                                      ? formatTime(record.breaks[parseInt(editingCell.field.split('-')[1])].start)
                                      : ''}
                                  onChange={(e) => handleTimeChange(e, dateStr, employee.id, editingCell.field)}
                                  onBlur={handleEditEnd}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditEnd(); // Trigger save on Enter key press
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  {/* Display first break from the legacy single field if it exists */}
                                  {record.breakStart && (
                                    <div
                                      className="cursor-pointer flex items-center hover:text-blue-500"
                                      onClick={() => handleEditStart(dateStr, employee.id, 'breakStart')}
                                    >
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(dateStr, employee.id, 'breakEnd')}`}>
                                        <ClockIcon className="h-4 w-4" />
                                        <span>{formatTime(record.breakStart)}</span>
                                        {record.breakStartNote && (
                                          <PencilSquareIcon 
                                            className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                            title={record.breakStartNote}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewNoteText(record.breakStartNote);
                                              setIsNoteViewOpen(true);
                                            }}
                                          />
                                        )}
                                      </div>
                                      {/* Display img if exists */}
                                      {record[`img${3 + (index * 2)}`] && (
                                        <UserCircleIcon
                                          className="h-5 w-5 text-emerald-500 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openImagePreview(record[`img${3 + (index * 2)}`]);
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Display breaks from the array if it exists */}
                                  {record.breaks && record.breaks.length > 0 && record.breaks.map((breakItem, index) => (
                                    // Check if we should skip the first break when a legacy breakStart exists
                                    (index === 0 && record.breakStart) ? null : (
                                      <div
                                        key={`break-start-${index}`}
                                        className="cursor-pointer flex items-center hover:text-blue-500"
                                        onClick={() => handleEditStart(dateStr, employee.id, `breakStart-${index}`)}
                                      >
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full`}>
                                          <ClockIcon className="h-4 w-4" />
                                          <span>{breakItem.start ? formatTime(breakItem.start) : '-'}</span>
                                        </div>
                                        {/* Display img if exists */}
                                        {record[`img${3 + (index * 2)}`] && (
                                          <UserCircleIcon
                                            className="h-5 w-5 text-emerald-500 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openImagePreview(record[`img${3 + (index * 2)}`]);
                                            }}
                                          />
                                        )}
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}
                            </td>
                          )}

                          {visibleColumns.breakEnd && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                (editingCell?.field === 'breakEnd' || editingCell?.field.startsWith('breakEnd-')) ? (
                                <input
                                  type="time"
                                  className={`w-24 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                  value={editingCell?.field === 'breakEnd' 
                                    ? formatTime(record.breakEnd) 
                                    : (editingCell?.field.startsWith('breakEnd-') && record.breaks) 
                                      ? formatTime(record.breaks[parseInt(editingCell.field.split('-')[1])].end)
                                      : ''}
                                  onChange={(e) => handleTimeChange(e, dateStr, employee.id, editingCell.field)}
                                  onBlur={handleEditEnd}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditEnd(); // Trigger save on Enter key press
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex flex-col space-y-1">
                                  {/* Display first break from the legacy single field if it exists */}
                                  {record.breakEnd && (
                                    <div
                                      className="cursor-pointer flex items-center hover:text-blue-500"
                                      onClick={() => handleEditStart(dateStr, employee.id, 'breakEnd')}
                                    >
                                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(dateStr, employee.id, 'breakEnd')}`}>
                                        <ClockIcon className="h-4 w-4" />
                                        <span>{formatTime(record.breakEnd)}</span>
                                        {record.breakEndNote && (
                                          <PencilSquareIcon 
                                            className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                            title={record.breakEndNote}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setViewNoteText(record.breakEndNote);
                                              setIsNoteViewOpen(true);
                                            }}
                                          />
                                        )}
                                      </div>
                                      {/* Display img if exists */}
                                      {record[`img${4 + (index * 2)}`] && (
                                        <UserCircleIcon
                                          className="h-5 w-5 text-emerald-500 cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openImagePreview(record[`img${4 + (index * 2)}`]);
                                          }}
                                        />
                                      )}
                                    </div>
                                  )}

                                  {/* Display breaks from the array if it exists */}
                                  {record.breaks && record.breaks.length > 0 && record.breaks.map((breakItem, index) => (
                                    // Skip if we already have a legacy breakEnd field
                                    (index === 0 && record.breakEnd) ? null : (
                                      <div
                                        key={`break-end-${index}`}
                                        className="cursor-pointer flex items-center hover:text-blue-500"
                                        onClick={() => handleEditStart(dateStr, employee.id, `breakEnd-${index}`)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            handleEditEnd(); // Trigger save on Enter key press
                                          }
                                        }}
                                      >
                                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full`}>
                                          <ClockIcon className="h-4 w-4" />
                                          <span>{breakItem.end ? formatTime(breakItem.end) : '-'}</span>
                                        </div>
                                        {/* Display img if exists */}
                                        {record[`img${4 + (index * 2)}`] && (
                                          <UserCircleIcon
                                            className="h-5 w-5 text-emerald-500 cursor-pointer"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openImagePreview(record[`img${4 + (index * 2)}`]);
                                            }}
                                          />
                                        )}
                                      </div>
                                    )
                                  ))}
                                </div>
                              )}
                            </td>
                          )}

{visibleColumns.logout && (
                            <td className="px-4 py-3 text-sm">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                editingCell?.field === 'clockOut' ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="time"
                                    className={`w-24 px-2 py-1 rounded border ${darkMode
                                        ? 'bg-slate-700 border-slate-600 text-slate-200'
                                        : 'bg-white border-slate-300 text-slate-700'
                                      }`}
                                    value={record.clockOut ? formatTime(record.clockOut) : ''}
                                    onChange={(e) => handleTimeChange(e, dateStr, employee.id, 'clockOut')}
                                    onBlur={handleEditEnd}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditEnd(); // Trigger save on Enter key press
                                      }
                                    }}
                                    autoFocus
                                  />
                                  <TrashIcon
                                    className="h-5 w-5 text-red-500 cursor-pointer"
                                    onClick={() => handleClearField(dateStr, employee.id, 'clockOut')}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="cursor-pointer flex items-center hover:text-blue-500"
                                  onClick={() => handleEditStart(dateStr, employee.id, 'clockOut')}
                                >
                                  <div
                                    className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getRibbonClass(
                                      dateStr,
                                      employee.id,
                                      'clockOut'
                                    )}`}
                                  >
                                    <ClockIcon className="h-4 w-4" />
                                    <span>{formatTime(record.clockOut)}</span>
                                    {record.clockOutNote && (
                                      <PencilSquareIcon 
                                        className="h-5 w-5 text-amber-500 ml-1 cursor-pointer" 
                                        title={record.clockOutNote}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setViewNoteText(record.clockOutNote);
                                          setIsNoteViewOpen(true);
                                        }}
                                      />
                                    )}
                                  </div>
                                  {record.img2 && (
                                    <UserCircleIcon
                                      className="h-5 w-5 text-emerald-500 hover:text-blue-500 cursor-pointer"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent triggering the clock-out edit
                                        openImagePreview(record.img2);
                                      }}
                                    />
                                  )}
                                </div>
                              )}
                            </td>
                          )}

                          {visibleColumns.duration && (
                            <td className="px-4 py-3 text-sm text-right">
                              {editingCell?.dateStr === dateStr &&
                                editingCell?.employeeId === employee.id &&
                                editingCell?.field === 'duration' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max="24"
                                  className={`w-20 px-2 py-1 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                                  value={record.duration}
                                  onChange={(e) => handleDurationChange(e, dateStr, employee.id)}
                                  onBlur={handleEditEnd}
                                  autoFocus
                                />
                              ) : (
                                <div
                                  className="cursor-pointer hover:text-blue-500"
                                  onClick={() => handleEditStart(dateStr, employee.id, 'duration')}
                                >
                                  {record.duration} hrs
                                </div>
                              )}
                            </td>
                          )}
                          {visibleColumns.overtime && (
                            <td className="px-4 py-3 text-sm text-right">
                              {record.overtime > 0 ? (
                                <span className="text-amber-500 dark:text-amber-400">{record.overtime} hrs</span>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.cost && (
                            <td className="px-4 py-3 text-sm text-right">
                              €{calculateCost(record.duration || 0, employee.id)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {previewImageUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          onClick={closeImagePreview}
        >
          <div className="relative">
            <img
              src={previewImageUrl}
              alt="Preview"
              style={{
                maxWidth: '90vw', // Maximum width to prevent it from being too large
                maxHeight: '90vh', // Maximum height to ensure the image does not scroll
                objectFit: 'contain', // Keeps the aspect ratio of the image
              }}
              className="rounded-lg" // Apply rounded edges to the image
            />
            <button
              onClick={closeImagePreview}
              className="absolute top-2 right-2 p-2 rounded-full bg-slate-700 bg-opacity-30 hover:bg-opacity-50"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Time Entry Modal */}
      <ManualTimeEntryModal
        isOpen={isManualEntryModalOpen}
        onClose={() => setIsManualEntryModalOpen(false)}
        onSubmit={handleManualTimeEntrySubmit}
        darkMode={darkMode}
        employees={employees}
        sections={sections}
        selectedDate={dateRange.startDate === dateRange.endDate ? dateRange.startDate : null}
        isDateRange={dateRange.startDate !== dateRange.endDate}
        selectedOutlet={selectedOutlet}
      />

      {/* Time Edit Note Modal */}
      <TimeEditNoteModal
        isOpen={isNoteModalOpen}
        onClose={closeNoteModal}
        onSave={saveTimeEditNote}
        originalTime={noteModalData.originalTime}
        fieldName={noteModalData.field}
        darkMode={darkMode}
      />


<ViewNoteModal
  isOpen={isNoteViewOpen}
  noteText={viewNoteText}
  onClose={() => setIsNoteViewOpen(false)}
  darkMode={darkMode}
/>

    </div>
  );
};


export default Timesheet;
