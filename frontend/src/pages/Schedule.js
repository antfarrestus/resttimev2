import React, { useState, useEffect, useRef } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { format, startOfWeek, add, sub } from 'date-fns';
import { getOutlets, getEmployees, getShifts, getSchedules, createSchedule, updateSchedule, deleteSchedule, getSections } from '../services/api';
import { PlusIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, UsersIcon, EyeIcon, EyeSlashIcon, DocumentDuplicateIcon, CalendarIcon, FunnelIcon, AdjustmentsHorizontalIcon, MagnifyingGlassIcon, XMarkIcon, ArrowDownTrayIcon, PaperAirplaneIcon, ArrowsUpDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Schedule = ({ darkMode }) => {
  const { selectedCompany } = useCompany();
  const searchRef = useRef(null);
  const [selectedOutlet, setSelectedOutlet] = useState(() => {
    if (!selectedCompany?.id) return null;
    const savedOutletId = localStorage.getItem(`selectedOutlet_${selectedCompany.id}`);
    if (!savedOutletId) return null;
    return null; // Initially return null, will be updated after outlets are fetched
  });
  const [outlets, setOutlets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedules, setSchedules] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [copyMode, setCopyMode] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedFilterOutlet, setSelectedFilterOutlet] = useState(() => {
    if (!selectedCompany?.id) return null;
    const savedFilterOutletId = localStorage.getItem(`selectedFilterOutlet_${selectedCompany.id}`);
    return savedFilterOutletId ? parseInt(savedFilterOutletId) : null;
  });
  const [selectedFilterSections, setSelectedFilterSections] = useState(() => {
    if (!selectedCompany?.id) return [];
    const savedFilterSectionIds = localStorage.getItem(`selectedFilterSections_${selectedCompany.id}`);
    return savedFilterSectionIds ? JSON.parse(savedFilterSectionIds) : [];
  });
  const [isOutletDropdownOpen, setIsOutletDropdownOpen] = useState(false);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const [isMainOutletDropdownOpen, setIsMainOutletDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState(() => {
    const savedSortOrder = localStorage.getItem('employeeSortOrder') || 'asc';
    return savedSortOrder;
  });
  const [sortField, setSortField] = useState(() => {
    const savedSortField = localStorage.getItem('employeeSortField') || 'name';
    return savedSortField;
  });
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showOnlyScheduled, setShowOnlyScheduled] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [areTotalsCollapsed, setAreTotalsCollapsed] = useState(false);
  const [sendOptions, setSendOptions] = useState({
    email: false,
    whatsapp: false,
    updatedOnly: false
  });
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    shiftRate: '0.00',
    overtimeRate: '1',
    breaks: [],
    isOpenShift: false,
    duration: '',
    selectedShiftId: null,
    color: ''
  });

  // Predefined colors for the color picker
  const colorOptions = [
    '', // no color option
    '#4f46e5', // indigo
    '#0ea5e9', // sky blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
    '#000000' // black

  ];

  const [sourceSchedule, setSourceSchedule] = useState(null);

  const handleDuplicateClick = (schedule) => {
    if (copyMode && sourceSchedule?.id === schedule.id) {
      // Exit copy mode if clicking the same schedule's duplicate icon
      setCopyMode(false);
      setSourceSchedule(null);
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        shiftRate: '',
        overtimeRate: '1',
        breaks: [],
        isOpenShift: false,
        duration: '',
        color: ''
      });
      return;
    }

    setCopyMode(true);
    setSourceSchedule(schedule);
    // Store the schedule to be copied
    setFormData({
      ...formData,
      startTime: schedule.startTime.split('T')[1].substring(0, 5),
      endTime: schedule.endTime.split('T')[1].substring(0, 5),
      duration: schedule.duration,
      shiftRate: schedule.shiftRate.toString(),
      color: schedule.color || '',
      breaks: [
        schedule.break1start && {
          startTime: schedule.break1start.split('T')[1].substring(0, 5),
          endTime: schedule.break1end.split('T')[1].substring(0, 5),
          duration: schedule.break1duration || 0,
          paid: Boolean(schedule.break1paid)
        },
        schedule.break2start && {
          startTime: schedule.break2start.split('T')[1].substring(0, 5),
          endTime: schedule.break2end.split('T')[1].substring(0, 5),
          duration: schedule.break2duration || 0,
          paid: Boolean(schedule.break2paid)
        },
        schedule.break3start && {
          startTime: schedule.break3start.split('T')[1].substring(0, 5),
          endTime: schedule.break3end.split('T')[1].substring(0, 5),
          duration: schedule.break3duration || 0,
          paid: Boolean(schedule.break3paid)
        }
      ].filter(Boolean)
    });
  };

  // Function to filter employees based on selected outlet, section, and search term
  const filterEmployees = (employees) => {
    if (!employees) return [];
    
    let filteredEmployees = [...employees];
    
    // Filter by outlet if selected
    if (selectedFilterOutlet) {
      filteredEmployees = filteredEmployees.filter(emp => emp.outletId === selectedFilterOutlet);
    }
    
    // Filter by sections if any selected
    if (selectedFilterSections.length > 0) {
      filteredEmployees = filteredEmployees.filter(emp => selectedFilterSections.includes(emp.sectionId));
    }
    
    // Filter by search term if provided
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.firstName.toLowerCase().includes(term) || 
        emp.lastName.toLowerCase().includes(term) || 
        (emp.employeeNumber && emp.employeeNumber.toString().includes(term))
      );
    }

    // Filter employees with schedules if showOnlyScheduled is true
    if (showOnlyScheduled) {
      const currentWeekStart = format(currentWeek, 'yyyy-MM-dd');
      const currentWeekEnd = format(add(currentWeek, { days: 6 }), 'yyyy-MM-dd');
      
      filteredEmployees = filteredEmployees.filter(emp => {
        return schedules.some(s => {
          const scheduleDate = format(new Date(s.date), 'yyyy-MM-dd');
          return s.employeeId === emp.id && 
                 scheduleDate >= currentWeekStart && 
                 scheduleDate <= currentWeekEnd;
        });
      });
    }
    
    // Sort employees based on selected sort field
    return filteredEmployees.sort((a, b) => {
      // Primary sort based on selected field
      switch (sortField) {
        case 'name':
          const nameA = a.firstName.toLowerCase();
          const nameB = b.firstName.toLowerCase();
          return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        
        case 'number':
          const numA = a.employeeNumber || 0;
          const numB = b.employeeNumber || 0;
          if (sortOrder === 'asc') {
            return numA - numB;
          } else {
            return numB - numA;
          }
        
        case 'outlet':
          // Find outlet names for comparison
          const outletA = outlets.find(o => o.id === a.outletId)?.name?.toLowerCase() || '';
          const outletB = outlets.find(o => o.id === b.outletId)?.name?.toLowerCase() || '';
          
          // Compare outlets first
          const outletComparison = sortOrder === 'asc' ? 
            outletA.localeCompare(outletB) : 
            outletB.localeCompare(outletA);
          
          // If outlets are the same, sort by employee name as secondary sort
          if (outletComparison === 0) {
            const empNameA = a.firstName.toLowerCase();
            const empNameB = b.firstName.toLowerCase();
            return empNameA.localeCompare(empNameB);
          }
          
          return outletComparison;
        
        case 'section':
          // Find section names for comparison
          const sectionA = sections.find(s => s.id === a.sectionId)?.name?.toLowerCase() || '';
          const sectionB = sections.find(s => s.id === b.sectionId)?.name?.toLowerCase() || '';
          
          // Compare sections first
          const sectionComparison = sortOrder === 'asc' ? 
            sectionA.localeCompare(sectionB) : 
            sectionB.localeCompare(sectionA);
          
          // If sections are the same, sort by employee name as secondary sort
          if (sectionComparison === 0) {
            const empNameA = a.firstName.toLowerCase();
            const empNameB = b.firstName.toLowerCase();
            return empNameA.localeCompare(empNameB);
          }
          
          return sectionComparison;
        
        default:
          // Default to sorting by name
          const defaultNameA = a.firstName.toLowerCase();
          const defaultNameB = b.firstName.toLowerCase();
          return sortOrder === 'asc' ? defaultNameA.localeCompare(defaultNameB) : defaultNameB.localeCompare(defaultNameA);
      }
    });
  };
  
  // Handle click outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close outlet dropdown if click is outside
      if (isOutletDropdownOpen && !event.target.closest('[data-dropdown="outlet"]')) {
        setIsOutletDropdownOpen(false);
      }
      
      // Close section dropdown if click is outside
      if (isSectionDropdownOpen && !event.target.closest('[data-dropdown="section"]')) {
        setIsSectionDropdownOpen(false);
      }

      // Close main outlet dropdown if click is outside
      if (isMainOutletDropdownOpen && !event.target.closest('[data-dropdown="main-outlet"]')) {
        setIsMainOutletDropdownOpen(false);
      }

      // Close search dropdown if click is outside
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      
      // Close sort dropdown if click is outside
      if (isSortDropdownOpen && !event.target.closest('[data-dropdown="sort"]')) {
        setIsSortDropdownOpen(false);
      }
    };
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOutletDropdownOpen, isSectionDropdownOpen, isMainOutletDropdownOpen, isSearchOpen, isSortDropdownOpen]);

  const fetchData = async () => {
    if (selectedOutlet && selectedCompany?.id) {
      try {
        // Fetch employees for the selected outlet
        const employeesData = await getEmployees(selectedCompany.id, selectedOutlet.id);
        setAllEmployees(employeesData || []);
        
        // Apply filters to employees
        const filteredEmployees = filterEmployees(employeesData);
        setEmployees(filteredEmployees);

        // Fetch shifts for the company
        const shiftsData = await getShifts(selectedCompany.id);
        setShifts(shiftsData || []);

        // Fetch sections for the company
        const sectionsData = await getSections(selectedCompany.id);
        setSections(sectionsData || []);

        // Fetch schedules for the current week
        const weekStart = format(currentWeek, 'yyyy-MM-dd');
        const schedulesData = await getSchedules(selectedCompany.id, selectedOutlet.id, weekStart);
        setSchedules(schedulesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setEmployees([]);
        setAllEmployees([]);
        setSchedules([]);
        setShifts([]);
        setSections([]);
      }
    }
  };

  const handleShiftSelect = (shiftId) => {
    const selectedShift = shifts.find(shift => shift.id === parseInt(shiftId));
    if (selectedShift) {
      const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // Extract time portion without timezone transformation
        if (timeStr.includes('T')) {
          return timeStr.split('T')[1].substring(0, 5);
        }
        // Handle time-only string (HH:mm:ss)
        return timeStr.substring(0, 5);
      };

      setFormData({
        ...formData,
        selectedShiftId: shiftId,
        startTime: formatTime(selectedShift.startTime),
        endTime: formatTime(selectedShift.endTime),
        duration: selectedShift.duration,
        shiftRate: selectedShift.shiftRate.toString(),
        isOpenShift: selectedShift.isOpenShift,
        breaks: [          selectedShift.break1start && selectedShift.break1duration > 0 && {            startTime: formatTime(selectedShift.break1start),            endTime: formatTime(selectedShift.break1end),            duration: selectedShift.break1duration,            paid: Boolean(selectedShift.break1paid)          },          selectedShift.break2start && selectedShift.break2duration > 0 && {            startTime: formatTime(selectedShift.break2start),            endTime: formatTime(selectedShift.break2end),            duration: selectedShift.break2duration,            paid: Boolean(selectedShift.break2paid)          },          selectedShift.break3start && selectedShift.break3duration > 0 && {            startTime: formatTime(selectedShift.break3start),            endTime: formatTime(selectedShift.break3end),            duration: selectedShift.break3duration,            paid: Boolean(selectedShift.break3paid)          }        ].filter(Boolean)
      });
    }
  };

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = add(currentWeek, { days: i });
    return {
      name: format(date, 'EEEE'),
      date: format(date, 'dd/MM'),
      fullDate: date
    };
  });

  useEffect(() => {
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
    fetchOutlets();
  }, [selectedCompany]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedOutlet && selectedCompany?.id) {
        try {
          // Fetch employees for the selected outlet
          const employeesData = await getEmployees(selectedCompany.id, selectedOutlet.id);
          setAllEmployees(employeesData || []);
          
          // Fetch shifts for the company
          const shiftsData = await getShifts(selectedCompany.id);
          setShifts(shiftsData || []);
          
          // Fetch sections for the company
          const sectionsData = await getSections(selectedCompany.id);
          setSections(sectionsData || []);

          // Fetch schedules for the current week
          const weekStart = format(currentWeek, 'yyyy-MM-dd');
          const schedulesData = await getSchedules(selectedCompany.id, selectedOutlet.id, weekStart);
          setSchedules(schedulesData || []);
          
          // Apply filters to employees
          const filteredEmployees = filterEmployees(employeesData);
          setEmployees(filteredEmployees);
        } catch (error) {
          console.error('Error fetching data:', error);
          setEmployees([]);
          setAllEmployees([]);
          setSchedules([]);
          setShifts([]);
          setSections([]);
        }
      }
    };
    fetchData();
  }, [selectedOutlet, selectedCompany, currentWeek, sortOrder, sortField, selectedFilterOutlet, selectedFilterSections]);
  
  // Apply filters when they change
  useEffect(() => {
    setEmployees(filterEmployees(allEmployees));
  }, [selectedFilterOutlet, selectedFilterSections, sortOrder, sortField, searchTerm, allEmployees, showOnlyScheduled, schedules, currentWeek]);

  const handleCopyPreviousWeek = async () => {
    if (!selectedOutlet || !selectedCompany?.id) return;

    // Add confirmation dialog before copying previous week's schedule
    const confirmed = window.confirm('Are you sure you want to duplicate last week\'s schedule? This will copy all shifts from the previous week to the current week.');
    
    if (!confirmed) return; // Exit if user cancels

    try {
      // Get the previous week's start date
      const previousWeekStart = format(sub(currentWeek, { weeks: 1 }), 'yyyy-MM-dd');
      
      // Fetch previous week's schedules
      const previousWeekSchedules = await getSchedules(selectedCompany.id, selectedOutlet.id, previousWeekStart);
      
      // Get current week's schedules to check for existing entries
      const currentWeekStart = format(currentWeek, 'yyyy-MM-dd');
      const currentWeekSchedules = await getSchedules(selectedCompany.id, selectedOutlet.id, currentWeekStart);

      // Process each schedule from previous week
      for (const schedule of previousWeekSchedules) {
        // Calculate the same day in current week
        const previousDate = new Date(schedule.date);
        const daysToAdd = 7; // One week
        const newDate = add(previousDate, { days: daysToAdd });
        
        // Check if a schedule already exists for this employee on this date
        const existingSchedule = currentWeekSchedules.find(s =>
          s.employeeId === schedule.employeeId &&
          format(new Date(s.date), 'yyyy-MM-dd') === format(newDate, 'yyyy-MM-dd')
        );

        // Only create new schedule if none exists
        if (!existingSchedule) {
          const newScheduleData = {
            ...schedule,
            id: undefined, // Remove id to create new record
            date: format(newDate, 'yyyy-MM-dd'),
            startTime: `${format(newDate, 'yyyy-MM-dd')}T${schedule.startTime.split('T')[1]}`,
            endTime: `${format(newDate, 'yyyy-MM-dd')}T${schedule.endTime.split('T')[1]}`,
            break1start: schedule.break1start ? `${format(newDate, 'yyyy-MM-dd')}T${schedule.break1start.split('T')[1]}` : null,
            break1end: schedule.break1end ? `${format(newDate, 'yyyy-MM-dd')}T${schedule.break1end.split('T')[1]}` : null,
            break2start: schedule.break2start ? `${format(newDate, 'yyyy-MM-dd')}T${schedule.break2start.split('T')[1]}` : null,
            break2end: schedule.break2end ? `${format(newDate, 'yyyy-MM-dd')}T${schedule.break2end.split('T')[1]}` : null,
            break3start: schedule.break3start ? `${format(newDate, 'yyyy-MM-dd')}T${schedule.break3start.split('T')[1]}` : null,
            break3end: schedule.break3end ? `${format(newDate, 'yyyy-MM-dd')}T${schedule.break3end.split('T')[1]}` : null
          };
          
          await createSchedule(selectedCompany.id, newScheduleData);
        }
      }
      
      // Refresh the schedule display
      await fetchData();
    } catch (error) {
      console.error('Error copying previous week schedules:', error);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => sub(prev, { weeks: 1 }));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => add(prev, { weeks: 1 }));
  };

  const applyPreDefinedShift = async (employee, date, shift) => {
    const existingSchedule = schedules.find(s =>
      s.employeeId === employee.id &&
      format(new Date(s.date), 'yyyy-MM-dd') === date
    );
  
    if (!existingSchedule) {
      const scheduleData = {
        employeeId: parseInt(employee.id),
        companyId: parseInt(selectedCompany.id),
        outletId: parseInt(selectedOutlet.id),
        date: date,
        startTime: `${date}T${shift.startTime.split('T')[1]}`,
        endTime: `${date}T${shift.endTime.split('T')[1]}`,
        duration: shift.duration,
        shiftRate: shift.shiftRate,
        isOpenShift: shift.isOpenShift,
        breaks: [
          shift.break1start && shift.break1duration > 0 && {
            startTime: `${date}T${shift.break1start.split('T')[1]}`,
            endTime: `${date}T${shift.break1end.split('T')[1]}`,
            duration: shift.break1duration,
            paid: Boolean(shift.break1paid)
          },
          shift.break2start && shift.break2duration > 0 && {
            startTime: `${date}T${shift.break2start.split('T')[1]}`,
            endTime: `${date}T${shift.break2end.split('T')[1]}`,
            duration: shift.break2duration,
            paid: Boolean(shift.break2paid)
          },
          shift.break3start && shift.break3duration > 0 && {
            startTime: `${date}T${shift.break3start.split('T')[1]}`,
            endTime: `${date}T${shift.break3end.split('T')[1]}`,
            duration: shift.break3duration,
            paid: Boolean(shift.break3paid)
          }
        ].filter(Boolean)
      };
  
      await createSchedule(selectedCompany.id, scheduleData);
    }
  };

  const sortEmployees = (field = sortField) => {
    // Toggle sort order if clicking the same field, otherwise set to ascending
    const newSortOrder = field === sortField ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
    
    // Update sort field and order
    setSortField(field);
    setSortOrder(newSortOrder);
    
    // Save to localStorage
    localStorage.setItem('employeeSortField', field);
    localStorage.setItem('employeeSortOrder', newSortOrder);
    
    // Apply sorting
    setEmployees(filterEmployees(allEmployees));
  };

  const calculateDailyTotal = (dayIndex) => {
    // Calculate total hours for all employees on a specific day
    if (!schedules || !schedules.length) return 0;
    
    const date = format(add(currentWeek, { days: dayIndex }), 'yyyy-MM-dd');
    const daySchedules = schedules.filter(s => format(new Date(s.date), 'yyyy-MM-dd') === date);
    
    // Sum up all durations for the day
    const total = daySchedules.reduce((sum, schedule) => sum + (schedule.duration || 0), 0);
    return parseFloat(total.toFixed(2));
  };

  const calculateEmployeeWeeklyTotal = (employeeId) => {
    // Calculate total hours for a specific employee for the entire week
    if (!schedules || !schedules.length) return 0;
    
    const employeeSchedules = schedules.filter(s => s.employeeId === employeeId);
    
    // Sum up all durations for the employee
    const total = employeeSchedules.reduce((sum, schedule) => sum + (schedule.duration || 0), 0);
    return parseFloat(total.toFixed(2));
  };

  const calculateGrandTotal = () => {
    // Calculate total hours for all employees for the entire week
    if (!schedules || !schedules.length) return 0;
    
    // Sum up all durations
    const total = schedules.reduce((sum, schedule) => sum + (schedule.duration || 0), 0);
    return parseFloat(total.toFixed(2));
  };

  const handleScheduleClick = (employee, date) => {
    if (copyMode) {
      // In copy mode, create a new schedule with copied data
      const scheduleData = {
        employeeId: parseInt(employee.id),
        companyId: parseInt(selectedCompany.id),
        outletId: parseInt(selectedOutlet.id),
        date: format(date, 'yyyy-MM-dd'),
        startTime: `${format(date, 'yyyy-MM-dd')}T${formData.startTime}:00`,
        endTime: `${format(date, 'yyyy-MM-dd')}T${formData.endTime}:00`,
        duration: formData.duration,
        shiftRate: parseFloat(formData.shiftRate) || 0.00,
        overtimeRate: parseFloat(formData.overtimeRate) || 1.00,
        isOpenShift: formData.isOpenShift,
        color: formData.color || '',
        breaks: formData.breaks.map(breakItem => ({
          startTime: breakItem.startTime ? `${format(date, 'yyyy-MM-dd')}T${breakItem.startTime}:00` : null,
          endTime: breakItem.endTime ? `${format(date, 'yyyy-MM-dd')}T${breakItem.endTime}:00` : null,
          duration: breakItem.duration || 0,
          paid: Boolean(breakItem.paid)
        }))
      };

      createSchedule(selectedCompany.id, scheduleData)
        .then(() => {
          fetchData();
          // Remove the setCopyMode(false) to maintain copy mode
        })
        .catch(error => {
          console.error('Error creating copied schedule:', error);
        });
      return;
    }

    setSelectedEmployee(employee);
    const existingSchedule = schedules.find(s => 
      s.employeeId === employee.id && 
      format(new Date(s.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    setFormData({
      employeeId: employee.id,
      companyId: selectedCompany.id,
      outletId: selectedOutlet.id,
      date: format(date, 'yyyy-MM-dd'),
      startTime: existingSchedule ? existingSchedule.startTime.split('T')[1].substring(0, 5) : '',
      endTime: existingSchedule ? existingSchedule.endTime.split('T')[1].substring(0, 5) : '',
      duration: existingSchedule ? existingSchedule.duration : '',
      shiftRate: existingSchedule ? existingSchedule.shiftRate.toString() : '1',
      overtimeRate: existingSchedule ? (existingSchedule.overtimeRate ? existingSchedule.overtimeRate.toString() : '1') : '1',
      isOpenShift: existingSchedule ? existingSchedule.isOpenShift : false,
      color: existingSchedule ? existingSchedule.color : '',
      breaks: existingSchedule ? [        existingSchedule.break1start && existingSchedule.break1duration > 0 && {          startTime: existingSchedule.break1start.split('T')[1].substring(0, 5),          endTime: existingSchedule.break1end.split('T')[1].substring(0, 5),          duration: existingSchedule.break1duration,          paid: Boolean(existingSchedule.break1paid)        },        existingSchedule.break2start && existingSchedule.break2duration > 0 && {          startTime: existingSchedule.break2start.split('T')[1].substring(0, 5),          endTime: existingSchedule.break2end.split('T')[1].substring(0, 5),          duration: existingSchedule.break2duration,          paid: Boolean(existingSchedule.break2paid)        },        existingSchedule.break3start && existingSchedule.break3duration > 0 && {          startTime: existingSchedule.break3start.split('T')[1].substring(0, 5),          endTime: existingSchedule.break3end.split('T')[1].substring(0, 5),          duration: existingSchedule.break3duration,          paid: Boolean(existingSchedule.break3paid)        }      ].filter(Boolean) : []
    });
    setIsModalOpen(true);
  };

  const handleAddBreak = () => {
    if (formData.breaks.length < 3) {
      setFormData({
        ...formData,
        breaks: [...formData.breaks, { 
          startTime: formData.isOpenShift ? '00:00' : '', 
          endTime: formData.isOpenShift ? '00:00' : '', 
          duration: 0, 
          paid: false 
        }]
      });
    }
  };

  const handleRemoveBreak = (index) => {
    const newBreaks = formData.breaks.filter((_, i) => i !== index);
    setFormData({ ...formData, breaks: newBreaks });
  };

  const handleBreakChange = (index, field, value) => {
    const newBreaks = [...formData.breaks];
    
    // Special handling for duration field in open shifts - convert minutes to hours
    if (field === 'duration') {
      if (formData.isOpenShift) {
        // For open shifts, convert minutes to hours (e.g., 15 minutes → 0.25 hours)
        // Fix: Use toFixed(2) to ensure consistent decimal precision
        const durationInHours = parseFloat((parseFloat(value) / 60).toFixed(2));
        newBreaks[index] = { ...newBreaks[index], duration: durationInHours };
      } else {
        // For regular shifts, keep as hours
        newBreaks[index] = { ...newBreaks[index], duration: parseFloat(value) };
      }
    } else {
      // For other fields, just update the value
      newBreaks[index] = { ...newBreaks[index], [field]: value };
      
      // Only calculate duration from start/end times if not in open shift mode
      if ((field === 'startTime' || field === 'endTime') && !formData.isOpenShift) {
        const duration = calculateDuration(newBreaks[index].startTime, newBreaks[index].endTime);
        newBreaks[index].duration = duration;
      }
    }
    
    // For open shifts, don't recalculate the main duration when breaks change
    // This will be done only when the form is submitted
    if (!formData.isOpenShift) {
      const totalBreakDuration = newBreaks.reduce((acc, breakItem) => {
        return acc + (breakItem.paid ? 0 : (breakItem.duration || 0));
      }, 0);
      
      // Calculate from start/end times
      const shiftDuration = calculateDuration(formData.startTime, formData.endTime);
      const finalDuration = shiftDuration - totalBreakDuration;
      
      setFormData({ 
        ...formData, 
        breaks: newBreaks,
        duration: Math.max(0, finalDuration)
      });
    } else {
      // For open shifts, just update the breaks without recalculating duration
      setFormData({
        ...formData,
        breaks: newBreaks
      });
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedCompany || !selectedEmployee) {
      console.error('Missing required data: company or employee');
      return;
    }

    try {
      // Check if a schedule already exists for this employee on this date
      const existingSchedule = schedules.find(s => 
        s.employeeId === selectedEmployee.id && 
        format(new Date(s.date), 'yyyy-MM-dd') === format(new Date(formData.date), 'yyyy-MM-dd')
      );

      // Calculate total unpaid break duration for both open and regular shifts
      const totalUnpaidBreakDuration = formData.breaks?.reduce((total, breakItem) => {
        // For open shifts, use the duration directly
        if (formData.isOpenShift) {
          return total + (breakItem.paid ? 0 : (parseFloat(breakItem.duration) || 0));
        } 
        // For regular shifts, calculate from start/end times
        else if (breakItem.startTime && breakItem.endTime) {
          const breakDuration = calculateDuration(breakItem.startTime, breakItem.endTime);
          return total + (breakItem.paid ? 0 : (breakDuration || 0));
        }
        return total;
      }, 0) || 0;

      // Calculate shift duration
      let shiftDuration;
      if (formData.isOpenShift) {
        // For open shifts, subtract unpaid break durations from the entered duration
        shiftDuration = (parseFloat(formData.duration) || 0.00) - totalUnpaidBreakDuration;
      } else {
        // For regular shifts, calculate from start/end times and subtract unpaid breaks
        shiftDuration = calculateDuration(formData.startTime, formData.endTime) - totalUnpaidBreakDuration;
      }

      // Format the schedule data with all required fields
      const scheduleData = {
        employeeId: parseInt(selectedEmployee.id),
        companyId: parseInt(selectedCompany.id),
        outletId: parseInt(selectedOutlet.id),
        date: formData.date,
        shiftRate: parseFloat(formData.shiftRate) || 0.00,
        overtimeRate: parseFloat(formData.overtimeRate) || 1.00,
        duration: shiftDuration || 0.00,
        startTime: `${formData.date}T${formData.startTime}:00`,
        endTime: `${formData.date}T${formData.endTime}:00`,
        isOpenShift: formData.isOpenShift,
        color: formData.color || null,
        breaks: formData.breaks ? formData.breaks.map(breakItem => {
          // For open shifts, use the duration directly from state (already converted to hours)
          // For regular shifts, calculate from start/end times if available
          let breakDuration = breakItem.duration || 0;
          if (!formData.isOpenShift && breakItem.startTime && breakItem.endTime) {
            breakDuration = calculateDuration(breakItem.startTime, breakItem.endTime) || 0;
          }
          
          return {
            startTime: breakItem.startTime ? `${formData.date}T${breakItem.startTime}:00` : null,
            endTime: breakItem.endTime ? `${formData.date}T${breakItem.endTime}:00` : null,
            duration: breakDuration,
            paid: Boolean(breakItem.paid)
          };
        }) : []
      };

      if (existingSchedule) {
        await updateSchedule(selectedCompany.id, existingSchedule.id, scheduleData);
      } else {
        await createSchedule(selectedCompany.id, scheduleData);
      }
      
      await fetchData();
      setIsModalOpen(false);
      setSelectedEmployee(null);
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        shiftRate: '0.00',
        overtimeRate: '1',
        breaks: [],
        isOpenShift: false,
        duration: '',
        color: ''
      });
    } catch (error) {
      console.error('Error saving schedule:', error.message || 'Failed to create schedule');
    }
  };

  const getScheduleForDay = (employee, date) => {
    return schedules.find(s =>
      s.employeeId === employee.id &&
      format(new Date(s.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const formatScheduleTime = (schedule) => {
    if (!schedule) return <span className={`font-normal ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>OFF</span>;
    try {
      let startTime = '--:--';
      let endTime = '--:--';

      if (schedule.startTime) {
        const timeStr = schedule.startTime.split('T')[1].substring(0, 5);
        startTime = timeStr;
      }

      if (schedule.endTime) {
        const timeStr = schedule.endTime.split('T')[1].substring(0, 5);
        endTime = timeStr;
      }

      return `${startTime} - ${endTime}`;
    } catch (error) {
      console.error('Error formatting schedule time:', error);
      return '--:-- - --:--';
    }
  };

  const formatBreak = (schedule) => {
    if (!schedule) return '';
    const breakCount = [schedule.break1duration, schedule.break2duration, schedule.break3duration].filter(b => b).length;
    return breakCount > 0 ? `${breakCount} break${breakCount > 1 ? 's' : ''} (${schedule.break1duration || 0}h)` : '';
  };

  const formatDuration = (schedule) => {
    if (!schedule) return '';
    return `${schedule.duration || 0}h`;
  };

  const handleExportToPDF = async () => {
    if (!selectedOutlet) return;

    // Create a reference to the temporary div for cleanup in finally block
    let tempDiv = null;

    try {
      // Create a temporary div to hold a clean version of the table for PDF export
      tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '1200px'; // Set a fixed width to ensure proper rendering
      document.body.appendChild(tempDiv);

      // Create title with outlet name and date range
      const mainTitle = `${selectedOutlet.name.toUpperCase()} SCHEDULE`;
      const dateRange = `${format(currentWeek, 'dd MMM')} - ${format(add(currentWeek, { days: 6 }), 'd MMM yyyy')}`;
      
      // Create a clean table for PDF export with explicit ID
      const tableHTML = `
        <div id="pdf-content" style="font-family: Arial, sans-serif; width: 100%;">
          <h2 style="text-align: center; margin-bottom: 5px;">${mainTitle}</h2>
          <h3 style="text-align: center; margin-bottom: 15px; font-size: 14px;">${dateRange}</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: ${darkMode ? '#1e293b' : '#f3f4f6'};">
                <th style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: left; font-size: 12px; color: ${darkMode ? '#e2e8f0' : '#111827'};">Employee</th>
                ${weekDays.map(day => {
                  const isToday = format(day.fullDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return `
                  <th style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: center; color: ${darkMode ? '#e2e8f0' : '#111827'}">
                    <span style="font-size: 14px;">${day.name}<br>
                    <span style="font-size: 12px;">${day.date}</span>
                  </th>
                `}).join('')}
                ${!areTotalsCollapsed ? `
                <th style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: center; color: ${darkMode ? '#e2e8f0' : '#111827'}; width: 40px;">
                  <div style="margin: 0 auto; white-space: nowrap;">
                    <span style="font-size: 12px;">Weekly</span>
                    <span style="font-size: 12px;">Total</span>
                  </div>
                </th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${employees.map(employee => `
                <tr style="background-color: ${darkMode ? '#1e293b' : '#ffffff'};">
                  <td style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: left; color: ${darkMode ? '#e2e8f0' : '#111827'};">
                    <div style="font-weight: 500; font-size: 14px;">${employee.firstName} ${employee.lastName}</div>
                    ${employee.Section?.name ? `<div style="font-size: 8px; margin-top: 2px;"><span style="color: ${darkMode ? '#bfdbfe' : '#1e40af'}; font-size: 8px; ">${employee.Section.name}</span></div>` : ''}
                  </td>
                  ${weekDays.map(day => {
                    const schedule = getScheduleForDay(employee, day.fullDate);
                    // Count breaks with duration
                    const breakCount = schedule ? [schedule.break1duration, schedule.break2duration, schedule.break3duration].filter(b => b).length : 0;
                    // Format break text similar to UI
                    const breakText = breakCount > 0 ? `${breakCount} break${breakCount > 1 ? 's' : ''} (${schedule.break1duration || 0}h)` : '';
                    
                    return `
<td style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: center; color: ${darkMode ? '#e2e8f0' : '#111827'}; position: relative; overflow: hidden;">
  ${schedule && schedule.color ? `
    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: ${schedule.color}; border-radius: 4px 0 0 4px; transform: perspective(8px) rotateY(-50deg); transform-origin: left center; box-shadow: 0 0 10px 0 ${schedule.color}70;"></div>
  ` : ''}
  ${schedule ? `
    <div style="font-size: 14px;">${schedule.startTime ? schedule.startTime.split('T')[1].substring(0, 5) : '--:--'} - ${schedule.endTime ? schedule.endTime.split('T')[1].substring(0, 5) : '--:--'}</div>
    ${breakText ? `<div style="font-size: 10px; color: ${darkMode ? '#94a3b8' : '#6b7280'};">${breakText}</div>` : ''}
    <div style="font-size: 12px; color: ${darkMode ? '#34d399' : '#10b981'}; font-weight: 500;">${schedule.duration ? schedule.duration + 'h' : ''}</div>
  ` : `<span style="color: ${darkMode ? '#475569' : '#d1d5db'};">OFF</span>`}
</td>

                    `;
                  }).join('')}
                  ${!areTotalsCollapsed ? `
                  <td style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; background-color: ${darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${darkMode ? '#34d399' : '#10b981'}; font-weight: 500;">
                    ${calculateEmployeeWeeklyTotal(employee.id)}h
                  </td>
                  ` : ''}
                </tr>
              `).join('')}
              ${!areTotalsCollapsed ? `
              <tr style="background-color: ${darkMode ? '#1e293b' : '#f3f4f6'};">
                <td style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: left; font-size: 12px; font-weight: bold; color: ${darkMode ? '#e2e8f0' : '#111827'};">Daily Total</td>
                ${weekDays.map((day, index) => `
                  <td style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; color: ${darkMode ? '#e2e8f0' : '#111827'}; vertical-align: middle;">
                    ${calculateDailyTotal(index)}h
                  </td>
                `).join('')}
                <td style="border: 1px solid ${darkMode ? '#334155' : '#e5e7eb'}; padding: 8px; text-align: center; font-size: 12px; font-weight: bold; color: ${darkMode ? '#e2e8f0' : '#111827'}; vertical-align: middle;">
                  ${calculateGrandTotal()}h
                </td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `;
      
      // Set the HTML content
      tempDiv.innerHTML = tableHTML;
      
      // Ensure the div is in the document
      if (!tempDiv.parentNode) {
        document.body.appendChild(tempDiv);
      }

      // Ensure content is fully rendered before capturing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set up PDF document in landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Get PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Get the specific element with ID to ensure we capture the right element
      const contentElement = tempDiv.querySelector('#pdf-content');
      
      if (!contentElement) {
        throw new Error('PDF content element not found in the DOM');
      }
      // test
      // Set up canvas options with improved settings for better compatibility
      const options = {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Make sure the cloned document has the element we need
          const clonedElement = clonedDoc.querySelector('#pdf-content');
          if (!clonedElement) {
            console.error('Element not found in cloned document');
          } else {
            // Ensure the element is visible in the cloned document
            clonedElement.style.display = 'block';
            clonedElement.style.visibility = 'visible';
            clonedElement.style.opacity = '1';
            clonedElement.style.position = 'static';
            clonedElement.style.width = '100%';
            // Force layout recalculation
            void clonedElement.offsetHeight;
          }
        }
      };

      // Direct approach without nested try-catch for cleaner error handling
      // Capture the clean table as canvas
      const canvas = await html2canvas(contentElement, options);
      
      if (!canvas) {
        throw new Error('Failed to create canvas from content');
      }
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate image dimensions to fit in PDF
      const imgWidth = pdfWidth - 20; // 10mm margins on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if we need multiple pages
      const pageHeight = pdfHeight - 20; // 10mm margins on top and bottom
      let heightLeft = imgHeight;
      let position = 0;
      let pageNumber = 1;
      
      // Add first part of image
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      heightLeft -= pageHeight - 10;
      position = heightLeft - imgHeight; // Negative value
      
      // Add page number
      pdf.setFontSize(8);
      pdf.text(`Page ${pageNumber}`, pdfWidth - 10, pdfHeight - 5, { align: 'right' });
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        pageNumber++;
        pdf.addPage();
        
        // Add next part of image
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight, '', 'FAST', 0, position);
        
        // Add page number
        pdf.setFontSize(8);
        pdf.text(`Page ${pageNumber}`, pdfWidth - 10, pdfHeight - 5, { align: 'right' });
        
        heightLeft -= pageHeight - 10;
        position -= pageHeight - 10;
      }
      
      // Save the PDF
      pdf.save(`${selectedOutlet.name}_schedule_${format(currentWeek, 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}. Please try again.`);
    } finally {
      // Clean up the temporary div if it exists
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    }
  };

  return (
    <div className={`w-full ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      <div className="mb-6">

        
      <div className={`flex justify-between items-center p-4 rounded-lg mb-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
  {/* Title and Outlet Selection Container */}
  <div className="flex items-center gap-4">
    <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      Schedule
    </h1>

    {/* Outlet Selection - Custom Dropdown */}
    <div className="relative" data-dropdown="main-outlet">
      <button
        onClick={() => {
          // Toggle main outlet dropdown and close other dropdowns
          const newState = !isMainOutletDropdownOpen;
          setIsMainOutletDropdownOpen(newState);
          setIsOutletDropdownOpen(false);
          setIsSectionDropdownOpen(false);
        }}
        className={`w-64 p-2 pr-3 rounded-lg border flex justify-between items-center ${darkMode ? 'bg-slate-700 border-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}
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

  {/* Week Navigation */}
  <div className="flex gap-4 items-right">
  <button
      onClick={() => setIsSendModalOpen(true)}
      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Send Schedule to Employees"
    >
      <PaperAirplaneIcon className="h-4 w-4 text-emerald-400" />
    </button>
  <button
      onClick={handleExportToPDF}
      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Export Schedule to PDF"
    >
      <ArrowDownTrayIcon className="h-4 w-4 text-emerald-400" />
    </button>
    <button
      onClick={handleCopyPreviousWeek}
      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Duplicate last week's Schedule"
    >
      <DocumentDuplicateIcon className="h-4 w-4 text-emerald-400" />
    </button>
    <button
      onClick={handlePreviousWeek}
      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Previous Week"
    >
      <ChevronLeftIcon className="h-4 w-4 text-slate-400" />
    </button>
    <span className={`px-4 py-2 font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
      {format(currentWeek, 'dd MMM')} - {format(add(currentWeek, { days: 6 }), 'dd MMM yyyy')}
    </span>
    <button
      onClick={handleNextWeek}
      className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Next Week"
    >
      <ChevronRightIcon className="h-4 w-4 text-slate-400" />
    </button>
  </div>
</div>

      </div>

      {/* Schedule Table */}
      <div className={`overflow-x-auto rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow`}>
        <table className="w-full">
          <thead>
            <tr className={`${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <th className="px-4 py-2 text-left">
  <div className="inline-flex items-center gap-2">
    
    {/* Sort by dropdown */}
      <div className="relative" data-dropdown="sort">
        <button
          onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
          className={`p-2 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
          title="Sort by"
        >
          <ArrowsUpDownIcon className="h-4 w-4 text-slate-400" />
          {sortField === 'name' && <span className="text-xs">Name</span>}
          {sortField === 'number' && <span className="text-xs">Number</span>}
          {sortField === 'outlet' && <span className="text-xs">Outlet</span>}
          {sortField === 'section' && <span className="text-xs">Section</span>}
        </button>
        
        {isSortDropdownOpen && (
          <div className={`absolute z-10 mt-1 w-44 rounded-md shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`}>
            <div className="py-1">
              <button
                onClick={() => {
                  sortEmployees('name');
                  setIsSortDropdownOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm font-normal ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} ${sortField === 'name' ? (darkMode ? 'bg-slate-700' : 'bg-slate-100') : ''}`}
              >
                Employee Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => {
                  sortEmployees('number');
                  setIsSortDropdownOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm font-normal ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} ${sortField === 'number' ? (darkMode ? 'bg-slate-700' : 'bg-slate-100') : ''}`}
              >
                Employee Number {sortField === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => {
                  sortEmployees('outlet');
                  setIsSortDropdownOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm font-normal ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} ${sortField === 'outlet' ? (darkMode ? 'bg-slate-700' : 'bg-slate-100') : ''}`}
              >
                Outlet {sortField === 'outlet' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => {
                  sortEmployees('section');
                  setIsSortDropdownOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm font-normal ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'} ${sortField === 'section' ? (darkMode ? 'bg-slate-700' : 'bg-slate-100') : ''}`}
              >
                Section {sortField === 'section' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        )}
      </div>


    
    {/* Outlet Filter Button */}
    <div className="relative" data-dropdown="outlet">
      <button
        onClick={() => {
          setIsOutletDropdownOpen(!isOutletDropdownOpen);
          setIsSectionDropdownOpen(false);
        }}
        className={`p-2 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
        title="Filter by Outlet"
      >
        <FunnelIcon className="h-4 w-4 text-purple-500" />
      </button>
      
      {isOutletDropdownOpen && (
        <div className={`fixed z-50 mt-1 w-56 rounded-md shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`} style={{
          top: document.querySelector('[data-dropdown="outlet"]')?.getBoundingClientRect().bottom + window.scrollY + 'px',
          left: document.querySelector('[data-dropdown="outlet"]')?.getBoundingClientRect().left + window.scrollX + 'px'
        }}>
          <div className="py-1">
            <button
              onClick={() => {
                setSelectedFilterOutlet(null);
                localStorage.removeItem(`selectedFilterOutlet_${selectedCompany.id}`);
                setIsOutletDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm font-normal ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              All Outlets
            </button>
            {outlets.map(outlet => (
              <button
                key={outlet.id}
                onClick={() => {
                  setSelectedFilterOutlet(outlet.id);
                  localStorage.setItem(`selectedFilterOutlet_${selectedCompany.id}`, outlet.id);
                  setIsOutletDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-normal ${selectedFilterOutlet === outlet.id ? (darkMode ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-900') : (darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100')}`}
              >
                {outlet.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    
    {/* Section Filter Button */}
    <div className="relative" data-dropdown="section">
      <button
        onClick={() => {
          setIsSectionDropdownOpen(!isSectionDropdownOpen);
          setIsOutletDropdownOpen(false);
        }}
        className={`p-2 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'} ${selectedFilterSections.length > 0 ? 'ring-2 ring-emerald-500' : ''}`}
        title="Filter by Section"
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-500" />
      </button>
      
      {isSectionDropdownOpen && (
        <div className={`fixed z-50 mt-1 w-56 rounded-md shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'}`} style={{
          top: document.querySelector('[data-dropdown="section"]')?.getBoundingClientRect().bottom + window.scrollY + 'px',
          left: document.querySelector('[data-dropdown="section"]')?.getBoundingClientRect().left + window.scrollX + 'px'
        }}>
          <div className="py-1">
            <button
              onClick={() => {
                setSelectedFilterSections([]);
                localStorage.removeItem(`selectedFilterSections_${selectedCompany.id}`);
                setIsSectionDropdownOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm font-normal ${darkMode ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              Clear All Selections
            </button>
            <div className="border-t dark:border-slate-700/50 border-slate-200 my-1"></div>
            {sections.map(section => (
              <div 
                key={section.id}
                className={`flex items-center px-4 py-2 text-sm font-normal hover:${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
              >
                <input
                  type="checkbox"
                  id={`section-${section.id}`}
                  checked={selectedFilterSections.includes(section.id)}
                  onChange={() => {
                    const newSelectedSections = selectedFilterSections.includes(section.id)
                      ? selectedFilterSections.filter(id => id !== section.id)
                      : [...selectedFilterSections, section.id];
                    
                    setSelectedFilterSections(newSelectedSections);
                    localStorage.setItem(`selectedFilterSections_${selectedCompany.id}`, JSON.stringify(newSelectedSections));
                  }}
                  className={`h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700`}
                />
                <label
                  htmlFor={`section-${section.id}`}
                  className={`ml-2 w-full cursor-pointer ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  {section.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

{/* Search Button */}
    <div className="relative" ref={searchRef}>
  <button
    onClick={() => setIsSearchOpen(!isSearchOpen)}
    className={`flex items-center justify-center p-2 rounded-lg border font-normal ${
      darkMode
        ? "bg-slate-700 border-slate-700 hover:bg-slate-600 text-slate-50"
        : "bg-white hover:bg-slate-50 border border-slate-300 text-slate-700"
    }`}
    title="Search employees"
  >
    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
  </button>

  {isSearchOpen && (
    <div
      className={`absolute top-0 left-0 z-50 w-64 h-10 rounded-lg shadow-lg flex items-center border ${
        darkMode
          ? "bg-slate-700 border-slate-600 text-slate-200"
          : "bg-white border-slate-300 text-slate-700"
      }`}
    >
      <MagnifyingGlassIcon className="ml-2 h-4 w-4 text-slate-500" />
      <input
        type="text"
        placeholder="Search by name or number"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full font-normal bg-transparent focus:outline-none px-2 placeholder-slate-400"
        autoFocus
      />
    </div>
  )}
</div>

<button
      onClick={async () => {
        // Add confirmation dialog before creating pre-defined shifts
        const confirmed = window.confirm('Are you sure you want to create pre-defined shifts for all employees? This action cannot be undone.');
        
        if (confirmed) {
          const weekDates = weekDays.map(day => format(day.fullDate, 'yyyy-MM-dd'));
          for (const employee of employees) {
            for (const date of weekDates) {
              const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase();
              const shiftId = employee[`${dayOfWeek}ShiftId`];
              if (shiftId) {
                const shift = shifts.find(s => s.id === shiftId);
                if (shift) await applyPreDefinedShift(employee, date, shift);
              }
            }
          }
          fetchData();
        }
      }}
      className={`p-2 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Create pre-defined shifts for all employees"
    >
      <PlusIcon className="h-4 w-4 text-emerald-500" />
      <CalendarIcon className="h-4 w-4 text-emerald-500" />
    </button>

{/* Show/Hide schduled employees button */}
<button
      onClick={() => setShowOnlyScheduled(!showOnlyScheduled)}
      className={`p-2 rounded-lg flex items-center gap-1 ${darkMode ? 
        showOnlyScheduled ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 
        showOnlyScheduled ? 'bg-slate-100 hover:bg-white text-slate-700 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'}`}
      title="Show/Hide Employees not in the Schedule"
    >
      {showOnlyScheduled ? 
        <EyeSlashIcon className="h-4 w-4 text-emerald-500" /> : 
        <EyeIcon className="h-4 w-4 text-emerald-500" />
      }
      <UsersIcon className="h-4 w-4 text-emerald-500" />
    </button>

  </div>
</th>
              {weekDays.map((day) => {
                const isToday = format(day.fullDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                return (
                  <th key={day.date} className={`px-4 py-2 text-center relative ${isToday ? 'border-b-4 border-emerald-500' : ''}`}>
                    <div className="flex items-center justify-center">
                      <span>{day.name}</span>
                      {areTotalsCollapsed && day.name === 'Sunday' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAreTotalsCollapsed(false);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Show totals"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{day.date}</div>
                  </th>
                );
              })}
              {!areTotalsCollapsed && (
                <th className="px-6 py-2 text-center relative min-w-[120px]">
                  <div className="flex items-center justify-center gap-2">
                    <span>Weekly Total</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAreTotalsCollapsed(true);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200/30 dark:hover:bg-slate-700"
                      title="Hide totals"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {!areTotalsCollapsed && (
              <tr className={`border-t ${darkMode ? 'border-slate-700 bg-emerald-800/20' : 'border-slate-200 bg-emerald-200/20'}`}>
                <td className="px-4 py-2 font-medium">Daily Totals</td>
                {weekDays.map((day) => (
                  <td key={day.date} className="px-4 py-2 text-center font-medium text-emerald-500">
                    <div>
                      {schedules
                        .filter(s => format(new Date(s.date), 'yyyy-MM-dd') === format(day.fullDate, 'yyyy-MM-dd'))
                        .reduce((total, s) => total + parseFloat(s.duration || 0), 0)
                        .toFixed(2)} h
                    </div>
                    <div className={`text-sm font-normal ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      €{schedules
                        .filter(s => format(new Date(s.date), 'yyyy-MM-dd') === format(day.fullDate, 'yyyy-MM-dd'))
                        .reduce((total, s) => {
                          const employee = employees.find(e => e.id === s.employeeId);
                          const hourlyPay = employee?.hourlyPay || 0;
                          return total + (parseFloat(s.duration || 0) * hourlyPay * parseFloat(s.shiftRate || 1));
                        }, 0)
                        .toFixed(2)}
                    </div>
                  </td>
                ))}
                <td className="px-4 py-2 text-center font-medium text-emerald-500 w-24">
                  <div>
                    {schedules
                      .reduce((total, s) => total + parseFloat(s.duration || 0), 0)
                      .toFixed(2)} h
                  </div>
                  <div className={`text-sm font-normal ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                    €{schedules
                      .reduce((total, s) => {
                        const employee = employees.find(e => e.id === s.employeeId);
                        const hourlyPay = employee?.hourlyPay || 0;
                        return total + (parseFloat(s.duration || 0) * hourlyPay * parseFloat(s.shiftRate || 1));
                      }, 0)
                      .toFixed(2)}
                  </div>
                </td>
              </tr>
            )}
            {employees.map((employee, index) => (
              <tr key={employee.id} className={`border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'} ${index === employees.length - 1 ? 'rounded-b-lg' : ''}`}>
                <td className="px-4 py-2">
                  <div className="inline-flex items-center gap-2">
                    <button 
  onClick={(e) => {
    e.stopPropagation();
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  }}
  className="font-medium hover:text-emerald-700 transition-colors duration-200"
>
  {employee.firstName} {employee.lastName}
</button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const weekDates = weekDays.map(day => format(day.fullDate, 'yyyy-MM-dd'));
                        weekDates.forEach(async (date) => {
                          if (employee.mondayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'monday') {
                            const shift = shifts.find(s => s.id === employee.mondayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                          if (employee.tuesdayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'tuesday') {
                            const shift = shifts.find(s => s.id === employee.tuesdayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                          if (employee.wednesdayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'wednesday') {
                            const shift = shifts.find(s => s.id === employee.wednesdayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                          if (employee.thursdayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'thursday') {
                            const shift = shifts.find(s => s.id === employee.thursdayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                          if (employee.fridayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'friday') {
                            const shift = shifts.find(s => s.id === employee.fridayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                          if (employee.saturdayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'saturday') {
                            const shift = shifts.find(s => s.id === employee.saturdayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                          if (employee.sundayShiftId && format(new Date(date), 'EEEE').toLowerCase() === 'sunday') {
                            const shift = shifts.find(s => s.id === employee.sundayShiftId);
                            if (shift) await applyPreDefinedShift(employee, date, shift);
                          }
                        });
                        fetchData();
                      }}
                      className={`p-1 rounded-lg flex items-center gap-1 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700'}`}
                      title="Create pre-defined shifts"
                    >
                      <div className="flex items-center">
                        <PlusIcon className="h-4 w-4 text-emerald-500" />
                        <CalendarIcon className="h-4 w-4 text-emerald-500" />
                      </div>
                    </button>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {employee.Outlet?.name && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${darkMode ? 'bg-violet-900/50 text-violet-200' : 'bg-violet-100 text-violet-800'}`}>
                        {employee.Outlet.name}
                      </span>
                    )}
                    {employee.Section?.name && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-normal ${darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        {employee.Section.name}
                      </span>
                    )}
                  </div>
                </td>
                {weekDays.map((day) => {
                  const schedule = getScheduleForDay(employee, day.fullDate);
                  return (
                    <td
                      key={day.date}
                      className={`relative w-38 h-10 px-2 py-2 text-center cursor-pointer ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-100/50' } group rounded-lg ${copyMode ? 'hover:bg-blue-100 dark:hover:bg-blue-900' : ''} ${copyMode && sourceSchedule?.id === schedule?.id ? 'bg-emerald-200/20 dark:bg-blue-900' : ''}`}
                      onClick={() => handleScheduleClick(employee, day.fullDate)}
                      style={schedule?.color ? { 
                        position: 'relative',
                        overflow: 'hidden'
                      } : {}}
                    >
                      {schedule?.color && (
                        <div 
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            background: schedule.color,
                            borderRadius: '4px 0 0 4px',
                            transform: 'perspective(9px) rotateY(-50deg)',
                            transformOrigin: 'left center',
                            boxShadow: `0 0 10px 0 ${schedule.color}70`
                          }}
                        />
                      )}
                      <div className="font-medium">{formatScheduleTime(schedule)}</div>
                      <div className="text-sm text-slate-500">{formatBreak(schedule)}</div>
                      <div className="text-m font-medium text-emerald-500">{formatDuration(schedule)}</div>
                      {schedule && (
                        <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this schedule?')) {
                                deleteSchedule(schedule.id)
                                  .then(() => fetchData())
                                  .catch(error => console.error('Error deleting schedule:', error));
                              }
                            }}
                            className={`p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                          >
                            <TrashIcon className={'h-4 w-4 text-red-500'}
                           title="Delete Schedule"/>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateClick(schedule);
                            }}
                            className={`p-1 rounded-full ${copyMode && sourceSchedule?.id === schedule.id ? 'bg-blue-200 dark:bg-blue-800' : 'hover:bg-slate-200 dark:hover:bg-slate-600'} ${!copyMode ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} transition-opacity duration-200`}
                          >
                            <DocumentDuplicateIcon className={`h-4 w-4 ${copyMode && sourceSchedule?.id === schedule.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} 
                            title="Copy Schedule"/>
                          </button>
                        </div>
                      )}
                      {schedule && parseFloat(schedule.shiftRate) !== 1 && (
                        <div className="absolute top-1 right-1">
                          <span className={`inline-flex items-center justify-center h-5 w-auto min-w-5 px-1 rounded text-xs font-medium ${darkMode ? 'bg-red-500/60 text-slate-200' : 'bg-red-200 text-slate-700'}`}>
                            {parseFloat(schedule.shiftRate).toFixed(1).replace(/.0$/, '')}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
                {!areTotalsCollapsed && (
                  <td className={`px-4 py-2 text-center font-medium text-emerald-500 w-24 ${darkMode ? 'bg-emerald-800/20' : 'bg-emerald-200/20'}`}>
                    <div></div>
                    <div>
                      {schedules
                        .filter(s => s.employeeId === employee.id)
                        .reduce((total, s) => total + parseFloat(s.duration || 0), 0)
                        .toFixed(2)} h
                    </div>
                    <div className={`text-sm font-normal ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                      €{schedules
                        .filter(s => s.employeeId === employee.id)
                        .reduce((total, s) => total + (parseFloat(s.duration || 0) * (employee.hourlyPay || 0) * parseFloat(s.shiftRate || 1)), 0)
                        .toFixed(2)}
                    </div>
                  </td>
                )}
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {/* Send Schedule Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md rounded-lg shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Send Schedule by:
              </h2>
              <button 
                onClick={() => setIsSendModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                <XMarkIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSendOptions(prev => ({ ...prev, email: !prev.email }))}
                className={`w-full p-3 rounded-lg flex items-center justify-center transition-colors duration-200 ${sendOptions.email 
                  ? 'bg-emerald-500 text-white' 
                  : `${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`
                }`}
              >
                Email
              </button>
              
              <button
                onClick={() => setSendOptions(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                className={`w-full p-3 rounded-lg flex items-center justify-center transition-colors duration-200 ${sendOptions.whatsapp 
                  ? 'bg-emerald-500 text-white' 
                  : `${darkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`
                }`}
              >
                WhatsApp
              </button>
            </div>
            
            <div className="flex items-center justify-center mb-4">
              <label className={`flex items-center cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
    type="checkbox"
    checked={sendOptions.updatedOnly}
    onChange={() => setSendOptions(prev => ({ ...prev, updatedOnly: !prev.updatedOnly }))}
    className={`mr-2 h-5 w-5 rounded border border-slate-300 dark:border-slate-600 
                appearance-none bg-white dark:bg-slate-700 
                checked:bg-slate-700 checked:border-slate-700 
                relative transition duration-150 ease-in-out 
                before:content-['✓'] before:absolute before:text-white before:top-0.1 before:left-[5px] before:text-sm before:scale-100 
                checked:before:opacity-100 before:opacity-0`}
  />
  <span>Updated Schedules only</span>
              </label>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => {
                  // Here you would add the API call to send the schedule
                  setIsSendModalOpen(false);
                  // Reset options
                  setSendOptions({ email: false, whatsapp: false });
                }}
                className={`px-4 py-2 rounded-lg cursor-pointer ${darkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white transition-colors duration-200`}
                disabled={!sendOptions.email && !sendOptions.whatsapp}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Schedule Modal */}
      {isEmployeeModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className={`w-full max-w-md rounded-lg shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {selectedEmployee?.firstName} {selectedEmployee?.lastName} - {selectedEmployee?.employeeNumber}
        </h2>
        <button 
          onClick={() => setIsEmployeeModalOpen(false)}
          className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
        >
          <XMarkIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mobile</p>
          <p className="font-medium">{selectedEmployee?.mobile || 'N/A'}</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email</p>
          <p className="font-medium">{selectedEmployee?.email || 'N/A'}</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Outlet</p>
          <p className="font-medium">{selectedEmployee?.Outlet?.name || 'N/A'}</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Section</p>
          <p className="font-medium">{selectedEmployee?.Section?.name || 'N/A'}</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>ARC Number</p>
          <p className="font-medium">{selectedEmployee?.arcNumber || 'N/A'}</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Payroll Number</p>
          <p className="font-medium">{selectedEmployee?.payrollNumber || 'N/A'}</p>
        </div>
        {selectedEmployee?.hourlyPay && (
          <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hourly Pay</p>
            <p className="font-medium">€{selectedEmployee.hourlyPay}</p>
          </div>
        )}
        {selectedEmployee?.monthlyPay && (
          <div>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monthly Pay</p>
            <p className="font-medium">€{selectedEmployee.monthlyPay}</p>
          </div>
        )}
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Type</p>
          <p className="font-medium">{selectedEmployee?.type || 'N/A'}</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Annual Leave</p>
          <p className="font-medium">{selectedEmployee?.annualLeaveRemaining || '0'} days left</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sick Days</p>
          <p className="font-medium">{selectedEmployee?.sickDays || '0'} days</p>
        </div>
        <div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Off Days</p>
          <p className="font-medium">{selectedEmployee?.offDays || '0'} days</p>
        </div>
      </div>
    </div>
  </div>
)}

{isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-4xl rounded-lg shadow-lg ${darkMode ? 'bg-slate-800' : 'bg-white'} p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                {selectedEmployee ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}` : 'New Schedule'}
              </h2>
              <div className="flex items-center">
                <label className={`mr-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}></label>
                <div className="flex gap-1">
                  {colorOptions.map((color, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-6 h-6 rounded-full border ${darkMode ? 'border-slate-600' : 'border-slate-300'} ${formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{
                        backgroundColor: color || (darkMode ? '#1e293b' : '#ffffff'),
                        cursor: 'pointer'
                      }}
                      title={color ? '' : 'No color'}
                    >
                      {!color && <XMarkIcon className="h-4 w-4 mx-auto text-slate-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveSchedule(); }} className="space-y-4">
              <div className="grid grid-cols-8 gap-4">
                <div className="col-span-2">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Shift Type
                  </label>
                  <select

                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                  >

                  </select>
                </div>

                <div className="col-span-3">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Shift Template
                  </label>
                  <select
                    value={formData.selectedShiftId || ''}
                    onChange={(e) => handleShiftSelect(e.target.value)}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                  >
                    <option value="">Custom</option>
                    {shifts.map(shift => (
                      <option key={shift.id} value={shift.id}>{shift.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-4">
              <div className="col-span-2">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fixed/Open
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isOpenShift: !formData.isOpenShift })}
                    className={`w-full p-2 rounded border transition-colors duration-200 ${formData.isOpenShift
                      ? 'bg-slate-600 text-white border-slate-600'
                      : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'}`}
                  >
                    {formData.isOpenShift ? 'Open' : 'Fixed'}
                  </button>
                </div>
                <div className="col-span-2">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value;
                      const duration = calculateDuration(newStartTime, formData.endTime);
                      setFormData({
                        ...formData,
                        startTime: newStartTime,
                        duration: duration
                      });
                    }}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} ${formData.isOpenShift ? 'opacity-50' : ''}`}
                    required={!formData.isOpenShift}
                    disabled={formData.isOpenShift}
                  />
                </div>

                <div className="col-span-2">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => {
                      const newEndTime = e.target.value;
                      const duration = calculateDuration(formData.startTime, newEndTime);
                      setFormData({
                        ...formData,
                        endTime: newEndTime,
                        duration: duration
                      });
                    }}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} ${formData.isOpenShift ? 'opacity-50' : ''}`}
                    required={!formData.isOpenShift}
                    disabled={formData.isOpenShift}
                  />
                </div>

                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Rate
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.shiftRate}
                    onChange={(e) => setFormData({ ...formData, shiftRate: e.target.value })}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Overtime Rate
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.overtimeRate}
                    onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
                    className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                    required
                  />
                </div>

              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Breaks (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBreak}
                    className={`flex items-center px-2 py-1 rounded text-sm ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" /> Add Break
                  </button>
                </div>

                {formData.breaks.map((breakItem, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 mt-4 items-end">
                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Break {index + 1} Start
                      </label>
                      <input
                        type="time"
                        value={formData.isOpenShift ? '00:00' : (breakItem.startTime || '')}
                        onChange={(e) => {
                          const updatedBreaks = [...formData.breaks];
                          updatedBreaks[index] = {
                            ...breakItem,
                            startTime: e.target.value,
                            duration: !formData.isOpenShift ? calculateDuration(e.target.value, breakItem.endTime) : breakItem.duration
                          };
                          setFormData({ ...formData, breaks: updatedBreaks });
                        }}
                        className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} ${formData.isOpenShift ? 'opacity-50' : ''}`}
                        disabled={formData.isOpenShift}
                      />
                    </div>

                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Break {index + 1} End
                      </label>
                      <input
                        type="time"
                        value={formData.isOpenShift ? '00:00' : (breakItem.endTime || '')}
                        onChange={(e) => {
                          const updatedBreaks = [...formData.breaks];
                          updatedBreaks[index] = {
                            ...breakItem,
                            endTime: e.target.value,
                            duration: !formData.isOpenShift ? calculateDuration(breakItem.startTime, e.target.value) : breakItem.duration
                          };
                          setFormData({ ...formData, breaks: updatedBreaks });
                        }}
                        className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'} ${formData.isOpenShift ? 'opacity-50' : ''}`}
                        disabled={formData.isOpenShift}
                      />
                    </div>

                    <div>
                      <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Duration {formData.isOpenShift ? '(minutes)' : '(hours)'}
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={breakItem.duration ? (formData.isOpenShift ? Math.round(breakItem.duration * 60) : breakItem.duration) : ''}
                        onChange={(e) => {
                          handleBreakChange(index, 'duration', e.target.value);
                        }}
                        className={`w-full p-2 rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700'}`}
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className={`block mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Paid Break
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedBreaks = [...formData.breaks];
                          updatedBreaks[index] = { ...breakItem, paid: !breakItem.paid };
                          setFormData({ ...formData, breaks: updatedBreaks });
                        }}
                        className={`w-full p-2 rounded border transition-colors duration-200 ${breakItem.paid
                          ? 'bg-slate-600 text-white border-slate-600'
                          : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'}`}
                      >
                        {breakItem.paid ? 'Paid' : 'Unpaid'}
                      </button>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveBreak(index)}
                        className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700`}
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}

              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedEmployee(null);
                    setFormData({
                      date: '',
                      startTime: '',
                      endTime: '',
                      shiftRate: '0.00',
                      breaks: [],
                      isOpenShift: false,
                      duration: '',
                      color: ''
                    });
                  }}
                  className={`px-4 py-2 rounded-lg text-sm text-medium transition-colors duration-200 ${darkMode ? 'bg-slate-200 hover:bg-slate-50 text-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-100'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg text-sm text-medium transition-colors duration-200 ${darkMode ? 'bg-slate-600 hover:bg-slate-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white border border-slate-600'}`}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;

const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  
  let startStr = start;
  let endStr = end;
  
  if (typeof start === 'string' && start.includes(':')) {
    const startParts = start.split(':');
    if (startParts.length >= 2) {
      startStr = `${startParts[0].padStart(2, '0')}:${startParts[1].padStart(2, '0')}`;
    }
  }
  
  if (typeof end === 'string' && end.includes(':')) {
    const endParts = end.split(':');
    if (endParts.length >= 2) {
      endStr = `${endParts[0].padStart(2, '0')}:${endParts[1].padStart(2, '0')}`;
    }
  }
  
  const startTime = new Date(`2000-01-01T${startStr}`);
  let endTime = new Date(`2000-01-01T${endStr}`);
  
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    console.error('Invalid time format:', start, end);
    return 0;
  }
  
  if (endTime < startTime) {
    endTime = new Date(`2000-01-02T${endStr}`);
  }
  
  const diff = endTime - startTime;
  // Convert milliseconds to hours and round to 2 decimal places
  // Using toFixed(2) to ensure we always have 2 decimal places, then parseFloat to convert back to number
  return parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
};





