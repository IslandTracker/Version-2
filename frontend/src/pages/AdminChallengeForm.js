import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminChallengeForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: {
      atoll: '',
      island_type: '',
      count: 3
    },
    duration_days: 90,
    reward: {
      badge: '',
      points: 500
    },
    image_url: '',
    is_active: true
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
    
    // If editing, fetch challenge data
    if (isEditing) {
      const fetchChallenge = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          
          const response = await axios.get(`${API}/challenges/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          setFormData(response.data);
          setError(null);
        } catch (err) {
          console.error('Error fetching challenge:', err);
          setError('Failed to load challenge data. Please try again later.');
          
          // Check if unauthorized
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('token');
            navigate('/admin/login');
          }
        } finally {
          setLoading(false);
        }
      };
      
      fetchChallenge();
    }
  }, [currentUser, navigate, id, isEditing]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (e.g., objective.count, reward.points)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'number' ? parseInt(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : 
                type === 'number' ? parseInt(value) : value
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      
      // Prepare the payload
      const payload = {
        ...formData,
        objective: {
          ...formData.objective,
          count: parseInt(formData.objective.count)
        },
        duration_days: parseInt(formData.duration_days),
        reward: {
          ...formData.reward,
          points: parseInt(formData.reward.points)
        }
      };
      
      let response;
      
      if (isEditing) {
        // Update existing challenge
        response = await axios.put(`${API}/admin/challenges/${id}`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        toast.success('Challenge updated successfully!');
      } else {
        // Create new challenge
        response = await axios.post(`${API}/admin/challenges`, payload, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        toast.success('Challenge created successfully!');
      }
      
      // Redirect to challenge list
      navigate('/admin/challenges');
      
    } catch (err) {
      console.error('Error saving challenge:', err);
      setError(err.response?.data?.detail || 'Failed to save challenge. Please check your inputs and try again.');
      toast.error('Failed to save challenge');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleObjectiveTypeChange = (e) => {
    const { value } = e.target;
    
    // Reset the objective when changing types
    if (value === 'atoll') {
      setFormData(prev => ({
        ...prev,
        objective: {
          atoll: '',
          count: 3
        }
      }));
    } else if (value === 'island_type') {
      setFormData(prev => ({
        ...prev,
        objective: {
          island_type: 'resort',
          count: 3
        }
      }));
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
                <Link to="/admin/users" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Users
                </Link>
                <Link to="/admin/blog" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Blog
                </Link>
                <Link to="/admin/challenges" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
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
              {isEditing ? 'Edit Challenge' : 'Create New Challenge'}
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
                        Challenge Information
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Enter the details of the challenge.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Challenge Name *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description *
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Brief description of the challenge.
                        </p>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                          Image URL
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="image_url"
                            id="image_url"
                            value={formData.image_url || ''}
                            onChange={handleChange}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">URL to the challenge's image.</p>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700">
                          Duration (Days) *
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="duration_days"
                            id="duration_days"
                            value={formData.duration_days}
                            onChange={handleChange}
                            required
                            min="1"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <div className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="is_active"
                              name="is_active"
                              type="checkbox"
                              checked={formData.is_active}
                              onChange={handleChange}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="is_active" className="font-medium text-gray-700">
                              Active Challenge
                            </label>
                            <p className="text-gray-500">Make this challenge available for users to join.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Challenge Objective
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Define what users need to do to complete this challenge.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="objective_type" className="block text-sm font-medium text-gray-700">
                          Objective Type *
                        </label>
                        <div className="mt-1">
                          <select
                            id="objective_type"
                            onChange={handleObjectiveTypeChange}
                            value={formData.objective.atoll ? 'atoll' : 'island_type'}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="atoll">Visit islands in specific atoll</option>
                            <option value="island_type">Visit islands of specific type</option>
                          </select>
                        </div>
                      </div>

                      {formData.objective.atoll !== undefined ? (
                        <div className="sm:col-span-3">
                          <label htmlFor="objective.atoll" className="block text-sm font-medium text-gray-700">
                            Atoll *
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              name="objective.atoll"
                              id="objective.atoll"
                              value={formData.objective.atoll}
                              onChange={handleChange}
                              required
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="sm:col-span-3">
                          <label htmlFor="objective.island_type" className="block text-sm font-medium text-gray-700">
                            Island Type *
                          </label>
                          <div className="mt-1">
                            <select
                              id="objective.island_type"
                              name="objective.island_type"
                              value={formData.objective.island_type}
                              onChange={handleChange}
                              required
                              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            >
                              <option value="resort">Resort</option>
                              <option value="inhabited">Inhabited</option>
                              <option value="uninhabited">Uninhabited</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label htmlFor="objective.count" className="block text-sm font-medium text-gray-700">
                          Required Count *
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="objective.count"
                            id="objective.count"
                            value={formData.objective.count}
                            onChange={handleChange}
                            required
                            min="1"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Challenge Reward
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Define what users will receive upon completing this challenge.
                      </p>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label htmlFor="reward.badge" className="block text-sm font-medium text-gray-700">
                          Badge Name *
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="reward.badge"
                            id="reward.badge"
                            value={formData.reward.badge}
                            onChange={handleChange}
                            required
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="reward.points" className="block text-sm font-medium text-gray-700">
                          Points *
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            name="reward.points"
                            id="reward.points"
                            value={formData.reward.points}
                            onChange={handleChange}
                            required
                            min="1"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <div className="flex justify-end">
                    <Link
                      to="/admin/challenges"
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

export default AdminChallengeForm;