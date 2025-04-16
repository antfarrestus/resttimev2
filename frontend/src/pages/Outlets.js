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

  const handleCreateOutlet = async (e) => {
    e.preventDefault();
    if (!newOutletName.trim() || !selectedCompany) return;
  
    try {
      const response = await createOutlet(selectedCompany.id, { 
        name: newOutletName.trim(), 
        active: true 
      });
      await fetchOutlets(); // Fetch updated list of outlets after successful creation
      setNewOutletName(''); // Reset form
      setIsModalOpen(false); // Close modal
    } catch (error) {
      console.error('Error creating outlet:', error);
    }
  };

  const handleEditStart = (outlet) => {
    setEditingId(outlet.id);
    setEditingName(outlet.name);
  };

  const handleEditSave = async (id) => {
    if (!editingName.trim() || !selectedCompany) return;
    try {
      await updateOutlet(selectedCompany.id, id, { name: editingName.trim() });
      await fetchOutlets();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating outlet:', error);
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
          onClick={() => setIsModalOpen(true)}
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
                  {user?.role === 'super_admin' && editingId === outlet.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleEditSave(outlet.id)}
                      onKeyPress={(e) => e.key === 'Enter' && handleEditSave(outlet.id)}
                      className="w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      autoFocus
                    />
                  ) : (
                    <span>{outlet.name}</span>
                  )}
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
                      {editingId === outlet.id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(outlet.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 transition-colors duration-200"
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditStart(outlet)}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Create New Outlet</h2>
            <form onSubmit={handleCreateOutlet}>
              <div className="mb-4">
                <label htmlFor="outletName" className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                  Outlet Name
                </label>
                <input
                  type="text"
                  id="outletName"
                  value={newOutletName}
                  onChange={(e) => setNewOutletName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Enter outlet name"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
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