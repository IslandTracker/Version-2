import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminUserList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, email: '' });
  const [toggleAdminModal, setToggleAdminModal] = useState({ show: false, userId: null, email: '', isAdmin: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
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
        
        // Fetch users
        const response = await axios.get(`${API}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        
        // Check if unauthorized
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('token');
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate]);

  const handleDelete = async () => {
    if (!deleteModal.userId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API}/admin/users/${deleteModal.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the deleted user from the state
      setUsers(users.filter(user => user.id !== deleteModal.userId));
      setDeleteModal({ show: false, userId: null, email: '' });
      toast.success('User deleted successfully');
      setError(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again later.');
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    if (!toggleAdminModal.userId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const { userId, isAdmin } = toggleAdminModal;
      
      // Get the current user data
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Update the user's admin status
      const updatedUser = {
        ...user,
        is_admin: !isAdmin
      };
      
      const response = await axios.put(`${API}/admin/users/${userId}`, updatedUser, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update the user in the state
      setUsers(users.map(u => u.id === userId ? response.data : u));
      setToggleAdminModal({ show: false, userId: null, email: '', isAdmin: false });
      toast.success(`User is now ${!isAdmin ? 'an admin' : 'a regular user'}`);
      setError(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again later.');
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term and filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesFilter = true;
    if (filter === 'admin') {
      matchesFilter = user.is_admin === true;
    } else if (filter === 'regular') {
      matchesFilter = user.is_admin !== true;
    }
    
    return matchesSearch && matchesFilter;
  });

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              User Management
            </h1>
            <Link
              to="/admin/users/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New User
            </Link>
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

            {/* Filters */}
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">
                    Users ({filteredUsers.length})
                  </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <div>
                      <label htmlFor="filter" className="sr-only">Filter</label>
                      <select
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All Users</option>
                        <option value="admin">Admin Users</option>
                        <option value="regular">Regular Users</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="search" className="sr-only">Search</label>
                      <input
                        type="text"
                        id="search"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Islands Visited
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loading && filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                              Loading users...
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                              No users found.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user) => (
                            <tr key={user.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.name || 'No name'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                  {user.is_admin ? 'Admin' : 'Regular User'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(user.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.visited_islands?.length || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2 justify-end">
                                  <Link to={`/admin/users/edit/${user.id}`} className="text-blue-600 hover:text-blue-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </Link>
                                  <button 
                                    onClick={() => setToggleAdminModal({ 
                                      show: true, 
                                      userId: user.id, 
                                      email: user.email, 
                                      isAdmin: user.is_admin === true 
                                    })}
                                    className="text-purple-600 hover:text-purple-900"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 2a2 2 0 00-2 2v2a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2h-8zm8 6H2V6a2 2 0 012-2h4v2h4V4a2 2 0 012-2h4a2 2 0 012 2v2zM2 8v8a2 2 0 002 2h12a2 2 0 002-2V8h-4v2a2 2 0 01-2 2H8a2 2 0 01-2-2V8H2z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  <button 
                                    onClick={() => setDeleteModal({ show: true, userId: user.id, email: user.email })}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete User</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the user "{deleteModal.email}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setDeleteModal({ show: false, userId: null, email: '' })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Admin Status Modal */}
      {toggleAdminModal.show && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {toggleAdminModal.isAdmin ? 'Remove Admin Role' : 'Grant Admin Role'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {toggleAdminModal.isAdmin
                          ? `Are you sure you want to remove admin privileges from "${toggleAdminModal.email}"?`
                          : `Are you sure you want to grant admin privileges to "${toggleAdminModal.email}"?`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={handleToggleAdmin}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                    toggleAdminModal.isAdmin 
                      ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' 
                      : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                  }`}
                  disabled={loading}
                >
                  {loading 
                    ? 'Processing...' 
                    : toggleAdminModal.isAdmin 
                      ? 'Remove Admin Role' 
                      : 'Grant Admin Role'
                  }
                </button>
                <button 
                  type="button" 
                  onClick={() => setToggleAdminModal({ show: false, userId: null, email: '', isAdmin: false })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;