import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; // Removed Outlet import for now as it's used in MainLayout
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Import your Firebase auth instance

// Layouts
import MainLayout from './components/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import RawDataPage from './pages/RawDataPage';
import SettingsPage from './pages/SettingsPage';
// Removed './App.css' import

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start loading until auth state is known

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Set user to null if logged out, or User object if logged in
      setLoading(false); // Auth state is now known, stop loading
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {/* Optional: Add a nicer spinner */}
        Loading...
      </div>
    );
  }

  // --- Route Protection Logic ---

  // Component to protect routes that require authentication
  const ProtectedRoute = () => {
    return user ? <MainLayout /> : <Navigate to="/login" replace />;
    // If user exists, render MainLayout (which contains Outlet for nested routes)
    // Otherwise, redirect to login page
  };

  // Component to handle routes only accessible when logged out (Login/Signup)
  const PublicRoute = ({ children }: { children: JSX.Element }) => {
    return !user ? children : <Navigate to="/" replace />;
    // If user does NOT exist, render the child component (Login or Signup)
    // Otherwise, redirect to the main dashboard
  };

  return (
    <Routes>
      {/* Public routes (Login/Signup) */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

      {/* Protected routes (rendered within MainLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/raw-data" element={<RawDataPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        {/* Add other protected routes here */}
      </Route>

      {/* Optional: Catch-all route for 404 Not Found */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
