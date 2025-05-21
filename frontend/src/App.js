import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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

  // Protected Route with admin-specific routing
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
        
        console.log("Auth check:", response.data);
        
        // Strictly check admin status for admin routes
        const isAdminUser = response.data.is_admin === true;
        setIsAuthenticated(true);
        setIsAdmin(isAdminUser);
        
        console.log("Admin check:", response.data.is_admin, "isAdminUser:", isAdminUser);
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
  }, []);

  if (checkingAuth) {
    // Still checking authentication
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to the appropriate login page
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} />;
  }

  if (requireAdmin && !isAdmin) {
    console.log("User is not admin, redirecting to home");
    // Redirect to home if admin access is required but user is not an admin
    return <Navigate to="/" />;
  }

  return children;
};

export default App;
