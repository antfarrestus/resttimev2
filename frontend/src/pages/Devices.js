import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { getDevices, createDevice, updateDevice, deleteDevice, getOutlets } from '../services/api';

export default function Devices({ darkMode }) {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [devices, setDevices] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    outlet: '',
    pinRequired: true,
  });
  const [editingId, setEditingId] = useState(null);

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

  const filteredDevices = devices.filter(device => {
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return true;
    }
    return user?.outlets?.includes('All') || user?.outlets?.includes(device.outlet);
  });

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', password: '', outlet: '', pinRequired: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (device) => {
    setIsEditMode(true);
    setEditingId(device.id);
    setFormData({
      name: device.name,
      password: device.password,
      outlet: device.outletId || (device.Outlet ? device.Outlet.id : ''),
      pinRequired: device.pinRequired,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, password, outlet, pinRequired } = formData;
    if (!name.trim() || !password.trim() || !outlet || !selectedCompany) return;

    try {
      if (isEditMode) {
        await updateDevice(selectedCompany.id, editingId, {
          name: name.trim(),
          password: password.trim(),
          outletId: outlet,
          active: true,
          pinRequired,
        });
      } else {
        await createDevice(selectedCompany.id, {
          name: name.trim(),
          password: password.trim(),
          outletId: outlet,
          active: true,
          pinRequired,
        });
      }
      await fetchDevices();
      setIsModalOpen(false);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} device:`, error);
    }
  };

  const handleToggleActive = async (id) => {
    const device = devices.find(d => d.id === id);
    try {
      await updateDevice(selectedCompany.id, id, { active: !device.active });
      await fetchDevices();
    } catch (error) {
      console.error('Error toggling device status:', error);
    }
  };

  const handleDelete = async (id) => {
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
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        const aValue = a[parent] ? a[parent][child] : '';
        const bValue = b[parent] ? b[parent][child] : '';
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      }
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
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
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Device
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-slate-700/50 border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              {['id', 'name', 'Outlet.name'].map((key) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {key === 'Outlet.name' ? 'Outlet' : key.charAt(0).toUpperCase() + key.slice(1)}{' '}
                  {sortConfig.key === key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              ))}
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
                <td className="px-6 py-4 text-sm dark:text-slate-300 text-slate-900">{device.id}</td>
                <td className="px-6 py-4 text-sm dark:text-slate-300 text-slate-900">{device.name}</td>
                <td className="px-6 py-4 text-sm dark:text-slate-300 text-slate-900">{device.Outlet?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm dark:text-slate-300 text-slate-900">{device.password}</td>
                <td className="px-6 py-4 text-sm text-center">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400">
                    Offline
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center">
                  <button
                    onClick={() => handleToggleActive(device.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${device.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                  >
                    {device.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                {user?.role === 'super_admin' && (
                  <td className="px-6 py-4 text-sm text-right">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleOpenEditModal(device)}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">
              {isEditMode ? 'Edit Device' : 'Create New Device'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">Device Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200"
                    required
                  />
                </div>
                <div className="flex w-full">
                  <div className="w-1/2 pr-1">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">Outlet</label>
                    <select
                      value={formData.outlet}
                      onChange={(e) => setFormData({ ...formData, outlet: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 cursor-pointer dark:bg-slate-700 dark:text-slate-100 border-slate-200"
                      required
                    >
                      <option value="">Select an outlet</option>
                      {outlets.map(outlet => (
                        <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/2 pl-1">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">Password</label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200"
                      required
                    />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="inline-flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={formData.pinRequired}
                      onChange={(e) => setFormData({ ...formData, pinRequired: e.target.checked })}
                      className="form-checkbox h-5 w-5 cursor-pointer text-slate-600 dark:text-slate-100 border dark:border-slate-600"
                    />
                    <span className="ml-2 block text-sm cursor-pointer font-medium dark:text-slate-300 text-slate-700">Use Pin Code</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-lg"
                >
                  {isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
