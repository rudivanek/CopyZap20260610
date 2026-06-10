/**
 * AdminRoute Component
 *
 * Route wrapper that checks if user is admin before allowing access.
 * Non-admin users are redirected to a fallback route.
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getIsAdmin } from '../services/adminService';
import AppSpinner from './ui/AppSpinner';

interface AdminRouteProps {
  children: React.ReactNode;
  currentUser: { email?: string; id?: string } | null;
  fallbackPath?: string;
}

export function AdminRoute({ children, currentUser, fallbackPath = '/copy-maker' }: AdminRouteProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      if (!currentUser) {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const adminStatus = await getIsAdmin(currentUser);
        if (isMounted) {
          setIsAdmin(adminStatus);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // While loading, show spinner
  if (isLoading) {
    return <AppSpinner />;
  }

  // If not admin, redirect
  if (!isAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  // If admin, render children
  return <>{children}</>;
}
