import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IslandDetail = () => {
  const { id } = useParams();
  const [island, setIsland] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisited, setIsVisited] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchIsland = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/islands/${id}`);
        setIsland(response.data);
        
        // Check if island is visited
        if (currentUser) {
          const token = localStorage.getItem('token');
          const userResponse = await axios.get(`${API}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsVisited(userResponse.data.visited_islands.includes(id));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching island:', err);
        setError('Failed to load island details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchIsland();
  }, [id, currentUser]);

  const handleLogVisit = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    navigate(`/log-visit/${id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !island) {
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
              <p className="text-sm text-red-700">{error || 'Island not found'}</p>
              <div className="mt-4">
                <Link 
                  to="/islands" 
                  className="text-red-700 underline hover:text-red-900"
                >
                  Return to islands list
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link to="/" className="text-gray-700 hover:text-blue-600 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <Link to="/islands" className="text-gray-700 hover:text-blue-600 ml-1 text-sm md:ml-2">
                    Islands
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-gray-500 ml-1 text-sm md:ml-2">{island.name}</span>
                </div>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            {island.name}
            <span className={`ml-3 px-2 py-1 text-xs font-semibold rounded ${
              island.type === 'resort' ? 'bg-blue-100 text-blue-800' :
              island.type === 'inhabited' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {island.type.charAt(0).toUpperCase() + island.type.slice(1)}
            </span>
            {isVisited && (
              <span className="ml-3 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                ✓ Visited
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Atoll: {island.atoll}</p>
        </div>
        
        {!isVisited && (
          <button
            onClick={handleLogVisit}
            className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Log Visit
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Main image or gallery */}
            <div className="h-64 sm:h-96 overflow-hidden">
              {island.image_urls?.length > 0 ? (
                <img 
                  src={island.image_urls[0]} 
                  alt={island.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Additional images */}
            {island.image_urls?.length > 1 && (
              <div className="grid grid-cols-4 gap-2 p-2">
                {island.image_urls.slice(1, 5).map((url, index) => (
                  <div key={index} className="h-20 overflow-hidden rounded">
                    <img 
                      src={url} 
                      alt={`${island.name} - ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Description */}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About {island.name}</h2>
              <p className="text-gray-600 mb-6">{island.description}</p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {island.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Activities */}
              {island.water_activities && island.water_activities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Water Activities</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {island.water_activities.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Amenities for resorts */}
              {island.type === 'resort' && island.amenities && island.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Resort Amenities</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {island.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500 mr-2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-gray-600">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Transfer options */}
              {island.transfer_options && island.transfer_options.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Getting There</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {island.transfer_options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          {/* Island info card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Island Information</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">{island.type.charAt(0).toUpperCase() + island.type.slice(1)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Atoll:</span>
                <span className="font-medium text-gray-900">{island.atoll}</span>
              </div>
              
              {island.population !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Population:</span>
                  <span className="font-medium text-gray-900">{island.population.toLocaleString()}</span>
                </div>
              )}
              
              {island.size_km2 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium text-gray-900">{island.size_km2} km²</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Coordinates:</span>
                <span className="font-medium text-gray-900">{island.latitude.toFixed(4)}, {island.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>
          
          {/* Map card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="h-64 rounded overflow-hidden">
              <MapContainer 
                center={[island.latitude, island.longitude]} 
                zoom={12} 
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[island.latitude, island.longitude]}>
                  <Popup>
                    {island.name}
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
          
          {/* Call to action */}
          {!isVisited ? (
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <h3 className="text-lg font-medium text-blue-900 mb-2">Have you visited {island.name}?</h3>
              <p className="text-blue-700 mb-4">Log your visit to track your journey and earn badges!</p>
              <button
                onClick={handleLogVisit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Log Your Visit
              </button>
            </div>
          ) : (
            <div className="bg-green-50 rounded-lg p-6 border border-green-100">
              <h3 className="text-lg font-medium text-green-900 mb-2">You've visited {island.name}!</h3>
              <p className="text-green-700 mb-2">This island is already in your collection.</p>
              <Link
                to="/dashboard"
                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                View Your Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IslandDetail;
