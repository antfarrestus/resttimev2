import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { PlusIcon, PencilSquareIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getDevices, createDevice, updateDevice, deleteDevice, getOutlets } from '../services/api';

export default function Devices({ darkMode }) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [devices, setDevices] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [newDeviceData, setNewDeviceData] = useState({
    name: '',
    password: '',
    outlet: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState(null);

  // Fetch devices and outlets when component mounts or selected company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchDevices();
      fetchOutlets();
    }
  }, [selectedCompany]);

  const fetchDevices = async () => {
    try {
      const data = await getDevices(selectedCompany.id);
      setDevices(data || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchOutlets = async () => {
    try {
      const data = await getOutlets(selectedCompany.id);
      setOutlets(data || []);
    } catch (error) {
      console.error('Error fetching outlets:', error);
    }
  };

  // Filter devices based on user role and assigned outlet
  const filteredDevices = devices.filter(device => {
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return true;
    }
    // For managers, only show devices from their assigned outlet
    return user?.outlets?.includes('All') || user?.outlets?.includes(device.outlet);
  });

  const handleCreateDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceData.name.trim() || !newDeviceData.password.trim() || !newDeviceData.outlet || !selectedCompany) return;

    try {
      await createDevice(selectedCompany.id, {
        name: newDeviceData.name.trim(),
        password: newDeviceData.password.trim(),
        outletId: newDeviceData.outlet,
        active: true
      });
      await fetchDevices();
      setNewDeviceData({ name: '', password: '', outlet: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating device:', error);
    }
  };

  const handleEditStart = (device) => {
    setEditingId(device.id);
    setEditingData({
      ...device,
      outletId: device.outletId || (device.Outlet ? device.Outlet.id : '')
    });
  };

  const handleEditSave = async () => {
    if (!editingData.name.trim() || !editingData.password.trim() || !editingData.outletId || !selectedCompany) return;

    try {
      await updateDevice(selectedCompany.id, editingId, {
        name: editingData.name,
        password: editingData.password,
        outletId: editingData.outletId,
        active: editingData.active
      });
      await fetchDevices();
      setEditingId(null);
      setEditingData(null);
    } catch (error) {
      console.error('Error updating device:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
  };

  const handleToggleActive = async (id) => {
    if (!selectedCompany) return;
    const device = devices.find(d => d.id === id);
    try {
      await updateDevice(selectedCompany.id, id, { active: !device.active });
      await fetchDevices();
    } catch (error) {
      console.error('Error toggling device status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!selectedCompany) return;
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await deleteDevice(selectedCompany.id, id);
        await fetchDevices();
      } catch (error) {
        console.error('Error deleting device:', error);
      }
    }
  };

  const sortData = (data, key, direction) => {
    return [...data].sort((a, b) => {
      // Handle nested object sorting (e.g., Outlet.name)
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        const aValue = a[parent] ? a[parent][child] : '';
        const bValue = b[parent] ? b[parent][child] : '';
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      }
      // Handle regular sorting
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
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Devices</h1>
        {user?.role === 'super_admin' && (
          <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Device
        </button>
        )}
      </div>

      {/* Devices Table */}
      <div className="overflow-x-auto rounded-lg border dark:border-slate-700/50 border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th 
                onClick={() => handleSort('id')}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                onClick={() => handleSort('Outlet.name')}
                className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
              >
                Outlet {sortConfig.key === 'Outlet.name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Connection</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              {user?.role === 'super_admin' && (
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white/80 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700/50">
            {sortData(filteredDevices, sortConfig.key, sortConfig.direction).map((device) => (
              <tr key={device.id} className="hover:dark:bg-slate-700/30 hover:bg-slate-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">{device.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                  {editingId === device.id ? (
                    <input
                      type="text"
                      value={editingData.name}
                      onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                      className="w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  ) : (
                    device.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                  {editingId === device.id ? (
                    <select
                      value={editingData.outletId}
                      onChange={(e) => setEditingData({ ...editingData, outletId: e.target.value })}
                      className="w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      {outlets.map((outlet) => (
                        <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                      ))}
                    </select>
                  ) : (
                    device.Outlet ? device.Outlet.name : 'Unknown'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                  {editingId === device.id ? (
                    <input
                      type="text"
                      value={editingData.password}
                      onChange={(e) => setEditingData({ ...editingData, password: e.target.value })}
                      className="w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  ) : (
                    device.password
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400">
                    Offline
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  {user?.role === 'super_admin' ? (
                    <button
                      onClick={() => handleToggleActive(device.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${device.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                    >
                      {device.active ? 'Active' : 'Disabled'}
                    </button>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${device.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}>
                      {device.active ? 'Active' : 'Disabled'}
                    </span>
                  )}
                </td>
                {user?.role === 'super_admin' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex justify-end space-x-3">
                      {editingId === device.id ? (
                        <>
                          <button
                            onClick={handleEditSave}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 transition-colors duration-200"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditStart(device)}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(device.id)}
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

      {/* Create Device Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Create New Device</h2>
            <form onSubmit={handleCreateDevice}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="deviceName" className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Device Name
                  </label>
                  <input
                    type="text"
                    id="deviceName"
                    value={newDeviceData.name}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter device name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="deviceOutlet" className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Outlet
                  </label>
                  <select
                    id="deviceOutlet"
                    value={newDeviceData.outlet}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, outlet: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  >
                    <option value="">Select an outlet</option>
                    {outlets.map((outlet) => (
                      <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="devicePassword" className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Password
                  </label>
                  <input
                    type="text"
                    id="devicePassword"
                    value={newDeviceData.password}
                    onChange={(e) => setNewDeviceData({ ...newDeviceData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Enter device password"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}