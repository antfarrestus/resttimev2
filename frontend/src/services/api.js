import axios from 'axios';
// Set the API URL based on the environment variable or default to a local server
const API_URL = process.env.REACT_APP_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // Temporarily disable credentials
});

// Add token to requests if provided in session storage
api.interceptors.request.use(
  (config) => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response and store token if present
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.token) {
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response;
  } catch (error) {
    if (!error.response) {
      throw new Error('Network error - Unable to connect to server');
    }
    throw error.response?.data?.message || error.message || 'Login failed';
  }
};

export const logout = () => {
  sessionStorage.removeItem('user');
};

// Companies API
export const getCompanies = async () => {
  try {
    const response = await api.get('/companies');
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
};

export const createCompany = async (companyData) => {
  const response = await api.post('/companies', companyData);
  return response.data;
};

export const updateCompany = async (id, companyData) => {
  const response = await api.put(`/companies/${id}`, companyData);
  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await api.delete(`/companies/${id}`);
  return response.data;
};

// Users API
export const getUsers = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId}/users`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const createUser = async (companyId, userData) => {
  const response = await api.post(`/companies/${companyId}/users`, userData);
  return response.data;
};

export const updateUser = async (companyId, userId, userData) => {
  const response = await api.put(`/companies/${companyId}/users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (companyId, userId) => {
  const response = await api.delete(`/companies/${companyId}/users/${userId}`);
  return response.data;
};

// Outlets API
export const getOutlets = async (companyId) => {
  try {
    const id = companyId.id || companyId;
    const response = await api.get(`/companies/${id}/outlets`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching outlets:', error);
    return [];
  }
};

export const createOutlet = async (companyId, outletData) => {
  const response = await api.post(`/companies/${companyId}/outlets`, outletData);
  return response.data;
};

export const updateOutlet = async (companyId, outletId, outletData) => {
  const response = await api.put(`/companies/${companyId}/outlets/${outletId}`, outletData);
  return response.data;
};

export const deleteOutlet = async (companyId, outletId) => {
  const response = await api.delete(`/companies/${companyId}/outlets/${outletId}`);
  return response.data;
};

// Devices API
export const getDevices = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId}/devices`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
};

export const createDevice = async (companyId, deviceData) => {
  try {
    const response = await api.post(`/companies/${companyId}/devices`, deviceData);
    return response;
  } catch (error) {
    console.error('Error creating device:', error);
    throw error.response?.data?.message || error.message || 'Failed to create device';
  }
};

export const updateDevice = async (companyId, deviceId, deviceData) => {
  try {
    const response = await api.put(`/companies/${companyId}/devices/${deviceId}`, deviceData);
    return response;
  } catch (error) {
    console.error('Error updating device:', error);
    throw error.response?.data?.message || error.message || 'Failed to update device';
  }
};

export const deleteDevice = async (companyId, deviceId) => {
  try {
    const response = await api.delete(`/companies/${companyId}/devices/${deviceId}`);
    return response;
  } catch (error) {
    console.error('Error deleting device:', error);
    throw error.response?.data?.message || error.message || 'Failed to delete device';
  }
};

// Sections API
export const getSections = async (companyId) => {
  try {
    const id = companyId.id || companyId;
    const response = await api.get(`/companies/${id}/sections`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
};

export const createSection = async (companyId, sectionData) => {
  try {
    const response = await api.post(`/companies/${companyId}/sections`, sectionData);
    return response;
  } catch (error) {
    console.error('Error creating section:', error);
    throw error.response?.data?.message || error.message || 'Failed to create section';
  }
};

export const updateSection = async (companyId, sectionId, sectionData) => {
  try {
    const response = await api.put(`/companies/${companyId}/sections/${sectionId}`, sectionData);
    return response;
  } catch (error) {
    console.error('Error updating section:', error);
    throw error.response?.data?.message || error.message || 'Failed to update section';
  }
};

export const deleteSection = async (companyId, sectionId) => {
  try {
    const response = await api.delete(`/companies/${companyId}/sections/${sectionId}`);
    return response;
  } catch (error) {
    console.error('Error deleting section:', error);
    throw error.response?.data?.message || error.message || 'Failed to delete section';
  }
};

// Shifts API
export const getShifts = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId}/shifts`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return [];
  }
};

