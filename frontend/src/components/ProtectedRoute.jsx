import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If profile is not completed, force user to setup page
  const currentPath = window.location.pathname;
  if (user && user.profileCompleted === false && !currentPath.startsWith('/setup-profile')) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    return <Navigate to={`/setup-profile?next=${next}`} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
