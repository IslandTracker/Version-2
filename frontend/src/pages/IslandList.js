import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IslandList = () => {
  const [islands, setIslands] = useState([]);
  const [visitedIslands, setVisitedIslands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'resort', 'inhabited', 'uninhabited'
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIslands = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/islands`);
        setIslands(response.data);
        
        // Fetch visited islands if user is authenticated
        if (currentUser) {
          const token = localStorage.getItem('token');
          const userResponse = await axios.get(`${API}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setVisitedIslands(userResponse.data.visited_islands);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching islands:', err);
        setError('Failed to load islands. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIslands();
  }, [currentUser]);

  // Helper function to check if an island is visited
  const isVisited = (islandId) => {
    return visitedIslands.includes(islandId);
  };

  // Filter islands based on type and search term
  const filteredIslands = islands.filter(island => {
    const matchesFilter = filter === 'all' || island.type === filter;
    const matchesSearch = island.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          island.atoll.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handler for logging a visit
  const handleLogVisit = (islandId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/log-visit/${islandId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-lg">
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
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Islands Directory</h1>
        <p className="text-gray-600 max-w-3xl">
          Explore the beautiful islands of the Maldives. Filter by type, search by name or atoll, and log your visits.
        </p>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center space-x-2">
            <span className="text-gray-700">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('resort')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'resort' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Resorts
            </button>
            <button
              onClick={() => setFilter('inhabited')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'inhabited' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Inhabited
            </button>
            <button
              onClick={() => setFilter('uninhabited')}
              className={`px-3 py-1 rounded-md text-sm ${filter === 'uninhabited' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Uninhabited
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or atoll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {filteredIslands.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No islands found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIslands.map((island) => (
            <div key={island.id} className="island-card bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="h-48 overflow-hidden">
                {island.image_urls?.length > 0 ? (
                  <img 
                    src={island.image_urls[0]} 
                    alt={island.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{island.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    island.type === 'resort' ? 'bg-blue-100 text-blue-800' :
                    island.type === 'inhabited' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {island.type.charAt(0).toUpperCase() + island.type.slice(1)}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-1">Atoll: {island.atoll}</p>
                <p className="text-gray-600 line-clamp-2 mb-4">{island.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {island.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center">
                  <Link 
                    to={`/islands/${island.id}`} 
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View Details →
                  </Link>
                  
                  {isVisited(island.id) ? (
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                      ✓ Visited
                    </span>
                  ) : (
                    <button
                      onClick={() => handleLogVisit(island.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded"
                    >
                      Log Visit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IslandList;
