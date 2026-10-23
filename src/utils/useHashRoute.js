import { useState, useEffect } from 'react';

/**
 * Parse the window hash into structured route information.
 * Supports:
 * - #/ or empty => { route: 'editor', roomCode: null }
 * - #/join/123456 => { route: 'join', roomCode: '123456' }
 */
export function parseHash(hash) {
  const clean = (hash || '').replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'join') {
    return {
      route: 'join',
      roomCode: parts[1],
    };
  }

  return {
    route: 'editor',
    roomCode: null,
  };
}

/**
 * Reactive hook for client-side hash routing.
 */
export function useHashRoute() {
  const [routeInfo, setRouteInfo] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRouteInfo(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (newHash) => {
    window.location.hash = newHash;
  };

  return {
    ...routeInfo,
    navigateTo,
  };
}
