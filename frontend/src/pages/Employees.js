import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, PencilSquareIcon, TrashIcon, DocumentDuplicateIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getSections, getOutlets, getShifts } from '../services/api';
import { useCompany } from '../contexts/CompanyContext';

export default function Employees({ darkMode }) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [sections, setSections] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);
  const [localSelectedCompany, setLocalSelectedCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'employeeNumber', direction: 'desc' });
  const [filters, setFilters] = useState({
    type: '',
    section: '',
    outlet: ''
  });
  const [activeFilter, setActiveFilter] = useState(null);

  const sortData = (data, key) => {
    if (!key) return data;

    return [...data].sort((a, b) => {
      let aValue = key === 'name' ? `${a.firstName} ${a.lastName || ''}`.trim() : a[key];
      let bValue = key === 'name' ? `${b.firstName} ${b.lastName || ''}`.trim() : b[key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to numbers for numeric comparisons
      if (['employeeNumber', 'hourlyPay', 'monthlyPay', 'monthlyHours'].includes(key)) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      // Convert to lowercase for string comparison
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
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
      if (key === 'type') {
        values.add(item.type);
      } else if (key === 'section') {
        values.add(item.Section?.name);
      } else if (key === 'outlet') {
        values.add(item.Outlet?.name);
      }
    });
    return Array.from(values).filter(Boolean).sort();
  };

  const FilterDropdown = ({ type, values }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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


  const currentSections = sections.filter(section => section.active);
  const currentOutlets = outlets.filter(outlet => outlet.active);

  const [newEmployeeData, setNewEmployeeData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    arcNumber: '',
    payrollNumber: '',
    type: 'Full-Time',
    sectionId: '',
    outletId: '',
    hourlyPay: '',
    monthlyPay: '',
    allowOvertime: false,
    monthlyHours: '',
    Note: '',
    annualLeaveAllowance: '',
    annualLeaveRemaining: '',
    sickDays: '',
    offDays: '',
    hasAlerts: false,
    hasPayroll: false,
    mondayShiftId: '',
    tuesdayShiftId: '',
    wednesdayShiftId: '',
    thursdayShiftId: '',
    fridayShiftId: '',
    saturdayShiftId: '',
    sundayShiftId: ''
  });

  // Initialize with the selected company from context
  useEffect(() => {
    if (selectedCompany) {
      setLocalSelectedCompany(selectedCompany);
    }
  }, [selectedCompany]);

  // Subscribe to company changes for real-time updates
  useEffect(() => {
    const handleCompanyChange = (e) => {
      setLocalSelectedCompany(e.detail);
    };
    
    window.addEventListener('companyChanged', handleCompanyChange);

    return () => {
      window.removeEventListener('companyChanged', handleCompanyChange);
    };
  }, []);

  // Fetch data when component mounts or selected company changes
  useEffect(() => {
    const activeCompany = localSelectedCompany || selectedCompany;
    if (activeCompany) {
      fetchEmployees(activeCompany);
      fetchSections(activeCompany);
      fetchOutlets(activeCompany);
      fetchShifts(activeCompany);
    }
  }, [localSelectedCompany, selectedCompany]);

  const fetchEmployees = async (company) => {
    try {
      const data = await getEmployees(company);
      setEmployees(data.filter(emp => emp.active));
      setAllEmployees(data);

      // Check if any employee has shifts assigned
      const hasShifts = data.some(emp => 
        emp.mondayShiftId || emp.tuesdayShiftId || emp.wednesdayShiftId || 
        emp.thursdayShiftId || emp.fridayShiftId || emp.saturdayShiftId || 
        emp.sundayShiftId
      );

      // Update visibleColumns state based on shift assignments
      setVisibleColumns(prev => ({
        ...prev,
        schedule: hasShifts
      }));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSections = async (company) => {
    try {
      const data = await getSections(company);
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchOutlets = async (company) => {
    try {
      const data = await getOutlets(company);
      setOutlets(data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  const fetchShifts = async (company) => {
    try {
      const data = await getShifts(company.id || company);
      setShifts(data.filter(shift => shift.active));
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    const activeCompany = localSelectedCompany || selectedCompany;
    if (!newEmployeeData.firstName.trim() || !newEmployeeData.type || !newEmployeeData.sectionId || !newEmployeeData.outletId || !activeCompany) return;
    if (newEmployeeData.allowOvertime && !newEmployeeData.monthlyHours) return;

    const hourlyPay = newEmployeeData.hourlyPay ? parseFloat(newEmployeeData.hourlyPay).toFixed(2) : null;
    const monthlyPay = newEmployeeData.monthlyPay ? parseFloat(newEmployeeData.monthlyPay).toFixed(2) : null;

    try {
      await createEmployee(activeCompany, {
        ...newEmployeeData,
        sectionId: parseInt(newEmployeeData.sectionId),
        outletId: parseInt(newEmployeeData.outletId),
        hourlyPay: hourlyPay ? parseFloat(hourlyPay) : null,
        monthlyPay: monthlyPay ? parseFloat(monthlyPay) : null,
        monthlyHours: newEmployeeData.allowOvertime ? parseInt(newEmployeeData.monthlyHours) : null,
        hasAlerts: newEmployeeData.hasAlerts || false,
        hasPayroll: newEmployeeData.hasPayroll || false,
        active: true
      });
      await fetchEmployees(activeCompany);
    } catch (error) {
      console.error('Error creating employee:', error);
    }

    setNewEmployeeData({
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
      arcNumber: '',
      payrollNumber: '',
      type: 'Full-Time',
      sectionId: '',
      outletId: '',
      hourlyPay: '',
      monthlyPay: '',
      allowOvertime: false,
      monthlyHours: '',
      Note: '',
      annualLeaveAllowance: '',
      annualLeaveRemaining: '',
      sickDays: '',
      offDays: '',
      hasAlerts: false,
      hasPayroll: false,
      mondayShiftId: '',
      tuesdayShiftId: '',
      wednesdayShiftId: '',
      thursdayShiftId: '',
      fridayShiftId: '',
      saturdayShiftId: '',
      sundayShiftId: ''
    });
    setIsModalOpen(false);
  };

  const handleEditStart = (employee) => {
    setEditingId(employee.id);
    setEditingData({
      ...employee,
      sectionId: employee.Section?.id,
      outletId: employee.Outlet?.id,
      annualLeaveAllowance: employee.annualLeaveAllowance || '',
      annualLeaveRemaining: employee.annualLeaveRemaining || '',
      sickDays: employee.sickDays || '',
      offDays: employee.offDays || '',
      hasAlerts: employee.hasAlerts || false,
      hasPayroll: employee.hasPayroll || false,
      mondayShiftId: employee.MondayShift?.id || '',
      tuesdayShiftId: employee.TuesdayShift?.id || '',
      wednesdayShiftId: employee.WednesdayShift?.id || '',
      thursdayShiftId: employee.ThursdayShift?.id || '',
      fridayShiftId: employee.FridayShift?.id || '',
      saturdayShiftId: employee.SaturdayShift?.id || '',
      sundayShiftId: employee.SundayShift?.id || ''
    });
    setIsModalOpen(true);
  };

  const handleEditSave = async (e) => {
    if (e) e.preventDefault();
    const activeCompany = localSelectedCompany || selectedCompany;
    if (!editingData.firstName.trim() || !editingData.type || !editingData.sectionId || !editingData.outletId || !activeCompany) return;
    if (editingData.allowOvertime && !editingData.monthlyHours) return;

    const hourlyPay = editingData.hourlyPay ? parseFloat(editingData.hourlyPay).toFixed(2) : null;
    const monthlyPay = editingData.monthlyPay ? parseFloat(editingData.monthlyPay).toFixed(2) : null;

    try {
      console.log('Updating employee:', editingId, 'with data:', {
        ...editingData,
        sectionId: parseInt(editingData.sectionId),
        outletId: parseInt(editingData.outletId),
        hourlyPay: hourlyPay ? parseFloat(hourlyPay) : null,
        monthlyPay: monthlyPay ? parseFloat(monthlyPay) : null,
        monthlyHours: editingData.allowOvertime ? parseInt(editingData.monthlyHours) : null,
        hasAlerts: editingData.hasAlerts || false,
        hasPayroll: editingData.hasPayroll || false
      });
      
      const result = await updateEmployee(activeCompany, editingId, {
        ...editingData,
        sectionId: parseInt(editingData.sectionId),
        outletId: parseInt(editingData.outletId),
        hourlyPay: hourlyPay ? parseFloat(hourlyPay) : null,
        monthlyPay: monthlyPay ? parseFloat(monthlyPay) : null,
        monthlyHours: editingData.allowOvertime ? parseInt(editingData.monthlyHours) : null,
        hasAlerts: editingData.hasAlerts || false,
        hasPayroll: editingData.hasPayroll || false
      });
      
      console.log('Update result:', result);
      await fetchEmployees(activeCompany);
      setEditingId(null);
      setEditingData(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Failed to update employee: ' + (error.message || 'Unknown error'));
    }
  };

  const handleToggleActive = async (id) => {
    const activeCompany = localSelectedCompany || selectedCompany;
    if (!activeCompany) return;
    const employee = employees.find(e => e.id === id);
    try {
      await updateEmployee(activeCompany, id, { active: !employee.active });
      await fetchEmployees(activeCompany);
    } catch (error) {
      console.error('Error toggling employee status:', error);
    }
  };

  const handleDelete = async (id) => {
    const activeCompany = localSelectedCompany || selectedCompany;
    if (!activeCompany) return;
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(activeCompany, id);
        await fetchEmployees(activeCompany);
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleCloneEmployee = (employee) => {
    const cloneData = {
      ...employee,
      firstName: `${employee.firstName} (Copy)`,
      employeeNumber: null
    };
    setEditingId(null);
    setNewEmployeeData({
      firstName: cloneData.firstName,
      lastName: cloneData.lastName || '',
      mobile: cloneData.mobile || '',
      email: cloneData.email || '',
      arcNumber: cloneData.arcNumber || '',
      payrollNumber: cloneData.payrollNumber || '',
      type: cloneData.type,
      sectionId: cloneData.Section?.id.toString() || '',
      outletId: cloneData.Outlet?.id.toString() || '',
      hourlyPay: cloneData.hourlyPay || '',
      monthlyPay: cloneData.monthlyPay || '',
      allowOvertime: cloneData.allowOvertime || false,
      monthlyHours: cloneData.monthlyHours || '',
      Note: cloneData.Note || '',
      annualLeaveAllowance: cloneData.annualLeaveAllowance || '',
      annualLeaveRemaining: cloneData.annualLeaveRemaining || '',
      sickDays: cloneData.sickDays || '',
      offDays: cloneData.offDays || '',
      hasAlerts: cloneData.hasAlerts || false,
      hasPayroll: cloneData.hasPayroll || false,
      mondayShiftId: cloneData.mondayShiftId || '',
      tuesdayShiftId: cloneData.tuesdayShiftId || '',
      wednesdayShiftId: cloneData.wednesdayShiftId || '',
      thursdayShiftId: cloneData.thursdayShiftId || '',
      fridayShiftId: cloneData.fridayShiftId || '',
      saturdayShiftId: cloneData.saturdayShiftId || '',
      sundayShiftId: cloneData.sundayShiftId || ''
    });
    setIsModalOpen(true);
  };

  const [visibleColumns, setVisibleColumns] = useState({
    employeeNumber: true,
    name: true,
    type: true,
    schedule: true,
    section: true,
    outlet: true,

    mobile: false,
    email: false,
    arcNumber: false,
    payrollNumber: false,
    hourlyPay: false,
    monthlyPay: false,
    monthlyHours: false,
    status: true,
    actions: true
  });

  const toggleColumnVisibility = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const activeCompany = localSelectedCompany || selectedCompany;
  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Please select a company first.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Employees</h1>
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 rounded-lg border dark:border-slate-600/50 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="relative">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Columns</span>
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
                          if (key === 'employeeNumber' || key === 'name' || key === 'status' || key === 'actions') {
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
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <div key={key} className="flex items-center px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                      <input
                        type="checkbox"
                        id={`column-${key}`}
                        checked={value}
                        onChange={() => toggleColumnVisibility(key)}
                        disabled={key === 'employeeNumber' || key === 'name' || key === 'status' || key === 'actions'}
                        className={`h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700 ${(key === 'employeeNumber' || key === 'name' || key === 'status' || key === 'actions') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <label
                        htmlFor={`column-${key}`}
                        className={`ml-2 text-sm dark:text-slate-300 text-slate-700 capitalize ${(key === 'employeeNumber' || key === 'name') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                    </div>
                  ))}
                </div>
              </Menu.Items>
            </Menu>
          </div>
          <button
            onClick={() => {
              setNewEmployeeData({
                firstName: '',
                lastName: '',
                mobile: '',
                email: '',
                arcNumber: '',
                type: 'Full-Time',
                sectionId: currentSections.length > 0 ? currentSections[0].id.toString() : '',
                outletId: currentOutlets.length > 0 ? currentOutlets[0].id.toString() : '',
                hourlyPay: '',
                monthlyPay: '',
                allowOvertime: false,
                monthlyHours: '',
                Note: '',
                annualLeaveAllowance: '',
                annualLeaveRemaining: '',
                sickDays: '',
                offDays: '',
                hasAlerts: true,
                hasPayroll: true
              });
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto rounded-lg border dark:border-slate-700/50 border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>

              {visibleColumns.employeeNumber && (
                <th onClick={() => handleSort('employeeNumber')} className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Number {sortConfig.key === 'employeeNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.name && (
                <th onClick={() => handleSort('name')} className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.type && (
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer relative">
                  <button
                    onClick={() => handleFilterClick('type')}
                    className={`hover:text-slate-700 dark:hover:text-slate-300 ${filters.type ? 'text-slate-700 dark:text-slate-300' : ''} flex items-center justify-center space-x-1`}
                  >
                    <span>TYPE</span>
                    <FunnelIcon className="h-4 w-4" />
                    {filters.type ? ` (${filters.type})` : ''}
                  </button>
                  {activeFilter === 'type' && (
                    <FilterDropdown type="type" values={getUniqueValues(employees, 'type')} />
                  )}
                </th>
              )}
              {visibleColumns.schedule && (
                <th className="px-6 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-500 uppercase">Schedule</th>
              )}
              {visibleColumns.section && (
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer relative">
                  <button
                    onClick={() => handleFilterClick('section')}
                    className={`hover:text-slate-700 dark:hover:text-slate-300 ${filters.section ? 'text-slate-700 dark:text-slate-300' : ''} flex items-center justify-center space-x-1`}
                  >
                    <span>SECTION</span>
                    <FunnelIcon className="h-4 w-4" />
                    {filters.section ? ` (${filters.section})` : ''}
                  </button>
                  {activeFilter === 'section' && (
                    <FilterDropdown type="section" values={getUniqueValues(employees, 'section')} />
                  )}
                </th>
              )}
              {visibleColumns.outlet && (
                <th className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer relative">
                  <button
                    onClick={() => handleFilterClick('outlet')}
                    className={`hover:text-slate-700 dark:hover:text-slate-300 ${filters.outlet ? 'text-slate-700 dark:text-slate-300' : ''} flex items-center justify-center space-x-1`}
                  >
                    <span>OUTLET</span>
                    <FunnelIcon className="h-4 w-4" />
                    {filters.outlet ? ` (${filters.outlet})` : ''}
                  </button>
                  {activeFilter === 'outlet' && (
                    <FilterDropdown type="outlet" values={getUniqueValues(employees, 'outlet')} />
                  )}
                </th>
              )}
              {visibleColumns.mobile && (
                <th onClick={() => handleSort('mobile')} className="px-6 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Mobile {sortConfig.key === 'mobile' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.email && (
                <th onClick={() => handleSort('email')} className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.arcNumber && (
                <th onClick={() => handleSort('arcNumber')} className="px-6 py-3 text-left text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">ARC {sortConfig.key === 'arcNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.payrollNumber && (
                <th onClick={() => handleSort('payrollNumber')} className="px-6 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Payroll {sortConfig.key === 'payrollNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.hourlyPay && (
                <th onClick={() => handleSort('hourlyPay')} className="px-6 py-3 text-right text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Hourly {sortConfig.key === 'hourlyPay' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.monthlyPay && (
                <th onClick={() => handleSort('monthlyPay')} className="px-6 py-3 text-right text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Monthly {sortConfig.key === 'monthlyPay' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.monthlyHours && (
                <th onClick={() => handleSort('monthlyHours')} className="px-6 py-3 text-right text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider cursor-pointer">Monthly (H) {sortConfig.key === 'monthlyHours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
              )}
              {visibleColumns.status && (
                <th className="px-6 py-3 text-center text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">Status</th>
              )}
              {visibleColumns.actions && (
                <th className="px-6 py-3 text-right text-xs font-medium dark:text-slate-400 text-slate-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white/80 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700/50">
            {sortData(employees
              .filter(employee => {
                const matchesSearch = searchTerm
                  ? (employee.firstName + ' ' + (employee.lastName || '')).toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (employee.employeeNumber && employee.employeeNumber.toString().includes(searchTerm))
                  : true;
                const matchesType = !filters.type || employee.type === filters.type;
                const matchesSection = !filters.section || employee.Section?.name === filters.section;
                const matchesOutlet = !filters.outlet || employee.Outlet?.name === filters.outlet;
                return matchesSearch && matchesType && matchesSection && matchesOutlet;
              }), sortConfig.key)
              .map((employee) => (
              <tr key={employee.id} className="hover:dark:bg-slate-700/30 hover:bg-slate-50 transition-colors duration-150">

                {visibleColumns.employeeNumber && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">{employee.employeeNumber}</td>
                )}
                {visibleColumns.name && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                    <span>{employee.firstName} {employee.lastName}</span>
                  </td>
                )}
                {visibleColumns.type && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-left">
                    {employee.type}
                  </td>
                )}
                {visibleColumns.schedule && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 font-mono text-center">
                    {!employee.MondayShift && !employee.TuesdayShift && !employee.WednesdayShift && 
                     !employee.ThursdayShift && !employee.FridayShift && !employee.SaturdayShift && 
                     !employee.SundayShift ? '' : 
                     `${employee.MondayShift ? 'M' : '-'}|${employee.TuesdayShift ? 'T' : '-'}|${employee.WednesdayShift ? 'W' : '-'}|${employee.ThursdayShift ? 'T' : '-'}|${employee.FridayShift ? 'F' : '-'}|${employee.SaturdayShift ? 'S' : '-'}|${employee.SundayShift ? 'S' : '-'}`}
                  </td>
                )}
                {visibleColumns.section && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-left">
                    {employee.Section?.name}
                  </td>
                )}
                {visibleColumns.outlet && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-left">
                    {employee.Outlet?.name}
                  </td>
                )}
                {visibleColumns.mobile && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-center">
                    {employee.mobile}
                  </td>
                )}
                {visibleColumns.email && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                    {employee.email}
                  </td>
                )}
                {visibleColumns.arcNumber && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                    {employee.arcNumber}
                  </td>
                )}
                {visibleColumns.payrollNumber && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-center">
                    {employee.payrollNumber}
                  </td>
                )}
                {visibleColumns.hourlyPay && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-right">
                    {employee.hourlyPay ? `€${parseFloat(employee.hourlyPay).toFixed(2).replace(/\.?0+$/, '')}` : '-'}
                  </td>
                )}
                {visibleColumns.monthlyPay && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-right">
                    {employee.monthlyPay ? `€${parseFloat(employee.monthlyPay).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '-'}
                  </td>
                )}
                {visibleColumns.allowOvertime && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                    {employee.allowOvertime ? 'Yes' : 'No'}
                  </td>
                )}
                {visibleColumns.monthlyHours && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900 text-right">
                    {employee.monthlyHours ? `${employee.monthlyHours}h` : '-'}
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleToggleActive(employee.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${employee.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                    >
                      {employee.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                )}
                {visibleColumns.actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          const cloneData = {
                            ...employee,
                            firstName: `${employee.firstName} (Copy)`,
                            employeeNumber: null
                          };
                          setEditingId(null);
                          setNewEmployeeData({
                            firstName: cloneData.firstName,
                            lastName: cloneData.lastName || '',
                            mobile: cloneData.mobile || '',
                            email: cloneData.email || '',
                            arcNumber: cloneData.arcNumber || '',
                            payrollNumber: cloneData.payrollNumber || '',
                            type: cloneData.type,
                            sectionId: cloneData.Section?.id.toString() || '',
                            outletId: cloneData.Outlet?.id.toString() || '',
                            hourlyPay: cloneData.hourlyPay || '',
                            monthlyPay: cloneData.monthlyPay || '',
                            allowOvertime: cloneData.allowOvertime || false,
                            monthlyHours: cloneData.monthlyHours || '',
                            Note: cloneData.Note || '',
                            mondayShiftId: cloneData.mondayShiftId || '',
                            tuesdayShiftId: cloneData.tuesdayShiftId || '',
                            wednesdayShiftId: cloneData.wednesdayShiftId || '',
                            thursdayShiftId: cloneData.thursdayShiftId || '',
                            fridayShiftId: cloneData.fridayShiftId || '',
                            saturdayShiftId: cloneData.saturdayShiftId || '',
                            sundayShiftId: cloneData.sundayShiftId || ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                        title="Clone employee"
                      >
                        <DocumentDuplicateIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEditStart(employee)}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-4xl">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">
              {editingId !== null ? `Edit Employee: ${editingData.employeeNumber}` : `New Employee: ${allEmployees.length > 0 ? Math.max(...allEmployees.filter(emp => emp.employeeNumber).map(emp => emp.employeeNumber || 0), 100) + 1 : 101}`}
            </h2>
            <form onSubmit={editingId !== null ? handleEditSave : handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={editingId !== null ? editingData.firstName : newEmployeeData.firstName}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, firstName: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, firstName: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={editingId !== null ? editingData.lastName || '' : newEmployeeData.lastName}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, lastName: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, lastName: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={editingId !== null ? editingData.mobile || '' : newEmployeeData.mobile}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, mobile: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, mobile: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingId !== null ? editingData.email || '' : newEmployeeData.email}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, email: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, email: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">ARC Number</label>
                <input
                  type="text"
                  value={editingId !== null ? editingData.arcNumber || '' : newEmployeeData.arcNumber}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, arcNumber: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, arcNumber: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Payroll Number</label>
                <input
                  type="text"
                  value={editingId !== null ? editingData.payrollNumber || '' : newEmployeeData.payrollNumber}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, payrollNumber: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, payrollNumber: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
                            
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Outlet</label>
                <select
                  value={editingId !== null ? editingData.outletId : newEmployeeData.outletId}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, outletId: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, outletId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                >
                  <option value="">Select outlet</option>
                  {currentOutlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Section</label>
                <select
                  value={editingId !== null ? editingData.sectionId : newEmployeeData.sectionId}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, sectionId: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, sectionId: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                >
                  <option value="">Select section</option>
                  {currentSections.map((section) => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Hourly Pay</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingId !== null ? editingData.hourlyPay || '' : newEmployeeData.hourlyPay}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, hourlyPay: e.target.value ? parseFloat(e.target.value) : null }) : 
                    setNewEmployeeData({ ...newEmployeeData, hourlyPay: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Monthly Pay</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingId !== null ? editingData.monthlyPay || '' : newEmployeeData.monthlyPay}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, monthlyPay: e.target.value ? parseFloat(e.target.value) : null }) : 
                    setNewEmployeeData({ ...newEmployeeData, monthlyPay: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                />
              </div>        

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Monthly Overtime</label>
                <select
                  value={editingId !== null ? (editingData.allowOvertime ? 'true' : 'false') : (newEmployeeData.allowOvertime ? 'true' : 'false')}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, allowOvertime: e.target.value === 'true' }) : 
                    setNewEmployeeData({ ...newEmployeeData, allowOvertime: e.target.value === 'true' })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Overtime After (h)</label>
                <input
                  type="number"
                  value={editingId !== null ? editingData.monthlyHours || '' : newEmployeeData.monthlyHours}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, monthlyHours: e.target.value ? parseInt(e.target.value) : null }) : 
                    setNewEmployeeData({ ...newEmployeeData, monthlyHours: e.target.value })}
                  disabled={editingId !== null ? !editingData.allowOvertime : !newEmployeeData.allowOvertime}
                  className={`w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 ${(editingId !== null ? !editingData.allowOvertime : !newEmployeeData.allowOvertime) ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>


              <div className="md:col-span-3">
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Note</label>
                <textarea
                  value={editingId !== null ? editingData.Note || '' : newEmployeeData.Note}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, Note: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, Note: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  rows="2"
                />
              </div>
              
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Type</label>
                <select
                  value={editingId !== null ? editingData.type : newEmployeeData.type}
                  onChange={(e) => editingId !== null ? 
                    setEditingData({ ...editingData, type: e.target.value }) : 
                    setNewEmployeeData({ ...newEmployeeData, type: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <div className="flex space-x-4">
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Annual Leave Days</label>
                    <div className="flex space-x-2">
                      <div>
                        <input
                          type="number"
                          placeholder="  Allowance"
                          value={editingId !== null ? editingData.annualLeaveAllowance || '' : newEmployeeData.annualLeaveAllowance}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (editingId !== null) {
                              setEditingData({ ...editingData, annualLeaveAllowance: value, annualLeaveRemaining: value });
                            } else {
                              setNewEmployeeData({ ...newEmployeeData, annualLeaveAllowance: value, annualLeaveRemaining: value });
                            }
                          }}
                          className="w-24 px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-xs"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={editingId !== null ? 
                            (editingData.annualLeaveAllowance ? `${editingData.annualLeaveAllowance}` : '') : 
                            (newEmployeeData.annualLeaveAllowance ? `${newEmployeeData.annualLeaveAllowance}` : '')}
                          className="w-24 px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-100 dark:bg-slate-600 cursor-not-allowed"
                        />
                        {(editingId !== null ? editingData.annualLeaveAllowance : newEmployeeData.annualLeaveAllowance) && 
                          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 pointer-events-none">
                            Remaining
                          </span>
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Sick Days</label>
                    <input
                      type="number"
                      value={editingId !== null ? editingData.sickDays || '' : newEmployeeData.sickDays}
                      disabled
                      className="w-20 px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-100 dark:bg-slate-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Off Days</label>
                    <input
                      type="number"
                      value={editingId !== null ? editingData.offDays || '' : newEmployeeData.offDays}
                      disabled
                      className="w-20 px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 bg-slate-100 dark:bg-slate-600 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Alerts</label>
                    <select
                      value={editingId !== null ? (editingData.hasAlerts ? 'true' : 'false') : (newEmployeeData.hasAlerts ? 'true' : 'false')}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, hasAlerts: e.target.value === 'true' }) : 
                        setNewEmployeeData({ ...newEmployeeData, hasAlerts: e.target.value === 'true' })}
                      className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Payroll</label>
                    <select
                      value={editingId !== null ? (editingData.hasPayroll ? 'true' : 'false') : (newEmployeeData.hasPayroll ? 'true' : 'false')}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, hasPayroll: e.target.value === 'true' }) : 
                        setNewEmployeeData({ ...newEmployeeData, hasPayroll: e.target.value === 'true' })}
                      className="w-full px-2 py-1.5 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>


              
              {/* Fixed Shifts Section */}
              <div className="md:col-span-4 mt-4">
                <h3 className="text-lg font-medium dark:text-slate-200 text-slate-800 mb-2">Regular Shifts</h3>
                <div className="grid grid-cols-7 gap-2">
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Monday</label>
                    <select
                      value={editingId !== null ? editingData.mondayShiftId : newEmployeeData.mondayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, mondayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, mondayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Tuesday</label>
                    <select
                      value={editingId !== null ? editingData.tuesdayShiftId : newEmployeeData.tuesdayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, tuesdayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, tuesdayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Wednesday</label>
                    <select
                      value={editingId !== null ? editingData.wednesdayShiftId : newEmployeeData.wednesdayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, wednesdayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, wednesdayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Thursday</label>
                    <select
                      value={editingId !== null ? editingData.thursdayShiftId : newEmployeeData.thursdayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, thursdayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, thursdayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Friday</label>
                    <select
                      value={editingId !== null ? editingData.fridayShiftId : newEmployeeData.fridayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, fridayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, fridayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Saturday</label>
                    <select
                      value={editingId !== null ? editingData.saturdayShiftId : newEmployeeData.saturdayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, saturdayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, saturdayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">Sunday</label>
                    <select
                      value={editingId !== null ? editingData.sundayShiftId : newEmployeeData.sundayShiftId}
                      onChange={(e) => editingId !== null ? 
                        setEditingData({ ...editingData, sundayShiftId: e.target.value }) : 
                        setNewEmployeeData({ ...newEmployeeData, sundayShiftId: e.target.value })}
                      className="w-full px-1 py-1 text-sm rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">No shift</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 md:col-span-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (editingId !== null) {
                      setEditingId(null);
                      setEditingData(null);
                    }
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
