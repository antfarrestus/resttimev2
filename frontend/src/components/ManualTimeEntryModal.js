import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import { XMarkIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

const ManualTimeEntryModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  darkMode, 
  employees, 
  sections, 
  selectedDate,
  isDateRange,
  selectedOutlet
}) => {
  const [formData, setFormData] = useState({
    date: selectedDate || new Date(),
    employeeId: '',
    sectionId: '',
    clockIn: '',
    clockInNote: '',
    clockOut: '',
    clockOutNote: '',
    breaks: []
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [devices, setDevices] = useState([]);
  
  // Reset form data when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: selectedDate || new Date(),
        employeeId: '',
        sectionId: '',
        clockIn: '',
        clockInNote: '',
        clockOut: '',
        clockOutNote: '',
        breaks: []
      });
      setSearchTerm('');
    }
  }, [isOpen, selectedDate]);

  // Filter employees based on search term
  useEffect(() => {
    if (!employees) return;
    
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }
    
    const filtered = employees.filter(employee => {
      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
      const employeeNumber = employee.employeeNumber?.toString().toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      return fullName.includes(searchLower) || employeeNumber.includes(searchLower);
    });
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm]);
  
  // Update section when employee changes
  useEffect(() => {
    if (!formData.employeeId || !employees) return;
    
    const selectedEmployee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    if (selectedEmployee && selectedEmployee.sectionId) {
      setFormData(prev => ({
        ...prev,
        sectionId: selectedEmployee.sectionId
      }));
    }
  }, [formData.employeeId, employees]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };
  
  const handleEmployeeSelect = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      employeeId: parseInt(employeeId)
    }));
    setSearchTerm('');
  };
  
  const handleBreakChange = (index, field, value) => {
    const updatedBreaks = [...formData.breaks];
    updatedBreaks[index] = {
      ...updatedBreaks[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      breaks: updatedBreaks
    }));
  };
  
  const addBreak = () => {
    if (formData.breaks.length >= 3) return; // Maximum 3 breaks
    
    setFormData(prev => ({
      ...prev,
      breaks: [...prev.breaks, { startTime: '', endTime: '', note: '' }]
    }));
  };
  
  const removeBreak = (index) => {
    const updatedBreaks = formData.breaks.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      breaks: updatedBreaks
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get the selected employee to access their companyId
    const selectedEmployee = employees.find(emp => emp.id === parseInt(formData.employeeId));
    
    // Use the selectedOutlet from Timesheet page instead of employee's outlet
    const outletId = selectedOutlet?.id || null;
    
    const highestDeviceId = devices
  .filter(device => device.outletId === outletId)
  .reduce((maxId, device) => Math.max(maxId, device.id), 0);

  // Format the data for API submission
  const formattedData = {
    date: format(formData.date, 'yyyy-MM-dd'),
    employeeId: parseInt(formData.employeeId),
    sectionId: parseInt(formData.sectionId),
    outletId: outletId,
    deviceId: highestDeviceId || 1, // fallback to 1 if none found
    companyId: selectedEmployee?.companyId,
    clockInTime: formData.clockIn ? `${format(formData.date, 'yyyy-MM-dd')}T${formData.clockIn}:00Z` : null,
    clockInNote: formData.clockInNote || null,
    clockOutTime: formData.clockOut ? `${format(formData.date, 'yyyy-MM-dd')}T${formData.clockOut}:00Z` : null,
    clockOutNote: formData.clockOutNote || null,
    clockType: 'manual',
    note: formData.note || ''
  };

    
    // Process breaks to match the TimeRecord model format
    if (formData.breaks && formData.breaks.length > 0) {
      // First break
      if (formData.breaks[0].startTime) {
        formattedData.breakStartTime = `${format(formData.date, 'yyyy-MM-dd')}T${formData.breaks[0].startTime}:00Z`;
        formattedData.breakStartNote = formData.breaks[0].note || null;
      }
      if (formData.breaks[0].endTime) {
        formattedData.breakEndTime = `${format(formData.date, 'yyyy-MM-dd')}T${formData.breaks[0].endTime}:00Z`;
        formattedData.breakEndNote = formData.breaks[0].note || null;
      }
      
      // Second break
      if (formData.breaks.length > 1 && formData.breaks[1].startTime) {
        formattedData.break2StartTime = `${format(formData.date, 'yyyy-MM-dd')}T${formData.breaks[1].startTime}:00Z`;
        formattedData.break2StartNote = formData.breaks[1].note || null;
      }
      if (formData.breaks.length > 1 && formData.breaks[1].endTime) {
        formattedData.break2EndTime = `${format(formData.date, 'yyyy-MM-dd')}T${formData.breaks[1].endTime}:00Z`;
        formattedData.break2EndNote = formData.breaks[1].note || null;
      }
      
      // Third break
      if (formData.breaks.length > 2 && formData.breaks[2].startTime) {
        formattedData.break3StartTime = `${format(formData.date, 'yyyy-MM-dd')}T${formData.breaks[2].startTime}:00Z`;
        formattedData.break3StartNote = formData.breaks[2].note || null;
      }
      if (formData.breaks.length > 2 && formData.breaks[2].endTime) {
        formattedData.break3EndTime = `${format(formData.date, 'yyyy-MM-dd')}T${formData.breaks[2].endTime}:00Z`;
        formattedData.break3EndNote = formData.breaks[2].note || null;
      }
    }
    
    // Remove the breaks array as it's not needed in the API
    delete formattedData.breaks;
    
    onSubmit(formattedData);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div
        className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full ${darkMode ? 'bg-slate-800' : 'bg-white'}`}
      >
          <div className={`${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-black'} px-4 pt-5 pb-4 sm:p-6 sm:pb-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Manual Time Entry</h3>
              <button
                onClick={onClose}
                className={`rounded-md p-1 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
  <div>
    <label className="block text-sm font-medium mb-1">Date</label>
    <DatePicker
      selected={formData.date}
      onChange={handleDateChange}
      dateFormat="dd/MM/yyyy"
      className={`w-full cursor-pointer p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
    />
  </div>

  {/* Empty column to balance layout */}
  <div></div>
</div>
              
              {/* Employee Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="mb-4">
  <label className="block text-sm font-medium mb-1">Employee</label>
  
  <div className="relative">
    <input
      type="text"
      value={
        formData.employeeId
          ? (() => {
              const emp = employees.find(emp => emp.id === parseInt(formData.employeeId));
              return emp ? `${emp.firstName} ${emp.lastName} (${emp.employeeNumber || 'No ID'})` : '';
            })()
          : searchTerm
      }
      onChange={(e) => {
        setFormData({ ...formData, employeeId: '' });
        setSearchTerm(e.target.value);
      }}
      placeholder="Search by name or number"
      className={`w-full p-2 pr-10 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
      readOnly={!!formData.employeeId}
    />
    
    {/* Clear button */}
    {formData.employeeId && (
      <button
        type="button"
        onClick={() => {
          setFormData({ ...formData, employeeId: '' });
          setSearchTerm('');
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
      >
        &times;
      </button>
    )}

    {/* Dropdown */}
    {searchTerm && !formData.employeeId && (
      <div className={`absolute z-10 w-full mt-1 rounded-md shadow-lg ${darkMode ? 'bg-slate-700' : 'bg-white'} max-h-60 overflow-auto`}>
        {filteredEmployees.length === 0 ? (
          <div className={`p-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>No employees found</div>
        ) : (
          filteredEmployees.map(employee => (
            <div
              key={employee.id}
              onClick={() => {
                handleEmployeeSelect(employee.id);
                setSearchTerm('');
              }}
              className={`p-2 cursor-pointer ${darkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-100'}`}
            >
              {employee.firstName} {employee.lastName} ({employee.employeeNumber || 'No ID'})
            </div>
            
          ))
        )}
      </div>
    )}
  </div>
</div>
              
              {/* Section Selection */}
<div>
                <label className="block text-sm font-medium mb-1">Section</label>
                <select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleInputChange}
                  className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                >
                  <option value="">Select Section</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
                </div>
              </div>
              
              {/* Clock In/Out Times + Notes - 4 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              {/* Clock In */}
              <div>
                <label className="block text-sm font-medium mb-1">Clock In Time</label>
                <input
                  type="time"
                  name="clockIn"
                  value={formData.clockIn}
                  onChange={handleInputChange}
                  required
                  className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Clock In Note</label>
                <input
                  type="text"
                  name="clockInNote"
                  value={formData.clockInNote}
                  onChange={handleInputChange}
                  placeholder="Note"
                  className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                />
              </div>

              {/* Clock Out */}
              <div>
                <label className="block text-sm font-medium mb-1">Clock Out Time</label>
                <input
                  type="time"
                  name="clockOut"
                  value={formData.clockOut}
                  onChange={handleInputChange}
                  className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Clock Out Note</label>
                <input
                  type="text"
                  name="clockOutNote"
                  value={formData.clockOutNote}
                  onChange={handleInputChange}
                  placeholder="Note"
                  className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                />
              </div>
            </div>
              
              {/* Breaks */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Breaks</label>
                  <button
                    type="button"
                    onClick={addBreak}
                    className={`p-1 rounded-full ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.breaks.map((breakItem, index) => (
                  <div key={index} className="mb-2 p-3 rounded-md border border-dashed border-gray-400">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Break {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeBreak(index)}
                        className={`p-1 rounded-full ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs mb-1">Start Time</label>
                        <input
                          type="time"
                          value={breakItem.startTime}
                          onChange={(e) => handleBreakChange(index, 'startTime', e.target.value)}
                          className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1">End Time</label>
                        <input
                          type="time"
                          value={breakItem.endTime}
                          onChange={(e) => handleBreakChange(index, 'endTime', e.target.value)}
                          className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                        />
                      </div>
                      <div>
                      <label className="block text-xs mb-1">Note</label>
                      <input
                        type="text"
                        value={breakItem.note}
                        onChange={(e) => handleBreakChange(index, 'note', e.target.value)}
                        placeholder="Note"
                        className={`w-full p-2 rounded-md ${darkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-black border-gray-300'} border`}
                      />
                    </div>
                    </div>
                  </div>
                ))}
              </div>
              
              
              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  className={`inline-flex justify-center w-48 rounded-md border border-transparent shadow-sm px-4 py-2 ${darkMode ? 'bg-slate-500 hover:bg-slate-400' : 'bg-slate-600 hover:bg-slate-700'} text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm`}
                >
                  Create Time Record
                </button>
              </div>

              
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualTimeEntryModal;