import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to login
      const formData = new FormData();
      formData.append('username', data.email);
      formData.append('password', data.password);

      // Use direct API call instead of the login function
      console.log("Submitting login request to:", `${API}/token`);
      const response = await axios.post(`${API}/token`, formData, {
        headers: {
          // Don't set Content-Type header - axios will set it correctly with boundary for FormData
          'Accept': 'application/json',
        }
      });
      const { access_token } = response.data;
      
      // Store the token
      localStorage.setItem('token', access_token);
      toast.success('Login successful! Checking admin privileges...');
      
      // Check if user is admin
      const userResponse = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      console.log("User data from API:", userResponse.data);
      console.log("Admin flag value:", userResponse.data.is_admin);
      
      // Use strict comparison with the boolean value true
      if (userResponse.data.is_admin === true) {
        // Successfully authenticated as admin
        console.log("Admin authentication successful, redirecting to dashboard");
        toast.success('Admin privileges confirmed. Redirecting to dashboard...');
        
        // Use replace: true to prevent back navigation to login page
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 1000);
        return;
      }
      
      // Not an admin user
      console.log("User is not an admin:", userResponse.data);
      setError('You do not have administrator privileges');
      toast.error('You do not have administrator privileges');
      localStorage.removeItem('token'); // Remove token for non-admin users
    } catch (err) {
      console.error("Admin login error:", err);
      setError('Failed to login. Please check your credentials and try again.');
      toast.error('Login failed: ' + (err.response?.data?.detail || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your credentials to access the admin portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <form className="mb-0 space-y-6" onSubmit={handleSubmit}>
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
                  value={data.email}
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
                  value={data.password}
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
                  'Login'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Alternative options</span>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col space-y-4">
              <Link 
                to="/debug-login" 
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Debug Login Tool
              </Link>
              
              <Link 
                to="/" 
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;