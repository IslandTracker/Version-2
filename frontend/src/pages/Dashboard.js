import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

// Custom marker icon
const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { currentUser, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visits, setVisits] = useState([]);
  const [islands, setIslands] = useState([]);
  const [badges, setbadges] = useState([]);
  const [visitedIslands, setVisitedIslands] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [stats, setStats] = useState({
    totalVisits: 0,
    resortVisits: 0,
    inhabitedVisits: 0,
    uninhabitedVisits: 0,
    atolls: new Set(),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch all data in parallel
        const [userResponse, visitsResponse, islandsResponse, badgesResponse, challengesResponse] = await Promise.all([
          axios.get(`${API}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/visits`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API}/islands`),
          axios.get(`${API}/badges`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] })), // Handle if endpoint doesn't exist yet
          axios.get(`${API}/challenges`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] })) // Handle if endpoint doesn't exist yet
        ]);
        
        // Don't call updateUserData() here as it will cause an infinite loop
        
        // Set visited islands
        setVisitedIslands(userResponse.data.visited_islands);
        
        // Set visits
        setVisits(visitsResponse.data);
        
        // Set islands
        setIslands(islandsResponse.data);
        
        // Set badges (if API endpoint exists)
        setbadges(badgesResponse.data);
        
        // Set active challenges (if API endpoint exists)
        setActiveChallenges(challengesResponse.data);
        
        // Calculate stats
        const visitedIslandObjects = islandsResponse.data.filter(island => 
          userResponse.data.visited_islands.includes(island.id)
        );
        
        setStats({
          totalVisits: userResponse.data.visited_islands.length,
          resortVisits: visitedIslandObjects.filter(island => island.type === 'resort').length,
          inhabitedVisits: visitedIslandObjects.filter(island => island.type === 'inhabited').length,
          uninhabitedVisits: visitedIslandObjects.filter(island => island.type === 'uninhabited').length,
          atolls: new Set(visitedIslandObjects.map(island => island.atoll)),
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load your dashboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, updateUserData]);

  // Filter islands to only the ones the user has visited
  const mapIslands = islands.filter(island => visitedIslands.includes(island.id));

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

  // Sort visits by date (newest first)
  const sortedVisits = [...visits].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
        <p className="text-gray-600">Track your journey through the Maldives</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Islands Visited</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalVisits}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Atolls Visited</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.atolls.size}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Badges Earned</p>
              <h3 className="text-2xl font-bold text-gray-900">{currentUser?.badges?.length || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Challenges</p>
              <h3 className="text-2xl font-bold text-gray-900">{currentUser?.active_challenges?.length || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Island Map</h2>
              <Link to="/map" className="text-blue-600 hover:text-blue-800 text-sm">View Full Map</Link>
            </div>
            
            <div className="h-96 rounded-lg overflow-hidden">
              <MapContainer 
                center={maldivesCenter} 
                zoom={7}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {mapIslands.map((island) => (
                  <Marker 
                    key={island.id} 
                    position={[island.latitude, island.longitude]} 
                    icon={visitedIcon}
                  >
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-bold">{island.name}</h3>
                        <p className="text-gray-600 text-sm">{island.atoll} Atoll</p>
                        <Link 
                          to={`/islands/${island.id}`} 
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-gray-600 text-sm">
                {mapIslands.length} islands visited out of {islands.length} total islands
              </div>
              
              <Link
                to="/islands"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                Explore More Islands
                <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Recent Visits */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Visits</h2>
              <Link to="/log-visit" className="text-blue-600 hover:text-blue-800 text-sm">Log New Visit</Link>
            </div>
            
            {sortedVisits.length === 0 ? (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400 mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No visits logged yet</h3>
                <p className="text-gray-500 mb-4">Start tracking your Maldives island adventures.</p>
                <Link
                  to="/map"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Explore Map to Start
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedVisits.slice(0, 5).map((visit) => {
                  const island = islands.find(i => i.id === visit.island_id);
                  return (
                    <div key={visit.id} className="flex items-start">
                      <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-700">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {island ? island.name : 'Unknown Island'}
                            </h3>
                            <p className="text-gray-500 text-sm">
                              {island ? island.atoll + ' Atoll' : ''}
                              {island && ' • '}
                              {island ? (
                                <span className={`${
                                  island.type === 'resort' ? 'text-blue-600' :
                                  island.type === 'inhabited' ? 'text-green-600' :
                                  'text-yellow-600'
                                }`}>
                                  {island.type.charAt(0).toUpperCase() + island.type.slice(1)}
                                </span>
                              ) : ''}
                            </p>
                          </div>
                          <span className="text-gray-500 text-sm">
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {visit.notes && (
                          <p className="mt-2 text-gray-600">{visit.notes}</p>
                        )}
                        
                        {visit.photo_urls && visit.photo_urls.length > 0 && (
                          <div className="mt-2 flex space-x-2 overflow-x-auto pb-2">
                            {visit.photo_urls.slice(0, 3).map((url, index) => (
                              <img 
                                key={index}
                                src={url} 
                                alt={`Visit photo ${index + 1}`} 
                                className="h-16 w-16 object-cover rounded-md"
                              />
                            ))}
                            {visit.photo_urls.length > 3 && (
                              <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-500">
                                +{visit.photo_urls.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {island && (
                          <Link 
                            to={`/islands/${island.id}`} 
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm inline-block"
                          >
                            View Island Details
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {sortedVisits.length > 5 && (
                  <div className="text-center pt-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View All Visits
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Side Column */}
        <div>
          {/* Badges */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Badges</h2>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {currentUser?.badges?.length || 0} Earned
              </span>
            </div>
            
            {/* For now, use sample badges since we haven't implemented the full badge system yet */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              <div className="badge-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="h-16 w-16 mx-auto mb-2">
                  <img src="https://img.icons8.com/external-vitaliy-gorbachev-flat-vitaly-gorbachev/58/000000/external-island-landscape-vitaliy-gorbachev-flat-vitaly-gorbachev.png" alt="Island Novice Badge" className="h-full w-full" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Island Novice</h3>
                <p className="text-xs text-gray-500">First island visited</p>
              </div>
              
              {stats.totalVisits >= 5 ? (
                <div className="badge-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <div className="h-16 w-16 mx-auto mb-2">
                    <img src="https://img.icons8.com/fluency/48/000000/sea-waves.png" alt="Island Explorer Badge" className="h-full w-full" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Island Explorer</h3>
                  <p className="text-xs text-gray-500">5 islands visited</p>
                </div>
              ) : (
                <div className="badge-card bg-gray-100 rounded-lg p-4 text-center opacity-50">
                  <div className="h-16 w-16 mx-auto mb-2 grayscale">
                    <img src="https://img.icons8.com/fluency/48/000000/sea-waves.png" alt="Island Explorer Badge" className="h-full w-full" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Island Explorer</h3>
                  <p className="text-xs text-gray-500">{stats.totalVisits}/5 islands</p>
                </div>
              )}
              
              {stats.resortVisits >= 3 ? (
                <div className="badge-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <div className="h-16 w-16 mx-auto mb-2">
                    <img src="https://img.icons8.com/color/48/000000/beach-umbrella.png" alt="Luxury Connoisseur Badge" className="h-full w-full" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Luxury Connoisseur</h3>
                  <p className="text-xs text-gray-500">3 resort islands visited</p>
                </div>
              ) : (
                <div className="badge-card bg-gray-100 rounded-lg p-4 text-center opacity-50">
                  <div className="h-16 w-16 mx-auto mb-2 grayscale">
                    <img src="https://img.icons8.com/color/48/000000/beach-umbrella.png" alt="Luxury Connoisseur Badge" className="h-full w-full" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Luxury Connoisseur</h3>
                  <p className="text-xs text-gray-500">{stats.resortVisits}/3 resorts</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/challenges" className="text-blue-600 hover:text-blue-800 text-sm">
                View All Badges
              </Link>
            </div>
          </div>
          
          {/* Active Challenges */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Active Challenges</h2>
              <Link to="/challenges" className="text-blue-600 hover:text-blue-800 text-sm">Browse Challenges</Link>
            </div>
            
            <div className="space-y-4">
              <div className="challenge-card bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Kaafu Atoll Explorer</h3>
                <p className="text-sm text-gray-600 mb-3">Visit 3 islands in Kaafu Atoll</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '33%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 of 3 islands</span>
                  <span>62 days left</span>
                </div>
              </div>
              
              <div className="challenge-card bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900">Local Island Experience</h3>
                <p className="text-sm text-gray-600 mb-3">Visit 5 inhabited islands</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 of 5 islands</span>
                  <span>152 days left</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Link 
                to="/challenges" 
                className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md"
              >
                Join More Challenges
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
