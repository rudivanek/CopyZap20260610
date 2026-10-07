import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'cz_last_route';

// The bare address is not in this list: for a signed-in user it is the default
// screen, and it has to be remembered like any other page. (Remembering it for a
// visitor who is not signed in does no harm: it is also the fallback below.)
const PUBLIC_ROUTES = new Set([
  '/login',
  '/create-account',
  '/reset-password',
  '/auth/callback',
  '/privacy',
  '/beta-thanks',
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/blog')) return true;
  return false;
}

export function useSaveLastRoute() {
  const location = useLocation();

  useEffect(() => {
    if (isPublicRoute(location.pathname)) return;
    const fullPath = location.pathname + location.search + location.hash;
    localStorage.setItem(STORAGE_KEY, fullPath);
  }, [location]);
}

/** Where to send a user after signing in: the page they last used, or the default screen. */
export function getLastRoute(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '/';
  } catch {
    return '/';
  }
}

export function clearLastRoute() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
