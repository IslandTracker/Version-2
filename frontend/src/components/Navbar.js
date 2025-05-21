import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="font-bold text-xl">IslandLogger.mv</Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium">
                Home
              </Link>
              <Link to="/map" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium">
                Map
              </Link>
              <Link to="/islands" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium">
                Islands
              </Link>
              <Link to="/blog" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium">
                Blog
              </Link>
              {currentUser && (
                <>
                  <Link to="/dashboard" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link to="/challenges" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-white text-sm font-medium">
                    Challenges
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{currentUser.name || currentUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-100 hover:text-white hover:bg-blue-600"
            >
              <svg
                className={`h-6 w-6 ${isMenuOpen ? 'hidden' : 'block'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
              <svg
                className={`h-6 w-6 ${isMenuOpen ? 'block' : 'hidden'}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-blue-600 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/map"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-blue-600 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Map
          </Link>
          <Link
            to="/islands"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-blue-600 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Islands
          </Link>
          <Link
            to="/blog"
            className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-blue-600 text-base font-medium"
            onClick={() => setIsMenuOpen(false)}
          >
            Blog
          </Link>
          {currentUser && (
            <>
              <Link
                to="/dashboard"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-blue-600 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/challenges"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent hover:bg-blue-600 text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Challenges
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-blue-600">
          {currentUser ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{currentUser.name || currentUser.email}</div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="mt-1 block px-3 py-2 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-700"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 px-4">
              <Link
                to="/login"
                className="block text-center px-3 py-2 rounded-md text-base font-medium hover:bg-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block text-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
