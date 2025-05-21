import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';

// Fix icon import issue in Leaflet with React
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom marker icons
const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const notVisitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const challengeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Map = () => {
  const [islands, setIslands] = useState([]);
  const [visitedIslands, setVisitedIslands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'resort', 'inhabited', 'uninhabited'
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
        console.error('Error fetching data:', err);
        setError('Failed to load map data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIslands();
  }, [currentUser]);

  const filteredIslands = islands.filter(island => {
    if (filter === 'all') return true;
    return island.type === filter;
  });

  // Helper function to check if an island is visited
  const isVisited = (islandId) => {
    return visitedIslands.includes(islandId);
  };

  // Get the appropriate icon based on visit status
  const getMarkerIcon = (islandId) => {
    if (isVisited(islandId)) {
      return visitedIcon;
    }
    return notVisitedIcon;
  };

  // Handler for logging a visit
  const handleLogVisit = (islandId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/log-visit/${islandId}`);
  };

  // Center of Maldives
  const maldivesCenter = [3.2028, 73.2207];

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
    <div className="flex flex-col h-full">
      <div className="bg-white shadow-md p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Maldives Island Map</h1>
          <p className="text-gray-600">Explore and track islands across the Maldives archipelago</p>
          
          <div className="flex flex-wrap items-center space-x-2 mt-4">
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
          
          <div className="flex items-center mt-4">
            <div className="flex items-center mr-4">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-1"></div>
              <span className="text-sm text-gray-600">Visited</span>
            </div>
            <div className="flex items-center mr-4">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-1"></div>
              <span className="text-sm text-gray-600">Not Visited</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-1"></div>
              <span className="text-sm text-gray-600">Challenge Islands</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-grow p-4">
        <div className="h-[70vh] w-full border rounded-lg overflow-hidden shadow-md">
          <MapContainer center={maldivesCenter} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {filteredIslands.map((island) => (
              <Marker 
                key={island.id} 
                position={[island.latitude, island.longitude]} 
                icon={getMarkerIcon(island.id)}
              >
                <Popup>
                  <div className="text-center">
                    <h3 className="font-bold text-lg">{island.name}</h3>
                    <div className="mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        island.type === 'resort' ? 'bg-blue-100 text-blue-800' :
                        island.type === 'inhabited' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {island.type.charAt(0).toUpperCase() + island.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{island.description}</p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <Link 
                        to={`/islands/${island.id}`} 
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </Link>
                      
                      {!isVisited(island.id) ? (
                        <button
                          onClick={() => handleLogVisit(island.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
                        >
                          Log Visit
                        </button>
                      ) : (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Visited
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Map;
