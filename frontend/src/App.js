import { useState, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { getCompanies } from './services/api';
import { ArrowRightOnRectangleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';
import Login from './pages/Login';
import Companies from './pages/Companies';
import Outlets from './pages/Outlets';
import Devices from './pages/Devices';
import Sections from './pages/Sections';
import Shifts from './pages/Shifts';
import Employees from './pages/Employees';
import Schedule from './pages/Schedule';

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    // Get dark mode preference from localStorage or default to false
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    // Get current page from localStorage or default to 'Companies'
    const savedPage = localStorage.getItem('currentPage');
    return savedPage || 'Companies';
  });
  const { user, logout } = useAuth();
  const { companies, selectedCompany, selectCompany } = useCompany();
  const navItems = user?.role === 'super_admin' 
    ? ['Schedule', 'Companies', 'Outlets', 'Devices', 'Sections', 'Shifts', 'Employees']
    : user?.role === 'admin'
    ? ['Schedule', 'Outlets', 'Devices', 'Sections', 'Shifts', 'Employees']
    : ['Schedule', 'Sections', 'Shifts', 'Employees'];

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    // Save dark mode preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  if (!user) {
    return <Login />;
  }

  const handleLogout = () => {
    logout();
  };

  const handleCompanySelect = (company) => {
    if (company === 'No Company Selected') return;
    selectCompany(company);
    // Dispatch custom event for instant updates
    window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} flex flex-col transition-colors duration-200`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700/50' : 'bg-gradient-to-r from-slate-100 to-white border-slate-200'} border-b backdrop-blur-xl transition-colors duration-200`}>
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-full ${darkMode ? 'hover:bg-slate-700/50 text-slate-300 hover:text-slate-100' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-800'} transition-colors duration-200`}
            >
              {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
          </div>
          <button 
            onClick={handleLogout}
            className={`p-2.5 rounded-full ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-200'} transition-colors duration-200`}
          >
            <ArrowRightOnRectangleIcon className={`h-6 w-6 ${darkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-800'}`} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 ${darkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-200'} backdrop-blur-sm border-r flex flex-col transition-all duration-200 fixed h-[calc(100vh-4rem)] top-18`}>
          <div className={`flex justify-end p-4 border-b ${darkMode ? 'border-slate-700/50' : 'border-white'}`}>
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-slate-700/50 text-slate-300 hover:text-slate-100' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-800'} transition-colors duration-200`}
            >
              {isSidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                </svg>
              )}
            </button>
          </div>
          <nav className="flex-1 mt-1 px-3 space-y-1.5">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCurrentPage(item);
                  localStorage.setItem('currentPage', item);
                }}
                className={`w-full text-left px-4 py-3 ${darkMode ? `${currentPage === item ? 'bg-slate-700/50 text-slate-100' : 'text-slate-300 hover:bg-slate-700/50 hover:text-slate-100'}` : `${currentPage === item ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`} rounded-lg transition-all duration-200 font-medium flex items-center space-x-3 group`}
              >
                {isSidebarCollapsed ? item.charAt(0) : item}
              </button>
            ))}
          </nav>
          {!isSidebarCollapsed && (
            <div className={`p-4 mb-4 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
              {user?.role === 'super_admin' ? (
                <Menu as="div" className="relative inline-block text-left w-full">
                  {({ open }) => (
                    <>
                      <Menu.Button
                        className={`w-full inline-flex justify-center rounded-lg border ${darkMode ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 hover:bg-slate-600/50 hover:border-slate-600/50' : 'border-slate-600 bg-slate-600 text-slate-100 hover:bg-slate-700 hover:border-slate-700'} shadow-lg px-4 py-2.5 backdrop-blur-sm text-sm font-medium focus:outline-none focus:ring-slate-500`}
                        onClick={() => {
                          if (!open) {
                            // Reset search when opening the dropdown
                            window.companySearchTerm = '';
                          }
                        }}
                      >
                        {selectedCompany ? selectedCompany.name : 'No Company Selected'}
                      </Menu.Button>
                      <Menu.Items 
                        className={`absolute right-0 bottom-full w-full mb-2 origin-bottom-right rounded-lg shadow-lg ${darkMode ? 'bg-slate-800 border border-slate-700/50' : 'bg-white border border-slate-200'} focus:outline-none`}
                        onTransitionEnd={() => {
                          // Reset search when dropdown is closed
                          if (!open) {
                            window.companySearchTerm = '';
                            // Force re-render to show all companies
                            document.dispatchEvent(new Event('companySearch'));
                          }
                        }}
                      >
                        <div className="py-1">
                          {companies.length > 0 ? (
                            <>
                              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                {companies
                                  .filter(company => {
                                    const searchTerm = (window.companySearchTerm || '').toLowerCase();
                                    return company.name.toLowerCase().includes(searchTerm);
                                  })
                                  .map((company) => (
                                    <Menu.Item key={company.id}>
                                      {({ active }) => (
                                        <button
                                          onClick={() => {
                                            handleCompanySelect(company);
                                            // Reset search when selecting a company
                                            window.companySearchTerm = '';
                                          }}
                                          className={`${active ? (darkMode ? 'bg-slate-700/50 text-slate-100' : 'bg-slate-100 text-slate-900') : (darkMode ? 'text-slate-100' : 'text-slate-700')} group flex w-full items-center px-4 py-2 text-sm`}
                                        >
                                          {company.name}
                                        </button>
                                      )}
                                    </Menu.Item>
                                  ))}
                              </div>
                              <div className={`pt-2 pb-1 px-4 border-t ${darkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
                                <input
                                  type="text"
                                  value={window.companySearchTerm || ''}
                                  placeholder="Search companies..."
                                  className={`w-full px-3 py-1.5 text-sm rounded border ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder-slate-400' : 'bg-white border-slate-300 text-slate-700 placeholder-slate-400'} focus:outline-none focus:ring-1 focus:ring-slate-500`}
                                  onChange={(e) => { 
                                    window.companySearchTerm = e.target.value; 
                                    document.dispatchEvent(new Event('companySearch')); 
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </>
                          ) : (
                            <Menu.Item>
                              {({ active }) => (
                                <div className={`${active ? (darkMode ? 'bg-slate-700/50 text-slate-100' : 'bg-slate-100 text-slate-900') : (darkMode ? 'text-slate-100' : 'text-slate-700')} px-4 py-2 text-sm`}>
                                  No companies available
                                </div>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                      </Menu.Items>
                    </>
                  )}
                </Menu>
              ) : (
                <div className={`w-full inline-flex justify-center rounded-lg border ${darkMode ? 'border-slate-600/50 bg-slate-700/50 text-slate-200' : 'border-slate-600 bg-slate-600 text-slate-200'} shadow-lg px-4 py-2.5 backdrop-blur-sm text-sm font-medium`}>
                  {selectedCompany ? selectedCompany.name : 'No Company Selected'}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-8 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {currentPage === 'Companies' && <Companies darkMode={darkMode} />}
          {currentPage === 'Outlets' && <Outlets darkMode={darkMode} />}
          {currentPage === 'Devices' && <Devices darkMode={darkMode} />}
          {currentPage === 'Sections' && <Sections darkMode={darkMode} />}
          {currentPage === 'Shifts' && <Shifts darkMode={darkMode} />}
          {currentPage === 'Employees' && <Employees darkMode={darkMode} />}
          {currentPage === 'Schedule' && <Schedule darkMode={darkMode} />}
          {currentPage !== 'Companies' && currentPage !== 'Outlets' && currentPage !== 'Devices' && 
           currentPage !== 'Sections' && currentPage !== 'Shifts' && currentPage !== 'Employees' && 
           currentPage !== 'Schedule' && (
            <div className={`${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <h1 className="text-2xl font-bold">Welcome to Dashboard</h1>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <AppContent />
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
