import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { getShifts, createShift, updateShift, deleteShift } from '../services/api';

export default function Shifts({ darkMode }) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [shifts, setShifts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    shiftRate: '1',
    breaks: [],
    isOpenShift: false,
    manualDuration: ''
  });

  useEffect(() => {
    if (selectedCompany) {
      fetchShifts();
      // Set initial sort field and direction
      setSortField('name');
      setSortDirection('asc');
    } else {
      setShifts([]);
    }
  }, [selectedCompany]);

  const fetchShifts = async () => {
    try {
      const data = await getShifts(selectedCompany.id);
      setShifts(data || []);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      setShifts([]);
    }
  };

  const handleCloneShift = (shift) => {
    if (!selectedCompany) return;
    
    // Create a copy of the shift data with a new name
    const breaks = [];
    for (let i = 1; i <= 3; i++) {
      if (shift[`break${i}start`]) {
        breaks.push({
          startTime: formatTime(shift[`break${i}start`]),
          endTime: formatTime(shift[`break${i}end`]),
          duration: shift[`break${i}duration`],
          paid: shift[`break${i}paid`] === true
        });
      }
    }

    // Set form data with cloned shift information
    setFormData({
      name: `${shift.name} (Copy)`,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      shiftRate: shift.shiftRate.toString(),
      breaks,
      isOpenShift: shift.isOpenShift,
      manualDuration: shift.duration.toString()
    });

    // Open the modal with no editing ID (creates new shift)
    setEditingId(null);
    setIsModalOpen(true);
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    
    // Ensure we have valid time strings in HH:MM format
    let startStr = start;
    let endStr = end;
    
    // If the time already includes colons, make sure it's in the right format
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
    
    // Create date objects for comparison
    const startTime = new Date(`2000-01-01T${startStr}`);
    let endTime = new Date(`2000-01-01T${endStr}`);
    
    // Check if dates are valid before calculating
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      console.error('Invalid time format:', start, end);
      return 0;
    }
    
    // Handle night shifts that span across midnight
    // If end time is earlier than start time, add a day to end time
    if (endTime < startTime) {
      endTime = new Date(`2000-01-02T${endStr}`);
    }
    
    const diff = endTime - startTime;
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Convert to hours with 2 decimal places
  };

  const calculateBreakDuration = (start, end) => {
    // If we have start and end times, use calculateDuration
    if (start && end) {
      return calculateDuration(start, end);
    }
    // For direct minute input (for open shifts), simply divide by 60 to get hours
    return (minutes) => parseFloat((minutes / 60).toFixed(2));
  };

  const handleAddBreak = () => {
    if (formData.breaks.length < 3) {
      setFormData({
        ...formData,
        breaks: [...formData.breaks, { startTime: '', endTime: '', duration: 0, paid: false }]
      });
    }
  };

  const handleRemoveBreak = (index) => {
    const newBreaks = formData.breaks.filter((_, i) => i !== index);
    setFormData({ ...formData, breaks: newBreaks });
  };

  const handleBreakChange = (index, field, value) => {
    const newBreaks = [...formData.breaks];
    newBreaks[index] = { ...newBreaks[index], [field]: value };
    
    // For open shifts, duration can be set directly
    // For regular shifts, calculate duration from start and end times
    if (formData.isOpenShift && field === 'duration') {
      newBreaks[index].duration = value;
    } else if (!formData.isOpenShift && (field === 'startTime' || field === 'endTime')) {
      const duration = calculateBreakDuration(newBreaks[index].startTime, newBreaks[index].endTime);
      newBreaks[index].duration = duration;
    }
    
    setFormData({ ...formData, breaks: newBreaks });
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    if (!selectedCompany) return;

    let duration;
    if (formData.isOpenShift) {
      duration = parseFloat(formData.manualDuration);
    } else {
      duration = calculateDuration(formData.startTime, formData.endTime);
    }
    
    // Calculate total break duration, only counting unpaid breaks
    const totalBreakDuration = formData.breaks.reduce((acc, breakItem) => {
      // Only deduct unpaid breaks from the total duration
      return acc + (breakItem.paid ? 0 : breakItem.duration);
    }, 0);

    const shiftData = {
      name: formData.name,
      startTime: formData.isOpenShift ? null : formData.startTime,
      endTime: formData.isOpenShift ? null : formData.endTime,
      // Always deduct unpaid breaks from duration, regardless of shift type
      duration: duration - totalBreakDuration,
      shiftRate: parseFloat(formData.shiftRate),
      isOpenShift: formData.isOpenShift
    };

    // Initialize all break fields as null to ensure removed breaks are cleared
    // But ensure paid flags are set to false instead of null since they're non-nullable
    for (let i = 1; i <= 3; i++) {
      shiftData[`break${i}start`] = null;
      shiftData[`break${i}end`] = null;
      shiftData[`break${i}duration`] = null;
      shiftData[`break${i}paid`] = false; // Set to false instead of null
    }

    // Only set values for breaks that exist in the form
    formData.breaks.forEach((breakItem, index) => {
      shiftData[`break${index + 1}start`] = breakItem.startTime;
      shiftData[`break${index + 1}end`] = breakItem.endTime;
      shiftData[`break${index + 1}duration`] = breakItem.duration;
      shiftData[`break${index + 1}paid`] = breakItem.paid || false;
    });

    try {
      await createShift(selectedCompany.id, shiftData);
      await fetchShifts();
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
        shiftRate: '1',
        breaks: [],
        isOpenShift: false,
        manualDuration: '8'
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating shift:', error);
    }
  };

  const handleEditStart = (shift) => {
    setEditingId(shift.id);
    const breaks = [];
    for (let i = 1; i <= 3; i++) {
      if (shift[`break${i}start`]) {
        breaks.push({
          startTime: formatTime(shift[`break${i}start`]),
          endTime: formatTime(shift[`break${i}end`]),
          duration: shift[`break${i}duration`],
          paid: shift[`break${i}paid`] === true
        });
      }
    }
    setFormData({
      name: shift.name,
      startTime: formatTime(shift.startTime),
      endTime: formatTime(shift.endTime),
      shiftRate: shift.shiftRate.toString(),
      breaks,
      isOpenShift: shift.isOpenShift,
      manualDuration: shift.duration.toString()
    });
  };

  const handleEditSave = async (id) => {
    if (!selectedCompany) return;

    let duration;
    if (formData.isOpenShift) {
      duration = parseFloat(formData.manualDuration);
    } else {
      duration = calculateDuration(formData.startTime, formData.endTime);
    }
    
    // Calculate total break duration, only counting unpaid breaks
    const totalBreakDuration = formData.breaks.reduce((acc, breakItem) => {
      // Only deduct unpaid breaks from the total duration
      return acc + (breakItem.paid ? 0 : breakItem.duration);
    }, 0);

    const shiftData = {
      name: formData.name,
      startTime: formData.isOpenShift ? null : formData.startTime,
      endTime: formData.isOpenShift ? null : formData.endTime,
      // Always deduct unpaid breaks from duration, regardless of shift type
      duration: duration - totalBreakDuration,
      shiftRate: parseFloat(formData.shiftRate),
      isOpenShift: formData.isOpenShift
    };

    // Initialize all break fields as null to ensure removed breaks are cleared
    // But ensure paid flags are set to false instead of null since they're non-nullable
    for (let i = 1; i <= 3; i++) {
      shiftData[`break${i}start`] = null;
      shiftData[`break${i}end`] = null;
      shiftData[`break${i}duration`] = null;
      shiftData[`break${i}paid`] = false; // Set to false instead of null
    }

    // Only set values for breaks that exist in the form
    formData.breaks.forEach((breakItem, index) => {
      shiftData[`break${index + 1}start`] = breakItem.startTime;
      shiftData[`break${index + 1}end`] = breakItem.endTime;
      shiftData[`break${index + 1}duration`] = breakItem.duration;
      shiftData[`break${index + 1}paid`] = breakItem.paid || false;
    });

    try {
      await updateShift(selectedCompany.id, id, shiftData);
      await fetchShifts();
      setEditingId(null);
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
        shiftRate: '1',
        breaks: [],
        isOpenShift: false,
        manualDuration: '8'
      });
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const handleToggleActive = async (id) => {
    if (!selectedCompany) return;
    const shift = shifts.find(s => s.id === id);
    try {
      await updateShift(selectedCompany.id, id, { active: !shift.active });
      await fetchShifts();
    } catch (error) {
      console.error('Error toggling shift status:', error);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortedShifts = () => {
    if (!sortField) return shifts;
    
    return [...shifts].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle special cases for formatting
      if (sortField === 'startTime' || sortField === 'endTime') {
        if (a.isOpenShift) return sortDirection === 'asc' ? 1 : -1;
        if (b.isOpenShift) return sortDirection === 'asc' ? -1 : 1;
        aValue = aValue || '';
        bValue = bValue || '';
      } else if (sortField === 'duration') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleDelete = async (id) => {
    if (!selectedCompany) return;
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await deleteShift(selectedCompany.id, id);
        await fetchShifts();
      } catch (error) {
        console.error('Error deleting shift:', error);
      }
    }
  };

  // Format time to show only hours and minutes (hh:mm)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      // Check if the timeString includes a date part (contains 'T' or has date format)
      if (timeString.includes('T') || timeString.includes('-')) {
        // Extract time part directly without timezone conversion
        if (timeString.includes('T')) {
          const timePart = timeString.split('T')[1];
          const timeComponents = timePart.split(':');
          if (timeComponents.length >= 2) {
            return `${timeComponents[0]}:${timeComponents[1]}`;
          }
        }
      }
      
      // For time-only strings (HH:MM:SS format)
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(2, '0')}`;
      }
      
      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return '';
    }
  };

  // Format duration to show as hours:minutes instead of decimal hours
  const formatDuration = (durationInHours) => {
    if (durationInHours === null || durationInHours === undefined) return '';
    
    const hours = Math.floor(durationInHours);
    const minutes = Math.round((durationInHours - hours) * 60);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Format break duration to show in minutes instead of decimal hours
  const formatBreakDuration = (durationInHours) => {
    if (durationInHours === null || durationInHours === undefined) return '';
    
    const minutes = Math.round(durationInHours * 60);
    return `${minutes}m`;
  };

  // Check if any shift has breaks defined
  const hasAnyBreaks = () => {
    return shifts.some(shift => {
      for (let i = 1; i <= 3; i++) {
        if (shift[`break${i}start`] && shift[`break${i}end`]) {
          return true;
        }
      }
      return false;
    });
  };

  // Format break information for display in the table
  const formatBreaksForDisplay = (shift) => {
    const breaks = [];
    
    for (let i = 1; i <= 3; i++) {
      const duration = shift[`break${i}duration`];
      // Skip breaks with null or zero duration
      if (!duration || duration === 0) continue;
      
      if (shift.isOpenShift) {
        // For open shifts, only show duration
        breaks.push(formatBreakDuration(duration));
      } else if (shift[`break${i}start`] && shift[`break${i}end`]) {
        // For regular shifts, show start-end times and duration
        const startTime = formatTime(shift[`break${i}start`]);
        const endTime = formatTime(shift[`break${i}end`]);
        breaks.push(`${startTime}-${endTime} (${formatBreakDuration(duration)})`);
      }
    }
    
    return breaks.join(', ');
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Please select a company first.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Shifts</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Shift
        </button>
      </div>

      {/* Shifts Table */}
      <div className="overflow-x-auto rounded-lg border dark:border-slate-700/50 border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">

          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/30"
                onClick={() => handleSort('name')}
              >
                Name
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/30"
                onClick={() => handleSort('startTime')}
              >
                Start Time
                {sortField === 'startTime' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/30"
                onClick={() => handleSort('endTime')}
              >
                End Time
                {sortField === 'endTime' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              {hasAnyBreaks() && (
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Breaks</th>
              )}
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/30"
                onClick={() => handleSort('duration')}
              >
                Duration
                {sortField === 'duration' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rate</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white/80 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700/50">
            {getSortedShifts().map((shift) => (
              <tr key={shift.id} className="hover:dark:bg-slate-700/30 hover:bg-slate-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                  {shift.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center dark:text-slate-300 text-slate-900">
                  {shift.isOpenShift ? '—' : formatTime(shift.startTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center dark:text-slate-300 text-slate-900">
                  {shift.isOpenShift ? '—' : formatTime(shift.endTime)}
                </td>
                {hasAnyBreaks() && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center dark:text-slate-300 text-slate-900">
                    {formatBreaksForDisplay(shift)}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center dark:text-slate-300 text-slate-900">
                  {formatDuration(shift.duration)}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center dark:text-slate-300 text-slate-900">
                  {shift.shiftRate}x
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <button
                    onClick={() => handleToggleActive(shift.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${shift.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                  >
                    {shift.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleCloneShift(shift)}
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                      title="Clone shift"
                    >
                      <DocumentDuplicateIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditStart(shift)}
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                      title="Edit shift"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(shift.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                      title="Delete shift"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Shift Modal */}
      {(isModalOpen || editingId !== null) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">
              {editingId !== null ? 'Edit Shift' : 'Create New Shift'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingId !== null) {
                handleEditSave(editingId);
              } else {
                handleCreateShift(e);
              }
            }}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Shift Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isOpenShift: !formData.isOpenShift })}
                      className={`px-3 py-2 rounded-lg border transition-colors duration-200 ${formData.isOpenShift 
                        ? 'bg-slate-600 text-white border-slate-600 dark:bg-slate-600 dark:border-slate-500' 
                        : 'bg-white text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'}`}
                    >
                      Open Shift
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 ${formData.isOpenShift ? 'opacity-50' : ''}`}
                      required={!formData.isOpenShift}
                      disabled={formData.isOpenShift}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 ${formData.isOpenShift ? 'opacity-50' : ''}`}
                      required={!formData.isOpenShift}
                      disabled={formData.isOpenShift}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Duration
                    </label>
                    {formData.isOpenShift ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={formData.manualDuration}
                        onChange={(e) => setFormData({ ...formData, manualDuration: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        value={`${calculateDuration(formData.startTime, formData.endTime)}h`}
                        className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        disabled
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Rate
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.shiftRate}
                      onChange={(e) => setFormData({ ...formData, shiftRate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>
                </div>
                
                {/* Breaks Section */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700">
                      Breaks (Optional)
                    </label>
                    {formData.breaks.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddBreak}
                        className="px-2 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 transition-colors duration-200"
                      >
                        + Add Break
                      </button>
                    )}
                  </div>
                  
                  {formData.breaks.map((breakItem, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 mb-3 p-3 border dark:border-slate-600 border-slate-300 rounded-lg bg-white dark:bg-slate-800/80 shadow-sm">
                      <div className="col-span-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium dark:text-slate-400 text-slate-600 mb-1">
                              Start
                            </label>
                            <input
                              type="time"
                              value={breakItem.startTime}
                              onChange={(e) => handleBreakChange(index, 'startTime', e.target.value)}
                              className={`w-full px-2 py-1 text-sm rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 ${formData.isOpenShift ? 'opacity-50' : ''}`}
                              disabled={formData.isOpenShift}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium dark:text-slate-400 text-slate-600 mb-1">
                              End
                            </label>
                            <input
                              type="time"
                              value={breakItem.endTime}
                              onChange={(e) => handleBreakChange(index, 'endTime', e.target.value)}
                              className={`w-full px-2 py-1 text-sm rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 ${formData.isOpenShift ? 'opacity-50' : ''}`}
                              disabled={formData.isOpenShift}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-xs font-medium dark:text-slate-400 text-slate-600 mb-1">
                          Duration
                        </label>
                        <div className="flex items-center">
                          {formData.isOpenShift ? (
                            <input
                              type="number"
                              min="5"
                              step="5"
                              value={breakItem.duration ? Math.round(breakItem.duration * 60) : ''}
                              onChange={(e) => handleBreakChange(index, 'duration', e.target.value / 60)}
                              className="w-20 px-2 py-1 text-sm rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                              placeholder="mins"
                            />
                          ) : (
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-700 px-3 py-1 rounded border dark:border-slate-600 border-slate-200">
                              {formatBreakDuration(breakItem.duration)}
                            </span>
                          )}
                          <div className="ml-3 flex items-center bg-slate-50 dark:bg-slate-700/50 px-3 py-1 rounded border dark:border-slate-600 border-slate-200">
                            <input
                              type="checkbox"
                              id={`break-paid-${index}`}
                              checked={breakItem.paid || false}
                              onChange={(e) => handleBreakChange(index, 'paid', e.target.checked)}
                              className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded dark:border-slate-600 dark:bg-slate-700"
                            />
                            <label htmlFor={`break-paid-${index}`} className="ml-2 block text-xs font-medium dark:text-slate-300 text-slate-700">
                              Paid Break
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveBreak(index)}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-full"
                          title="Remove break"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setFormData({
                      name: '',
                      startTime: '',
                      endTime: '',
                      shiftRate: '1',
                      breaks: [],
                      isOpenShift: false,
                      manualDuration: '8'
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors duration-200"
                >
                  {editingId !== null ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}