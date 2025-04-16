import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password);
      if (!response) {
        throw new Error('Invalid response from server');
      }
      setUser(response);
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(response));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  };

  const logout = () => {
    setUser(null);
    // Remove user from localStorage
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}