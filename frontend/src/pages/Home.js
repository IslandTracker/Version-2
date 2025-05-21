import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div 
        className="hero-section"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1576425065576-4526fd1aa208')` }}
      >
        <div className="hero-overlay">
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center">
            Track Your Maldives Adventures
          </h1>
          <p className="text-white text-xl md:text-2xl mb-8 text-center max-w-3xl">
            Log islands you've visited, earn badges, and discover new destinations in paradise
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {currentUser ? (
              <>
                <Link
                  to="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                  My Dashboard
                </Link>
                <Link
                  to="/map"
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                  Explore Map
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                  Start Logging
                </Link>
                <Link
                  to="/map"
                  className="bg-transparent hover:bg-white/10 text-white border-2 border-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
                >
                  Explore Map
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Track, Discover, Achieve
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Your personal journey through the Maldives starts here
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-blue-50 rounded-xl p-8 text-center">
                <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Interactive Map</h3>
                <p className="text-gray-600">
                  Explore a detailed map of all Maldives islands and track your visited destinations.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-8 text-center">
                <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Earn Badges</h3>
                <p className="text-gray-600">
                  Collect badges as you visit more islands and complete special challenges.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-8 text-center">
                <div className="bg-blue-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Take Challenges</h3>
                <p className="text-gray-600">
                  Join travel challenges and compete with other island explorers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Islands Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Islands
            </h2>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
              Discover some of the most beautiful islands in the Maldives
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="island-card bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Resort island" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">Baros</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">Resort</span>
                </div>
                <p className="text-gray-600 mb-4">Luxury 5-star resort island with over-water villas</p>
                <Link to="/islands" className="text-blue-600 font-semibold hover:text-blue-800">
                  View Details →
                </Link>
              </div>
            </div>

            <div className="island-card bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1573843981242-273fef20a9a5?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Local island" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">Maafushi</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">Inhabited</span>
                </div>
                <p className="text-gray-600 mb-4">Popular local island known for budget-friendly tourism</p>
                <Link to="/islands" className="text-blue-600 font-semibold hover:text-blue-800">
                  View Details →
                </Link>
              </div>
            </div>

            <div className="island-card bg-white rounded-lg overflow-hidden shadow-lg">
              <div className="h-48 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1586861710684-b4e36ae77c4a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" alt="Uninhabited island" className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">Baa Atoll</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">Uninhabited</span>
                </div>
                <p className="text-gray-600 mb-4">UNESCO Biosphere Reserve known for manta rays and whale sharks</p>
                <Link to="/islands" className="text-blue-600 font-semibold hover:text-blue-800">
                  View Details →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/islands"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse All Islands
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Start Your Maldives Journey Today
            </h2>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Create an account to track your island visits, earn badges, and join the community of Maldives explorers.
            </p>
            <div className="mt-8">
              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50"
                >
                  Sign Up Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
