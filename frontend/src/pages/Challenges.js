import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Challenges = () => {
  const { currentUser, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [badges, setBadges] = useState([]);
  const [tab, setTab] = useState('challenges'); // 'challenges' or 'badges'

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // For the MVP, we'll use hardcoded sample data
        // In a full implementation, we'd fetch this from the API
        
        // Sample challenges data
        const sampleChallenges = [
          {
            id: '1',
            name: 'Kaafu Atoll Explorer',
            description: 'Visit 3 islands in Kaafu Atoll',
            objective: { atoll: 'Kaafu', count: 3 },
            duration_days: 90,
            reward: { badge: 'Kaafu Expert', points: 500 },
            is_active: true,
            progress: 1,
            days_left: 62
          },
          {
            id: '2',
            name: 'Local Island Experience',
            description: 'Visit 5 inhabited islands to experience local Maldivian culture',
            objective: { island_type: 'inhabited', count: 5 },
            duration_days: 180,
            reward: { badge: 'Cultural Immersion', points: 750 },
            is_active: true,
            progress: 1,
            days_left: 152
          },
          {
            id: '3',
            name: 'Resort Connoisseur',
            description: 'Visit 3 different resort islands',
            objective: { island_type: 'resort', count: 3 },
            duration_days: 365,
            reward: { badge: 'Luxury Traveler', points: 500 },
            is_active: true,
            progress: 0,
            days_left: 365
          },
          {
            id: '4',
            name: 'Baa Atoll Biosphere',
            description: 'Visit 4 islands in the UNESCO Biosphere Reserve area',
            objective: { atoll: 'Baa', count: 4 },
            duration_days: 180,
            reward: { badge: 'Conservation Champion', points: 800 },
            is_active: true,
            progress: 0,
            days_left: 180
          },
          {
            id: '5',
            name: 'Maldives Adventurer',
            description: 'Visit at least one island in 5 different atolls',
            objective: { unique_atolls: 5 },
            duration_days: 365,
            reward: { badge: 'Atoll Hopper', points: 1000 },
            is_active: true,
            progress: 1,
            days_left: 290
          }
        ];
        
        // Sample badges data
        const sampleBadges = [
          {
            id: '1',
            name: 'Island Novice',
            description: 'Visited your first island in the Maldives',
            image_url: 'https://img.icons8.com/external-vitaliy-gorbachev-flat-vitaly-gorbachev/58/000000/external-island-landscape-vitaliy-gorbachev-flat-vitaly-gorbachev.png',
            criteria: { visits_count: 1 },
            earned: true,
            earned_date: '2024-03-01'
          },
          {
            id: '2',
            name: 'Island Explorer',
            description: 'Visited 5 different islands',
            image_url: 'https://img.icons8.com/fluency/48/000000/sea-waves.png',
            criteria: { visits_count: 5 },
            earned: false,
            progress: '1/5 islands'
          },
          {
            id: '3',
            name: 'Luxury Connoisseur',
            description: 'Visited 3 resort islands',
            image_url: 'https://img.icons8.com/color/48/000000/beach-umbrella.png',
            criteria: { island_type: 'resort', count: 3 },
            earned: false,
            progress: '0/3 resorts'
          },
          {
            id: '4',
            name: 'Local Immersion',
            description: 'Visited 3 inhabited islands',
            image_url: 'https://img.icons8.com/color/48/000000/cottage.png',
            criteria: { island_type: 'inhabited', count: 3 },
            earned: false,
            progress: '1/3 islands'
          },
          {
            id: '5',
            name: 'Atoll Explorer',
            description: 'Visited islands in 3 different atolls',
            image_url: 'https://img.icons8.com/color/48/000000/map.png',
            criteria: { unique_atolls: 3 },
            earned: false,
            progress: '1/3 atolls'
          },
          {
            id: '6',
            name: 'Eco Warrior',
            description: 'Visited 2 marine protected areas',
            image_url: 'https://img.icons8.com/color/48/000000/coral.png',
            criteria: { mpa_count: 2 },
            earned: false,
            progress: '0/2 areas'
          }
        ];
        
        setChallenges(sampleChallenges);
        setActiveChallenges(sampleChallenges.slice(0, 2)); // First two are active
        setBadges(sampleBadges);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching challenges data:', err);
        setError('Failed to load challenges. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, updateUserData]);

  const handleJoinChallenge = async (challengeId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to join challenges');
        return;
      }

      setLoading(true);
      
      // In a real implementation, we'd call the API to join the challenge
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      // Update the UI to show the challenge as joined
      const challengeToJoin = challenges.find(c => c.id === challengeId);
      if (challengeToJoin) {
        // Create a new copy of the challenge with a progress property
        const joinedChallenge = {
          ...challengeToJoin,
          progress: 0,
          joined_at: new Date().toISOString()
        };
        
        // Update the active challenges state with the new challenge
        setActiveChallenges(prev => [...prev, joinedChallenge]);
        
        // Remove from available challenges
        setChallenges(prev => prev.filter(c => c.id !== challengeId));
        
        // Show success message
        toast.success(`Successfully joined the ${challengeToJoin.name} challenge!`);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError('Failed to join challenge. Please try again.');
      toast.error('Failed to join challenge. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const earnedBadges = badges.filter(badge => badge.earned);
  const inProgressBadges = badges.filter(badge => !badge.earned);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Challenges & Badges</h1>
        <p className="text-gray-600">Complete challenges and earn badges as you explore the Maldives</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTab('challenges')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              tab === 'challenges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Challenges
          </button>
          <button
            onClick={() => setTab('badges')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              tab === 'badges'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Badges
          </button>
        </nav>
      </div>

      {tab === 'challenges' ? (
        <>
          {/* Active Challenges */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Active Challenges</h2>
            
            {activeChallenges.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active challenges</h3>
                <p className="text-gray-500 mb-6">You haven't joined any challenges yet. Browse the available challenges below and join one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {activeChallenges.map((challenge) => (
                  <div key={challenge.id} className="challenge-card bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-blue-600 text-white px-6 py-4">
                      <h3 className="font-bold text-lg">{challenge.name}</h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">{challenge.description}</p>
                      
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{challenge.progress}/{challenge.objective.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${(challenge.progress / challenge.objective.count) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-600">Reward:</div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-600 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                            </svg>
                            <span className="font-medium">{challenge.reward.badge}</span>
                          </div>
                        </div>
                        <div className="text-yellow-600 font-medium">
                          {challenge.days_left} days left
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Available Challenges */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Challenges</h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {challenges
                .filter(challenge => !activeChallenges.some(ac => ac.id === challenge.id))
                .map((challenge) => (
                  <div key={challenge.id} className="challenge-card bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-100 px-6 py-4">
                      <h3 className="font-bold text-gray-900">{challenge.name}</h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">{challenge.description}</p>
                      
                      <div className="mb-6 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Duration: {challenge.duration_days} days</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                          </svg>
                          <span>Reward: {challenge.reward.badge}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                      >
                        Join Challenge
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : (
        /* Badges Tab */
        <div>
          {/* Earned Badges */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Earned Badges
              <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                {earnedBadges.length}
              </span>
            </h2>
            
            {earnedBadges.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No badges earned yet</h3>
                <p className="text-gray-500 mb-6">You haven't earned any badges yet. Keep exploring the Maldives and completing challenges to earn badges.</p>
                <Link
                  to="/map"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Explore Islands
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {earnedBadges.map((badge) => (
                  <div key={badge.id} className="badge-card bg-white rounded-lg shadow-md p-6 text-center">
                    <div className="h-16 w-16 mx-auto mb-4">
                      <img src={badge.image_url} alt={badge.name} className="h-full w-full" />
                    </div>
                    <h3 className="font-medium text-gray-900">{badge.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                    <div className="mt-2 text-xs text-green-600">
                      Earned on {new Date(badge.earned_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Badges to Earn */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges to Earn</h2>
            
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {inProgressBadges.map((badge) => (
                <div key={badge.id} className="badge-card bg-gray-100 rounded-lg shadow-md p-6 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 grayscale">
                    <img src={badge.image_url} alt={badge.name} className="h-full w-full" />
                  </div>
                  <h3 className="font-medium text-gray-900">{badge.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
                  <div className="mt-2 text-xs text-blue-600">
                    Progress: {badge.progress}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenges;
