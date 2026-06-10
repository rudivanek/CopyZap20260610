import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'cz_last_route';

const PUBLIC_ROUTES = new Set([
  '/',
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

export function getLastRoute(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '/copy-maker';
  } catch {
    return '/copy-maker';
  }
}

export function clearLastRoute() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