export const createShift = async (companyId, shiftData) => {
  try {
    const response = await api.post(`/companies/${companyId}/shifts`, shiftData);
    return response;
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error.response?.data?.message || error.message || 'Failed to create shift';
  }
};

export const updateShift = async (companyId, shiftId, shiftData) => {
  try {
    const response = await api.put(`/companies/${companyId}/shifts/${shiftId}`, shiftData);
    return response;
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error.response?.data?.message || error.message || 'Failed to update shift';
  }
};

export const deleteShift = async (companyId, shiftId) => {
  try {
    const response = await api.delete(`/companies/${companyId}/shifts/${shiftId}`);
    return response;
  } catch (error) {
    console.error('Error deleting shift:', error);
    throw error.response?.data?.message || error.message || 'Failed to delete shift';
  }
};

// Employees API
export const getEmployees = async (companyId) => {
  try {
    const response = await api.get(`/companies/${companyId.id || companyId}/employees`);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

export const createEmployee = async (companyId, employeeData) => {
  try {
    const response = await api.post(`/companies/${companyId.id || companyId}/employees`, employeeData);
    return response;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error.response?.data?.message || error.message || 'Failed to create employee';
  }
};

export const updateEmployee = async (companyId, employeeId, employeeData) => {
  try {
    const id = companyId.id || companyId;
    const response = await api.put(`/companies/${id}/employees/${employeeId}`, employeeData);
    return response;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error.response?.data?.message || error.message || 'Failed to update employee';
  }
};

export const deleteEmployee = async (companyId, employeeId) => {
  try {
    const id = companyId.id || companyId;
    const response = await api.delete(`/companies/${id}/employees/${employeeId}`);
    return response;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error.response?.data?.message || error.message || 'Failed to delete employee';
  }
};

// Schedules API
export const getSchedules = async (companyId, outletId, weekStart) => {
  try {
    const response = await api.get(`/companies/${companyId}/outlets/${outletId}/schedules`, {
      params: { weekStart }
    });
    return response || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
};

export const createSchedule = async (companyId, scheduleData) => {
  try {
    // Log the data being sent to help with debugging
    console.log('Sending schedule data to API:', scheduleData);
    
    // Ensure all IDs are integers and numeric values are properly formatted
    const formattedData = {
      ...scheduleData,
      employeeId: parseInt(scheduleData.employeeId),
      companyId: parseInt(companyId),
      outletId: parseInt(scheduleData.outletId),
      shiftRate: parseFloat(scheduleData.shiftRate) || 0.00,
      duration: parseFloat(scheduleData.duration) || 0.00,
      breaks: Array.isArray(scheduleData.breaks) ? scheduleData.breaks.map(breakItem => ({
        ...breakItem,
        duration: parseFloat(breakItem.duration) || 0.00
      })) : []
    };
    
    const response = await api.post(`/companies/${companyId}/schedules`, formattedData);
    return response;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error.response?.data?.message || error.message || 'Failed to create schedule';
  }
};

export const updateSchedule = async (companyId, id, scheduleData) => {
  try {
    const formattedData = {
      ...scheduleData,
      breaks: scheduleData.breaks ? scheduleData.breaks.map(breakItem => ({
        startTime: breakItem.startTime,
        endTime: breakItem.endTime,
        duration: parseFloat(breakItem.duration) || 0.00,
        paid: Boolean(breakItem.paid)
      })) : []
    };
    
    const response = await api.put(`/schedules/${id}`, formattedData);
    return response;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error.response?.data?.message || error.message || 'Failed to update schedule';
  }
};

export const deleteSchedule = async (id) => {
  try {
    const response = await api.delete(`/schedules/${id}`);
    return response;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error.response?.data?.message || error.message || 'Failed to delete schedule';
  }
};