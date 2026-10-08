import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useCompleteAccess } from '../hooks/useCompleteAccess';

/**
 * A gate for pages that belong to the Advanced interface but need no desktop
 * screen, such as its Help Center. Only power users and admins get through.
 * A visitor who is not signed in goes to the login; a signed-in user without
 * Advanced goes to the default screen.
 *
 * Used as a layout route: the pages it protects are its child routes.
 */
const AdvancedOnly: React.FC<{ signedIn: boolean }> = ({ signedIn }) => {
  const access = useCompleteAccess();

  if (!signedIn) {
    return <Navigate to="/login" replace />;
  }
  // Wait until it is known which interface this user has
  if (access === null) {
    return null;
  }
  if (!access) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

export default AdvancedOnly;
