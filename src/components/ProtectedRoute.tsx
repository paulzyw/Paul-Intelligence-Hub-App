import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading while we are checking auth session or fetching profile
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If roles are specified, wait until profile is available before making a decision
  // If we have a user but no profile at this point, something is wrong or still loading
  if (allowedRoles) {
    if (!profile) {
      // Fallback redirect if profile fetch failed but loading finished
      return <Navigate to="/solutions" replace />;
    }
    
    if (!allowedRoles.includes(profile.role)) {
      // If they aren't allowed, send them back to the solutions page
      return <Navigate to="/solutions" replace />;
    }
  }

  return <>{children}</>;
};
