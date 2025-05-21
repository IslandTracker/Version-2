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
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="blog" element={<AdminBlogList />} />
          <Route path="islands" element={<div>Island Management (Coming Soon)</div>} />
          <Route path="users" element={<div>User Management (Coming Soon)</div>} />
          <Route path="challenges" element={<div>Challenge Management (Coming Soon)</div>} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsCheckingAuth(true);
        const token = localStorage.getItem("token");

        if (!token) {
          console.log("No token found, redirecting to login");
          setIsAuthenticated(false);
          setIsAdmin(false);
          return;
        }

        // Verify token and get user info
        try {
          const userResponse = await axios.get(`${BACKEND_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = userResponse.data;
          console.log("User data:", userData);
          
          setIsAuthenticated(true);
          // Explicitly check for boolean true to avoid type coercion issues
          setIsAdmin(userData.is_admin === true);
          
          // Log auth status for debugging
          console.log("Auth status:", {
            isAuthenticated: true,
            isAdmin: userData.is_admin === true,
            requireAdmin,
          });
          
          // If route requires admin but user is not admin, redirect
          if (requireAdmin && userData.is_admin !== true) {
            console.warn("User is not an admin but tried to access admin route");
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error("Token validation error:", error);
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    verifyAuth();
  }, [navigate, requireAdmin]);

  // Show loading indicator while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-8 max-w-md w-full bg-white rounded-lg shadow-md">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required and user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} replace />;
  }

  // If admin access is required and user is not admin
  if (requireAdmin && !isAdmin) {
    console.log("User is not admin but route requires admin");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default App;
