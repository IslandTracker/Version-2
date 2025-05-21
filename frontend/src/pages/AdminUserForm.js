import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminUserForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '', // Only used for creating a new user
    is_admin: false
  });
  
  useEffect(() => {
    const verifyAdmin = async () => {
      // Verify admin access
      if (!currentUser?.is_admin) {
        navigate('/admin/login');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin/login');
        return;
      }
    };
    
    verifyAdmin();
    
    // If editing, fetch user data
    if (isEditing) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          
          const response = await axios.get(`${API}/admin/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Remove password from the form data since we don't want to update it
          const { password, ...userData } = response.data;
          
          setFormData(userData);
          setError(null);
        } catch (err) {
          console.error('Error fetching user:', err);
          setError('Failed to load user data. Please try again later.');
          
          // Check if unauthorized
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('token');
            navigate('/admin/login');
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchUser();
    }
  }, [currentUser, navigate, id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      let response;
      
      if (isEditing) {
        // For editing, remove password from payload if it's empty
        const { password, ...payload } = formData;
        
        // Update existing user
        response = await axios.put(`${API}/admin/users/${id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        toast.success('User updated successfully!');
      } else {
        // Validate required fields
        if (!formData.email || !formData.password) {
          setError('Email and password are required');
          toast.error('Email and password are required');
          setSubmitting(false);
          return;
        }
        
        // Create new user
        response = await axios.post(`${API}/admin/users`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        toast.success('User created successfully!');
      }
      
      // Redirect to user list
      navigate('/admin/users');
      
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.detail || 'Failed to save user. Please check your inputs and try again.');
      toast.error(err.response?.data?.detail || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/admin/dashboard" className="font-bold text-xl text-blue-600">
                  IslandLogger Admin
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/admin/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link to="/admin/islands" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Islands
                </Link>
                <Link to="/admin/users" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Users
                </Link>
                <Link to="/admin/blog" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Blog
                </Link>
                <Link to="/admin/challenges" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Challenges
                </Link>
                <Link to="/admin/ads" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Ads
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header className="mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {isEditing ? 'Edit User' : 'Add New User'}
            </h1>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white shadow sm:rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-gray-200 p-6">
                <div className="space-y-8 divide-y divide-gray-200">
                  <div>
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        User Information
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter the details of the user.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="sm:col-span-3">
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password *
                          </label>
                          <div className="mt-1">
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={formData.password}
                              onChange={handleChange}
                              required={!isEditing}
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-6">
                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="is_admin"
                              name="is_admin"
                              type="checkbox"
                              checked={formData.is_admin}
                              onChange={handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="is_admin" className="font-medium text-gray-700">
                              Admin User
                            </label>
                            <p className="text-gray-500">Grant this user admin privileges.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <div className="flex justify-end">
                    <Link
                      to="/admin/users"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminUserForm;