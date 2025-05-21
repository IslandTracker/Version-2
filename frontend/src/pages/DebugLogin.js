import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DebugLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    backendUrl: BACKEND_URL,
    apiUrl: API,
    tokenStatus: 'Not checked',
    userInfo: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to login
      const formData = new FormData();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      console.log("Submitting admin login request to:", `${API}/token`);
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'Requesting token...'
      }));
      
      const response = await axios.post(`${API}/token`, formData, {
        headers: { 'Accept': 'application/json' }
      });
      
      const { access_token } = response.data;
      
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'Token obtained successfully',
        token: access_token.substring(0, 20) + '...' // Show just the beginning of the token
      }));
      
      // Store the token
      localStorage.setItem('token', access_token);
      
      // Check if user is admin
      const userResponse = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const userData = userResponse.data;
      setDebugInfo(prev => ({
        ...prev,
        userInfo: userData
      }));
      
      console.log("User data from API:", userData);
      
      toast.success(`Successfully logged in as ${userData.email}`);
      
      // Check if admin
      if (userData.is_admin === true) {
        toast.success('Admin privileges detected. Redirecting to admin dashboard...');
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 3000); // Give time to see the debug info
      } else {
        toast.warning('No admin privileges detected');
      }
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'Error obtaining token',
        error: err.message,
        errorDetails: err.response?.data
      }));
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  const checkToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'No token found in localStorage'
      }));
      return;
    }
    
    try {
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'Checking token validity...'
      }));
      
      const userResponse = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userData = userResponse.data;
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'Token is valid',
        userInfo: userData
      }));
      
      toast.success(`Token is valid for ${userData.email}`);
    } catch (err) {
      setDebugInfo(prev => ({
        ...prev,
        tokenStatus: 'Token is invalid or expired',
        error: err.message
      }));
      
      toast.error('Token is invalid or expired');
    }
  };
  
  const clearToken = () => {
    localStorage.removeItem('token');
    setDebugInfo(prev => ({
      ...prev,
      tokenStatus: 'Token cleared from localStorage',
      userInfo: null
    }));
    toast.info('Token cleared from localStorage');
  };
  
  const goToAdminDashboard = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Debug Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Use this page to debug admin login issues
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="mb-8 space-y-6" onSubmit={handleAdminLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={credentials.email}
                  onChange={handleChange}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={credentials.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-2 text-sm text-red-600 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging In...
                  </span>
                ) : (
                  'Login as Admin'
                )}
              </button>
            </div>
          </form>
          
          <div className="flex space-x-2">
            <button
              onClick={checkToken}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Check Token
            </button>
            
            <button
              onClick={clearToken}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear Token
            </button>
            
            <button
              onClick={goToAdminDashboard}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Go to Admin
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-medium text-gray-900">Debug Information</h3>
            <pre className="mt-2 text-xs whitespace-pre-wrap overflow-auto max-h-60">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugLogin;