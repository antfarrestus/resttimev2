import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getOutlets, createOutlet, updateOutlet, deleteOutlet } from '../services/api';

export default function Outlets({ darkMode }) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [outlets, setOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [newOutletName, setNewOutletName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newOutletData, setNewOutletData] = useState({
    name: '',
    // Grace Period fields
    earlyClockInGrace: 0,
    slightlyLateClockInGrace: 0,
    lateClockInGrace: 0,
    earlyClockOutGrace: 0,
    slightlyLateClockOutGrace: 0,
    lateClockOutGrace: 0,
    // Daily Rates fields
    mondayShiftRate: 0,
    mondayOvertimeRate: 0,
    tuesdayShiftRate: 0,
    tuesdayOvertimeRate: 0,
    wednesdayShiftRate: 0,
    wednesdayOvertimeRate: 0,
    thursdayShiftRate: 0,
    thursdayOvertimeRate: 0,
    fridayShiftRate: 0,
    fridayOvertimeRate: 0,
    saturdayShiftRate: 0,
    saturdayOvertimeRate: 0,
    sundayShiftRate: 0,
    sundayOvertimeRate: 0,
    holidayShiftRate: 0,
    holidayOvertimeRate: 0
  });

  // Fetch outlets when component mounts or selected company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchOutlets();
    } else {
      setOutlets([]);
      setIsLoading(false);
    }
  }, [selectedCompany]);

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const fetchOutlets = async () => {
    setIsLoading(true);
    try {
      const data = await getOutlets(selectedCompany.id);
      setOutlets(data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
      setOutlets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOutlet = async (e) => {
    e.preventDefault();
    if (!newOutletData.name.trim() || !selectedCompany) return;
  
    try {
      if (isEditing) {
        // Update existing outlet
        await updateOutlet(selectedCompany.id, editingId, {
          ...newOutletData,
          name: newOutletData.name.trim()
        });
      } else {
        // Create new outlet
        await createOutlet(selectedCompany.id, { 
          ...newOutletData,
          name: newOutletData.name.trim(), 
          active: true 
        });
      }
      
      await fetchOutlets(); // Fetch updated list of outlets after successful operation
      
      // Reset form with default values
      setNewOutletData({
        name: '',
        // Grace Period fields
        earlyClockInGrace: 0,
        slightlyLateClockInGrace: 0,
        lateClockInGrace: 0,
        earlyClockOutGrace: 0,
        slightlyLateClockOutGrace: 0,
        lateClockOutGrace: 0,
        // Daily Rates fields - default to 1 for new outlets
        mondayShiftRate: 1,
        mondayOvertimeRate: 1,
        tuesdayShiftRate: 1,
        tuesdayOvertimeRate: 1,
        wednesdayShiftRate: 1,
        wednesdayOvertimeRate: 1,
        thursdayShiftRate: 1,
        thursdayOvertimeRate: 1,
        fridayShiftRate: 1,
        fridayOvertimeRate: 1,
        saturdayShiftRate: 1,
        saturdayOvertimeRate: 1,
        sundayShiftRate: 1,
        sundayOvertimeRate: 1,
        holidayShiftRate: 1,
        holidayOvertimeRate: 1
      });
      
      // Reset editing state
      setIsEditing(false);
      setEditingId(null);
      setIsModalOpen(false); // Close modal
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} outlet:`, error);
    }
  };

  const handleEditStart = (outlet) => {
    setEditingId(outlet.id);
    setEditingName(outlet.name);
    
    // Pre-populate form with outlet data
    setNewOutletData({
      name: outlet.name,
      // Grace Period fields
      earlyClockInGrace: outlet.earlyClockInGrace || 0,
      slightlyLateClockInGrace: outlet.slightlyLateClockInGrace || 0,
      lateClockInGrace: outlet.lateClockInGrace || 0,
      earlyClockOutGrace: outlet.earlyClockOutGrace || 0,
      slightlyLateClockOutGrace: outlet.slightlyLateClockOutGrace || 0,
      lateClockOutGrace: outlet.lateClockOutGrace || 0,
      // Daily Rates fields
      mondayShiftRate: outlet.mondayShiftRate || 0,
      mondayOvertimeRate: outlet.mondayOvertimeRate || 0,
      tuesdayShiftRate: outlet.tuesdayShiftRate || 0,
      tuesdayOvertimeRate: outlet.tuesdayOvertimeRate || 0,
      wednesdayShiftRate: outlet.wednesdayShiftRate || 0,
      wednesdayOvertimeRate: outlet.wednesdayOvertimeRate || 0,
      thursdayShiftRate: outlet.thursdayShiftRate || 0,
      thursdayOvertimeRate: outlet.thursdayOvertimeRate || 0,
      fridayShiftRate: outlet.fridayShiftRate || 0,
      fridayOvertimeRate: outlet.fridayOvertimeRate || 0,
      saturdayShiftRate: outlet.saturdayShiftRate || 0,
      saturdayOvertimeRate: outlet.saturdayOvertimeRate || 0,
      sundayShiftRate: outlet.sundayShiftRate || 0,
      sundayOvertimeRate: outlet.sundayOvertimeRate || 0,
      holidayShiftRate: outlet.holidayShiftRate || 0,
      holidayOvertimeRate: outlet.holidayOvertimeRate || 0
    });
    
    // Set editing mode and open modal
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // This function is now only used for inline name editing (if needed)
  const handleInlineEditSave = async (id) => {
    if (!editingName.trim() || !selectedCompany) return;
    try {
      await updateOutlet(selectedCompany.id, id, { name: editingName.trim() });
      await fetchOutlets();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating outlet name:', error);
    }
  };

  const handleToggleActive = async (id) => {
    if (!selectedCompany || user?.role !== 'super_admin') return;
    const outlet = outlets.find(o => o.id === id);
    try {
      await updateOutlet(selectedCompany.id, id, { active: !outlet.active });
      await fetchOutlets();
    } catch (error) {
      console.error('Error toggling outlet status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!selectedCompany) return;
    if (window.confirm('Are you sure you want to delete this outlet?')) {
      try {
        await deleteOutlet(selectedCompany.id, id);
        await fetchOutlets();
      } catch (error) {
        console.error('Error deleting outlet:', error);
      }
    }
  };

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Please select a company first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading outlets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Outlets</h1>
        {user?.role === 'super_admin' && (
          <button
          onClick={() => {
            setIsEditing(false);
            setNewOutletData({
              name: '',
              // Grace Period fields
              earlyClockInGrace: 0,
              slightlyLateClockInGrace: 0,
              lateClockInGrace: 0,
              earlyClockOutGrace: 0,
              slightlyLateClockOutGrace: 0,
              lateClockOutGrace: 0,
              // Daily Rates fields - default to 1 for new outlets
              mondayShiftRate: 1,
              mondayOvertimeRate: 1,
              tuesdayShiftRate: 1,
              tuesdayOvertimeRate: 1,
              wednesdayShiftRate: 1,
              wednesdayOvertimeRate: 1,
              thursdayShiftRate: 1,
              thursdayOvertimeRate: 1,
              fridayShiftRate: 1,
              fridayOvertimeRate: 1,
              saturdayShiftRate: 1,
              saturdayOvertimeRate: 1,
              sundayShiftRate: 1,
              sundayOvertimeRate: 1,
              holidayShiftRate: 1,
              holidayOvertimeRate: 1
            });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Outlet
        </button>
        )}
      </div>

      {/* Outlets Table */}
      <div className="overflow-x-auto rounded-lg border dark:border-slate-700/50 border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                onClick={() => handleSort('id')}
              >
                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                onClick={() => handleSort('name')}
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              {user?.role === 'super_admin' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white/80 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700/50">
            {outlets && sortData(outlets, sortConfig.key, sortConfig.direction).map((outlet) => (
              <tr key={outlet.id} className="hover:dark:bg-slate-700/30 hover:bg-slate-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">{outlet.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                  <span>{outlet.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user?.role === 'super_admin' ? (
                    <button
                      onClick={() => handleToggleActive(outlet.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${outlet.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                    >
                      {outlet.active ? 'Active' : 'Disabled'}
                    </button>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${outlet.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}>
                      {outlet.active ? 'Active' : 'Disabled'}
                    </span>
                  )}
                </td>
                {user?.role === 'super_admin' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEditStart(outlet)}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(outlet.id)}
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

      {/* Create Outlet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">{isEditing ? 'Edit Outlet' : 'Create New Outlet'}</h2>
            <form onSubmit={handleSubmitOutlet}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Outlet Name and Grace Periods */}
                <div>
                  <div className="mb-4 mt-7">
                    <label htmlFor="outletName" className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-1">
                      Outlet Name
                    </label>
                    <input
                      type="text"
                      id="outletName"
                      value={newOutletData.name}
                      onChange={(e) => setNewOutletData({...newOutletData, name: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      placeholder="Enter outlet name"
                      required
                    />
                  </div>
                  <div className="h-5"></div>

                  {/* Grace Periods Section */}
<div className="mb-4">
  <div className="mb-4 bg-white dark:bg-slate-700/30 rounded-lg">
    <h3 className="text-base mb-3 uppercase tracking-wide font-semibold text-emerald-600 dark:text-emerald-400">
      Grace Periods
    </h3>

    {/* Grace Periods Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[
        { id: 'earlyClockInGrace', label: 'Early Clock-In' },
        { id: 'earlyClockOutGrace', label: 'Early Clock-Out' },
        { id: 'slightlyLateClockInGrace', label: 'Slightly Late Clock-In' },
        { id: 'slightlyLateClockOutGrace', label: 'Slightly Late Clock-Out' },
        { id: 'lateClockInGrace', label: 'Late Clock-In' },
        { id: 'lateClockOutGrace', label: 'Late Clock-Out' },
      ].map(({ id, label }) => (
        <div
          key={id}
          className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow"
        >
          <label htmlFor={id} className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
            {label}
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              id={id}
              value={newOutletData[id]}
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  setNewOutletData({
                    ...newOutletData,
                    [id]: value,
                  });
                }
              }}
              className="w-full pr-12 px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Enter minutes"
              min="0"
            />
            <span className="absolute inset-y-0 right-3 flex items-center text-sm text-slate-500 dark:text-slate-400 pointer-events-none">
              mins
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

                </div>
                
                {/* Right Column - Daily Rates */}
                <div>
                  {/* Daily Rates Section */}
                  <div className="mb-6">

                    
                    {/* Weekdays Card */}
                    <div className="mb-4 p-4 bg-white dark:bg-slate-700/30 rounded-lg">
                      <h4 className="text-base mb-3 uppercase tracking-wide font-semibold text-emerald-600 dark:text-emerald-400">Daily rates</h4>
                      
                      {/* Weekday Rates Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Monday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Monday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="mondayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="mondayShiftRate"
                                step="0.10"
                                value={newOutletData.mondayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    mondayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="mondayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="mondayOvertimeRate"
                                step="0.10"
                                value={newOutletData.mondayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    mondayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Tuesday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Tuesday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="tuesdayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="tuesdayShiftRate"
                                step="0.10"
                                value={newOutletData.tuesdayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    tuesdayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="tuesdayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="tuesdayOvertimeRate"
                                step="0.10"
                                value={newOutletData.tuesdayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    tuesdayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Wednesday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Wednesday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="wednesdayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="wednesdayShiftRate"
                                step="0.10"
                                value={newOutletData.wednesdayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    wednesdayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="wednesdayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="wednesdayOvertimeRate"
                                step="0.10"
                                value={newOutletData.wednesdayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    wednesdayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Thursday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Thursday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="thursdayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="thursdayShiftRate"
                                step="0.10"
                      value={newOutletData.thursdayShiftRate}
                      onChange={(e) =>
                        setNewOutletData({
                          ...newOutletData,
                          thursdayShiftRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      min="0"
                    />
                            </div>
                            <div>
                              <label htmlFor="thursdayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="thursdayOvertimeRate"
                                step="0.10"
                                value={newOutletData.thursdayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    thursdayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Friday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Friday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="fridayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="fridayShiftRate"
                                step="0.10"
                                value={newOutletData.fridayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    fridayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="fridayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="fridayOvertimeRate"
                                step="0.10"
                                value={newOutletData.fridayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    fridayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Saturday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Saturday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="saturdayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="saturdayShiftRate"
                                step="0.10"
                                value={newOutletData.saturdayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    saturdayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="saturdayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="saturdayOvertimeRate"
                                step="0.10"
                                value={newOutletData.saturdayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    saturdayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Sunday */}
                        <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">Sunday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="sundayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="sundayShiftRate"
                                step="0.10"
                                value={newOutletData.sundayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    sundayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="sundayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-500 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="sundayOvertimeRate"
                                step="0.10"
                                value={newOutletData.sundayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    sundayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Holiday */}
                        <div className="p-2 bg-slate-600 dark:bg-slate-800/50 rounded shadow">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium dark:text-slate-300 text-slate-100">Holiday</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor="holidayShiftRate" className="block text-xs font-medium dark:text-slate-400 text-slate-300 mb-1">
                                Shift Rate
                              </label>
                              <input
                                type="number"
                                id="holidayShiftRate"
                                step="0.10"
                                value={newOutletData.holidayShiftRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    holidayShiftRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                            <div>
                              <label htmlFor="holidayOvertimeRate" className="block text-xs font-medium dark:text-slate-400 text-slate-300 mb-1">
                                Overtime
                              </label>
                              <input
                                type="number"
                                id="holidayOvertimeRate"
                                step="0.10"
                                value={newOutletData.holidayOvertimeRate}
                                onChange={(e) =>
                                  setNewOutletData({
                                    ...newOutletData,
                                    holidayOvertimeRate: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="remove-spinner w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg transition-colors duration-200"
                >
                  {isEditing ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}