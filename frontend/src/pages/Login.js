import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserIcon, KeyIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      setUsername('');
      setPassword('');
    } catch (error) {
      setError(error);
    }
  };

  const testBackendConnection = async () => {
    try {
      const response = await axios.get(API_URL);
      const data = await response.data;
      alert(`Backend connection successful: ${JSON.stringify(data)}`);
    } catch (error) {
      alert(`Backend connection failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6 p-6 rounded-xl shadow-2xl backdrop-blur-sm border dark:bg-slate-800/50 dark:border-slate-700/50 bg-white border-slate-200">
        <div>
          <h2 className="text-center text-2xl font-bold dark:text-slate-100 text-slate-900">Restime</h2>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-3 rounded-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full pl-10 px-3 py-2 border dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full pl-10 px-3 py-2 border dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-slate-100 border-slate-300 placeholder-slate-500 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-200"
            >
              Sign in
            </button>
          </div>
        </form>
        <button 
          type="button"
          onClick={testBackendConnection}
          className="mt-2 text-sm text-slate-500 dark:text-slate-400 hover:underline w-full text-center"
        >
          Test Backend Connection
        </button>
      </div>
    </div>
  );
}