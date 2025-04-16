import { createContext, useContext, useState, useEffect } from 'react';
import { getCompanies } from '../services/api';
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { user } = useAuth();

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      if (Array.isArray(data)) {
        const activeCompanies = data.filter(company => company.active)
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort companies alphabetically by name
        setCompanies(activeCompanies);
        
        if (user?.role === 'super_admin') {
          // For super_admin, try to restore previous selection
          const savedCompanyId = localStorage.getItem('selectedCompanyId');
          if (savedCompanyId) {
            const savedCompany = activeCompanies.find(c => c.id.toString() === savedCompanyId);
            if (savedCompany) {
              setSelectedCompany(savedCompany);
              return;
            }
          }
          
          // If no valid saved selection, select first company
          if (activeCompanies.length > 0) {
            setSelectedCompany(activeCompanies[0]);
            localStorage.setItem('selectedCompanyId', activeCompanies[0].id.toString());
          }
        } else if (user?.companyId) {
          // For regular users, set their assigned company
          const userCompany = activeCompanies.find(c => c.id === user.companyId);
          if (userCompany) {
            setSelectedCompany(userCompany);
            localStorage.setItem('selectedCompanyId', userCompany.id.toString());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
      setSelectedCompany(null);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [user]); // Re-fetch when user changes

  // Listen for companiesChanged event
  useEffect(() => {
    const handleCompaniesChanged = async () => {
      try {
        const data = await getCompanies();
        if (Array.isArray(data)) {
          // Find the newest company (assuming higher ID means newer)
          const newestCompany = data.reduce((newest, company) => {
            return (!newest || company.id > newest.id) ? company : newest;
          }, null);
          
          // Filter active companies and sort alphabetically
          const activeCompanies = data.filter(company => company.active)
            .sort((a, b) => a.name.localeCompare(b.name)); // Sort companies alphabetically by name
          setCompanies(activeCompanies);
          
          // If user is super_admin and there are companies, select the newest one
          if (user?.role === 'super_admin' && activeCompanies.length > 0 && newestCompany) {
            // Find the newest company in the active companies list
            const activeNewestCompany = activeCompanies.find(c => c.id === newestCompany.id);
            if (activeNewestCompany) {
              setSelectedCompany(activeNewestCompany);
              localStorage.setItem('selectedCompanyId', activeNewestCompany.id.toString());
              // Dispatch company changed event to update other components
              window.dispatchEvent(new CustomEvent('companyChanged', { detail: activeNewestCompany }));
            }
          }
        }
      } catch (error) {
        console.error('Error handling companies changed:', error);
      }
    };

    window.addEventListener('companiesChanged', handleCompaniesChanged);
    return () => window.removeEventListener('companiesChanged', handleCompaniesChanged);
  }, [user]); // Re-add event listener when user changes

  const selectCompany = (company) => {
    if (user?.role !== 'super_admin') return; // Only super_admin can change companies
    
    setSelectedCompany(company);
    if (company) {
      localStorage.setItem('selectedCompanyId', company.id.toString());
      window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  };

  return (
    <CompanyContext.Provider value={{ 
      companies,
      selectedCompany,
      selectCompany,
      refreshCompanies: fetchCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}