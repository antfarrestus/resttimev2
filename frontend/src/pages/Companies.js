import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from '@headlessui/react';
import { PlusIcon, PencilSquareIcon, TrashIcon, UsersIcon, EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getCompanies, createCompany, updateCompany, deleteCompany, getUsers, createUser, updateUser, deleteUser, getOutlets } from '../services/api';

export default function Companies({ darkMode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const [companyUsers, setCompanyUsers] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [passwordReplaced, setPasswordReplaced] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    type: 'Admin',
    outlets: [],
    showOutletDropdown: false
  });
  const [editingUser, setEditingUser] = useState(null);
  const handleChangePassword = (e) => {
    const newPassword = e.target.value;

    // If the password is being typed after selecting the field (or it was previously empty)
    if (!passwordReplaced && newPassword !== '') {
      setPasswordReplaced(true);
    }

    setEditingUser({ ...editingUser, password: newPassword });
  };

  const [companyOutlets, setCompanyOutlets] = useState([]);
  const [allCompanyOutlets, setAllCompanyOutlets] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const userTypes = ['Admin', 'Manager'];

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

  const fetchCompanyOutlets = async (companyId) => {
    try {
      const response = await getOutlets(companyId);
      const activeOutlets = response.filter(outlet => outlet.active);
      setCompanyOutlets(activeOutlets);
      return activeOutlets;
    } catch (error) {
      console.error('Error fetching company outlets:', error);
      setCompanyOutlets([]);
      return [];
    }
  };

  // Fetch outlets for all companies when companies are loaded
  useEffect(() => {
    const fetchAllOutlets = async () => {
      try {
        const outletsPromises = companies.map(async company => {
          const outlets = await getOutlets(company.id);
          return {
            companyId: company.id,
            outlets: outlets.filter(outlet => outlet.active)
          };
        });
        const allOutlets = await Promise.all(outletsPromises);
        const outletsMap = {};
        allOutlets.forEach(({ companyId, outlets }) => {
          outletsMap[companyId] = outlets;
        });
        setAllCompanyOutlets(outletsMap);
      } catch (error) {
        console.error('Error fetching all outlets:', error);
      }
    };

    if (companies.length > 0) {
      fetchAllOutlets();
    }
  }, [companies]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch user counts for all companies when companies are loaded
  useEffect(() => {
    const fetchAllUserCounts = async () => {
      try {
        const userCountsPromises = companies.map(async company => {
          const users = await getUsers(company.id);
          return {
            companyId: company.id,
            users: Array.isArray(users) ? users : []
          };
        });
        const userCounts = await Promise.all(userCountsPromises);
        const userCountsMap = {};
        userCounts.forEach(({ companyId, users }) => {
          userCountsMap[companyId] = users;
        });
        setCompanyUsers(userCountsMap);
      } catch (error) {
        console.error('Error fetching user counts:', error);
      }
    };

    if (companies.length > 0) {
      fetchAllUserCounts();
    }
  }, [companies]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCompanies();
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Failed to fetch companies. Please try again later.');
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (expandedCompanyId) {
      fetchCompanyUsers(expandedCompanyId);
    }
  }, [expandedCompanyId]);

  const fetchCompanyUsers = async (companyId) => {
    try {
      const users = await getUsers(companyId);
      setCompanyUsers(prev => ({
        ...prev,
        [companyId]: Array.isArray(users) ? users : []
      }));
    } catch (error) {
      console.error('Error fetching company users:', error);
      setCompanyUsers(prev => ({ ...prev, [companyId]: [] }));
    }
  };

  // Only super_admin can access this page
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 dark:text-slate-400">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Loading companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className={`text-lg ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
      </div>
    );
  }

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    try {
      await createCompany({ name: newCompanyName.trim(), active: true });
      await fetchCompanies();
      window.dispatchEvent(new Event('companiesChanged'));
      setNewCompanyName('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const handleEditStart = (company) => {
    setEditingId(company.id);
    setEditingName(company.name);
  };

  const handleEditSave = async (id) => {
    if (!editingName.trim()) return;
    try {
      await updateCompany(id, { name: editingName.trim() });
      await fetchCompanies();
      window.dispatchEvent(new Event('companiesChanged'));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating company:', error);
    }
  };

  const handleToggleActive = async (id) => {
    const company = companies.find(c => c.id === id);
    try {
      await updateCompany(id, { active: !company.active });
      await fetchCompanies();
      window.dispatchEvent(new Event('companiesChanged'));
    } catch (error) {
      console.error('Error toggling company status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteCompany(id);
        await fetchCompanies();
        window.dispatchEvent(new Event('companiesChanged'));
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleCreateUser = async (companyId) => {
    if (
      !newUserData.username.trim() ||
      !newUserData.password.trim() ||
      (newUserData.type !== 'Admin' && !newUserData.outlets.length)
    ) return;

    try {
      const userData = {
        username: newUserData.username,
        password: newUserData.password,
        type: newUserData.type,
        outlets: newUserData.type === 'Admin'
          ? companyOutlets.map(o => o.id).join(',')
          : newUserData.outlets
            .map(outletName => {
              const outlet = companyOutlets.find(o => o.name === outletName);
              return outlet ? outlet.id : null;
            })
            .filter(id => id !== null)
            .join(','),
        active: true
      };

      await createUser(companyId, userData);
      await fetchCompanyUsers(companyId);

      setNewUserData({
        username: '',
        password: '',
        type: 'Admin',
        outlets: [],
      });

      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + (error.response?.data?.message || error.message));
    }
  };


  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      const userData = {
        username: editingUser.username,
        password: editingUser.password,
        type: editingUser.type,
        outlets: editingUser.type === 'Admin' ? companyOutlets.map(o => o.id).join(',') : editingUser.outlets.map(outletName => {
          const outlet = companyOutlets.find(o => o.name === outletName);
          return outlet ? outlet.id : null;
        }).filter(id => id !== null).join(','),
      };
      await updateUser(editingUser.companyId, editingUser.id, userData);
      await fetchCompanyUsers(editingUser.companyId);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleEditUser = async (companyId, user) => {
    try {
      // Reset visibility flags on edit start
      setShowEditPassword(false);
      setPasswordReplaced(false);

      const outlets = await getOutlets(companyId);
      setCompanyOutlets(outlets.filter(outlet => outlet.active));

      const userOutlets = user.outletAccess === 'All'
        ? ['All']
        : user.outletAccess
          ? user.outletAccess.split(',').map(id => {
            const outlet = outlets.find(o => o.id.toString() === id);
            return outlet ? outlet.name : null;
          }).filter(name => name !== null)
          : [];

      setEditingUser({
        ...user,
        companyId,
        type: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        outlets: userOutlets
      });
    } catch (error) {
      console.error('Error fetching outlets for user editing:', error);
    }
  };

  const handleToggleUserActive = async (companyId, userId) => {
    const user = companyUsers[companyId].find(u => u.id === userId);
    try {
      await updateUser(companyId, userId, { active: !user.active });
      await fetchCompanyUsers(companyId);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (companyId, userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(companyId, userId);
        await fetchCompanyUsers(companyId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Companies</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Company
        </button>
      </div>

      {/* Companies Table */}
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
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white/80 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700/50">
            {sortData(companies, sortConfig.key, sortConfig.direction).map((company) => (
              <>
                <tr key={company.id} className="hover:dark:bg-slate-700/30 hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">{company.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-slate-300 text-slate-900">
                    {editingId === company.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        autoFocus
                      />
                    ) : (
                      <span>{company.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => handleToggleActive(company.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${company.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                    >
                      {company.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => setExpandedCompanyId(expandedCompanyId === company.id ? null : company.id)}
                      className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200 flex items-center justify-center space-x-2 mx-auto"
                    >
                      <UsersIcon className="h-5 w-5" />
                      <span>{companyUsers[company.id]?.length || 0} users</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className="flex justify-end space-x-3">
                      {editingId === company.id ? (
                        <>
                          <button
                            onClick={() => handleEditSave(company.id)}
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
                          onClick={() => handleEditStart(company)}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedCompanyId === company.id && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium dark:text-slate-100">Users</h3>
                          <button
                            onClick={() => {
                              setSelectedCompanyId(company.id);
                              fetchCompanyOutlets(company.id);
                              setIsUserModalOpen(true);
                            }}
                            className="flex items-center px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 text-sm"
                          >
                            <PlusIcon className="h-4 w-4 mr-1.5" />
                            Add User
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y dark:divide-slate-700/50 divide-slate-200">
                            <thead>
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium dark:text-slate-400 text-slate-500">Username</th>
                                <th className="px-4 py-2 text-left text-xs font-medium dark:text-slate-400 text-slate-500">Password</th>
                                <th className="px-4 py-2 text-left text-xs font-medium dark:text-slate-400 text-slate-500">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium dark:text-slate-400 text-slate-500">Outlets</th>
                                <th className="px-4 py-2 text-center text-xs font-medium dark:text-slate-400 text-slate-500">Status</th>
                                <th className="px-4 py-2 text-right text-xs font-medium dark:text-slate-400 text-slate-500">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-700/50 divide-slate-200">
                              {companyUsers[company.id]?.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/30">
                                  <td className="px-4 py-2 text-sm dark:text-slate-300">
                                    {editingUser?.id === user.id ? (
                                      <input
                                        type="text"
                                        value={editingUser.username}
                                        onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                        className="w-32 min-w-0 px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                      />
                                    ) : user.username}
                                  </td>
                                  <td className="px-4 py-2 text-sm dark:text-slate-300">
                                    {editingUser?.id === user.id ? (
                                      <div className="relative w-32">
                                        <input
                                          type={
                                            passwordReplaced
                                              ? (showEditPassword ? 'text' : 'password')
                                              : 'password'
                                          }
                                          value={editingUser.password}
                                          onChange={handleChangePassword}
                                          className="w-full min-w-0 px-2 py-1 pr-8 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setShowEditPassword(prev => !prev)}
                                          className={`absolute right-1 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-300 ${!passwordReplaced ? 'cursor-not-allowed opacity-50' : ''
                                            }`}
                                          disabled={!passwordReplaced}
                                        >
                                          {showEditPassword ? (
                                            <EyeSlashIcon className="h-4 w-4" />
                                          ) : (
                                            <EyeIcon className="h-4 w-4" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      '•••••'
                                    )}
                                  </td>

                                  <td className="px-4 py-2 text-sm dark:text-slate-300">
                                    {editingUser?.id === user.id ? (
                                      <select
                                        value={editingUser.type}
                                        onChange={(e) => {
                                          const newType = e.target.value;
                                          setEditingUser({
                                            ...editingUser,
                                            type: newType,
                                            outlets: newType === 'Admin' ? ['All'] : []
                                          });
                                        }}
                                        className="w-32 min-w-0 px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                      >
                                        {userTypes.map((type) => (
                                          <option key={type} value={type}>{type}</option>
                                        ))}
                                      </select>
                                    ) : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </td>
                                  <td className="px-4 py-2 text-sm dark:text-slate-300">
                                    {editingUser?.id === user.id ? (
                                      <div className="relative">
                                        <Menu as="div" className="relative inline-block text-left w-full">
                                          <Menu.Button className="w-32 min-w-0 px-2 py-1 rounded border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 text-left">
                                            {editingUser.type === 'Admin' || editingUser.outlets.includes('All') ? 'All Outlets' : `${editingUser.outlets.length} selected`}
                                          </Menu.Button>
                                          <Menu.Items className="absolute z-10 mt-1 w-56 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="p-2 space-y-1">
                                              {editingUser.type === 'Admin' ? (
                                                <div className="px-4 py-2 text-sm dark:text-slate-300 text-slate-700">All Outlets (Admin)</div>
                                              ) : (
                                                <>
                                                  <label className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                                                    <input
                                                      type="checkbox"
                                                      checked={editingUser.outlets.includes('All')}
                                                      onChange={(e) => {
                                                        if (e.target.checked) {
                                                          setEditingUser({ ...editingUser, outlets: ['All'] });
                                                        } else {
                                                          setEditingUser({ ...editingUser, outlets: [] });
                                                        }
                                                      }}
                                                      className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                                                    />
                                                    <span className="text-sm dark:text-slate-300 text-slate-700">All Outlets</span>
                                                  </label>
                                                  {companyOutlets.map((outlet) => (
                                                    <label key={outlet.id} className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded">
                                                      <input
                                                        type="checkbox"
                                                        checked={editingUser.outlets.includes(outlet.name) || editingUser.outlets.includes('All')}
                                                        onChange={(e) => {
                                                          if (e.target.checked) {
                                                            const newOutlets = [...editingUser.outlets.filter(o => o !== 'All'), outlet.name];
                                                            if (newOutlets.length === companyOutlets.length) {
                                                              setEditingUser({ ...editingUser, outlets: ['All'] });
                                                            } else {
                                                              setEditingUser({ ...editingUser, outlets: newOutlets });
                                                            }
                                                          } else {
                                                            const newOutlets = editingUser.outlets.filter(o => o !== 'All' && o !== outlet.name);
                                                            setEditingUser({ ...editingUser, outlets: newOutlets });
                                                          }
                                                        }}
                                                        disabled={editingUser.outlets.includes('All')}
                                                        className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                                                      />
                                                      <span className="text-sm dark:text-slate-300 text-slate-700">{outlet.name}</span>
                                                    </label>
                                                  ))}
                                                </>
                                              )}
                                            </div>
                                          </Menu.Items>
                                        </Menu>
                                      </div>
                                    ) : (user.outletAccess === 'All' || user.role === 'admin' ? 'All Outlets' : (user.outletAccess ? user.outletAccess.split(',').map(id => {
                                      const outlet = allCompanyOutlets[company.id]?.find(o => o.id === parseInt(id));
                                      return outlet ? outlet.name : id;
                                    }).join(', ') : '-'))}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-center">
                                    <button
                                      onClick={() => handleToggleUserActive(company.id, user.id)}
                                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400'}`}
                                    >
                                      {user.active ? 'Active' : 'Disabled'}
                                    </button>
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex space-x-2 justify-end">
                                      {editingUser?.id === user.id ? (
                                        <>
                                          <button
                                            onClick={handleSaveUser}
                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 transition-colors duration-200"
                                          >
                                            <CheckIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={handleCancelEdit}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                                          >
                                            <XMarkIcon className="h-4 w-4" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleEditUser(company.id, user)}
                                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors duration-200"
                                          >
                                            <PencilSquareIcon className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteUser(company.id, user.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition-colors duration-200"
                                          >
                                            <TrashIcon className="h-4 w-4" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Create New Company</h2>
            <form onSubmit={handleCreateCompany}>
              <div className="mb-4">
                <label htmlFor="companyName" className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
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

      {/* Create User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Create New User</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(selectedCompanyId); }}>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={newUserData.username}
                      onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      required
                    />
                  </div>

                  <div className="w-1/2">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newUserData.password}
                        onChange={(e) =>
                          setNewUserData({ ...newUserData, password: e.target.value })
                        }
                        className="w-full px-3 py-2 pr-10 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-slate-300"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Type
                    </label>
                    <select
                      value={newUserData.type}
                      onChange={(e) => setNewUserData({ ...newUserData, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 cursor-pointer"
                    >
                      {userTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-1/2">
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Outlets
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setNewUserData({ ...newUserData, showOutletDropdown: !newUserData.showOutletDropdown })}
                        className="w-full px-3 py-2 rounded-lg border dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 text-left flex justify-between items-center"
                      >
                        <span>{newUserData.outlets.length ? (newUserData.outlets.includes('All') ? 'All Outlets' : `${newUserData.outlets.length} selected`) : 'Select outlets'}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${newUserData.showOutletDropdown ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {newUserData.showOutletDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border dark:border-slate-600 border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          <div className="p-2 space-y-1">
                            <label className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newUserData.outlets.includes('All')}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUserData({ ...newUserData, outlets: ['All'] });
                                  } else {
                                    setNewUserData({ ...newUserData, outlets: [] });
                                  }
                                }}
                                disabled={newUserData.type === 'Admin'}
                                className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                              />
                              <span className="text-sm dark:text-slate-300 text-slate-700">Select All</span>
                            </label>
                            {companyOutlets.map((outlet) => (
                              <label key={outlet.id} className="flex items-center space-x-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={newUserData.outlets.includes(outlet.name) || newUserData.outlets.includes('All')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newOutlets = [...newUserData.outlets.filter(o => o !== 'All'), outlet.name];
                                      if (newOutlets.length === companyOutlets.length) {
                                        setNewUserData({ ...newUserData, outlets: ['All'] });
                                      } else {
                                        setNewUserData({ ...newUserData, outlets: newOutlets });
                                      }
                                    } else {
                                      const newOutlets = newUserData.outlets.filter(o => o !== 'All' && o !== outlet.name);
                                      setNewUserData({ ...newUserData, outlets: newOutlets });
                                    }
                                  }}
                                  disabled={newUserData.type === 'Admin'}
                                  className="rounded border-slate-300 text-slate-600 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-700"
                                />
                                <span className="text-sm dark:text-slate-300 text-slate-700">{outlet.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
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
