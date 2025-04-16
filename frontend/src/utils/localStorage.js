// Local storage keys
const STORAGE_KEYS = {
  COMPANIES: 'companies',
  COMPANY_USERS: 'companyUsers',
  OUTLETS: 'outlets',
  SECTIONS: 'sections',
  EMPLOYEES: 'employees',
  DEVICES: 'devices',
};

// Default data
const DEFAULT_DATA = {
  companies: [
    { id: 1, name: 'Company A', active: true },
    { id: 2, name: 'Company B', active: true },
    { id: 3, name: 'Company C', active: false },
  ],
  companyUsers: {
    1: [
      { id: 1, username: 'user1', password: 'pass1', type: 'Admin', outlets: ['All'], active: true },
      { id: 2, username: 'user2', password: 'pass2', type: 'Manager', outlets: ['Outlet 1'], active: true },
    ],
    2: [
      { id: 3, username: 'user3', type: 'Admin', outlets: ['All'], active: true },
    ],
    3: [],
  },
  outlets: {
    'Company A': [
      { id: 1, name: 'Outlet 1', active: true },
      { id: 2, name: 'Outlet 2', active: true },
      { id: 3, name: 'Outlet 3', active: false },
    ],
    'Company B': [],
    'Company C': [],
  },
  sections: {
    'Company A': [
      { id: 1, name: 'Section 1', active: true },
      { id: 2, name: 'Section 2', active: true },
      { id: 3, name: 'Section 3', active: false },
    ],
    'Company B': [],
    'Company C': [],
  },
  employees: {
    'Company A': [
      { 
        id: 101,
        firstName: 'John',
        lastName: 'Doe',
        mobile: '+1234567890',
        email: 'john@example.com',
        arcNumber: 'ARC123',
        type: 'Full-Time',
        section: 'Section 1',
        outlet: 'Outlet 1',
        hourlyPay: 15.00,
        monthlyPay: 2400.00,
        allowOvertime: true,
        monthlyHours: 160,
        clockInNote: 'Regular schedule',
        active: true
      },
    ],
    'Company B': [],
    'Company C': [],
  },
  devices: {
    'Company A': [
      { id: 1, name: 'Device 1', password: 'pass1', outlet: 'Outlet 1', active: true },
      { id: 2, name: 'Device 2', password: 'pass2', outlet: 'Outlet 2', active: true },
      { id: 3, name: 'Device 3', password: 'pass3', outlet: 'Outlet 3', active: false },
    ],
    'Company B': [],
    'Company C': [],
  },
};

// Get data from local storage with fallback to default data
export const getData = (key) => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS[key]);
    return data ? JSON.parse(data) : DEFAULT_DATA[key];
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return DEFAULT_DATA[key];
  }
};

// Save data to local storage
export const saveData = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Initialize all data in local storage if not exists
export const initializeData = () => {
  Object.keys(STORAGE_KEYS).forEach(key => {
    if (!localStorage.getItem(STORAGE_KEYS[key])) {
      saveData(key, DEFAULT_DATA[key.toLowerCase()]);
    }
  });
};