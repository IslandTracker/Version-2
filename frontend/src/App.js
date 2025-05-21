import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminLayout from "./components/AdminLayout";

// Pages
import Home from "./pages/Home";
import Map from "./pages/Map";
import IslandList from "./pages/IslandList";
import IslandDetail from "./pages/IslandDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VisitForm from "./pages/VisitForm";
import Challenges from "./pages/Challenges";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBlogList from "./pages/AdminBlogList";

// Context
import { AuthProvider } from "./contexts/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          
          {/* Public Routes with Navbar and Footer */}
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Admin layout with admin sidebar and routes
const AdminRoutes = () => {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminLayout>
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="blog" element={<AdminBlogList />} />
          <Route path="islands" element={<div>Island Management (Coming Soon)</div>} />
          <Route path="users" element={<div>User Management (Coming Soon)</div>} />
          <Route path="challenges" element={<div>Challenge Management (Coming Soon)</div>} />
          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
        </Routes>
      </AdminLayout>
    </ProtectedRoute>
  );
};

// Public layout with navbar and footer
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<Map />} />
          <Route path="/islands" element={<IslandList />} />
          <Route path="/islands/:id" element={<IslandDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/log-visit/:islandId?" element={
            <ProtectedRoute>
              <VisitForm />
            </ProtectedRoute>
          } />
          <Route path="/challenges" element={
            <ProtectedRoute>
              <Challenges />
            </ProtectedRoute>
          } />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

// Protected Route component with admin access control
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      setCheckingAuth(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Auth check response:", response.data);
        
        // Strictly check admin status for admin routes
        const isAdminUser = response.data.is_admin === true;
        setIsAuthenticated(true);
        setIsAdmin(isAdminUser);
        
        // Log auth status for debugging
        console.log("Auth status:", {
          isAuthenticated: true,
          isAdmin: isAdminUser,
          requireAdmin
        });
      } catch (error) {
        console.error("Authentication error:", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [requireAdmin]);

  if (checkingAuth) {
    // Show loading indicator while checking auth
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login page
    console.log("Not authenticated, redirecting to", requireAdmin ? "/admin/login" : "/login");
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} />;
  }

  if (requireAdmin && !isAdmin) {
    // Show access denied for non-admin users trying to access admin routes
    console.log("Access denied: User is not an admin");
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 text-center mb-6">
            You do not have administrator privileges to access this area.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default App;
