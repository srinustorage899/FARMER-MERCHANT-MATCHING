import { useState, useEffect, useCallback } from 'react';
import { fetchLocation } from '../utils/location';

/**
 * Hook to manage geolocation state.
 * Returns { coords, status, error, retry }
 *   - coords: { latitude, longitude, city } | null
 *   - status: 'idle' | 'fetching' | 'success' | 'error'
 *   - error: string | null
 *   - retry: function to re-fetch location
 */
export function useLocation(autoFetch = true) {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setStatus('fetching');
    setError(null);
    try {
      const result = await fetchLocation();
      setCoords(result);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  return { coords, setCoords, status, error, retry: fetch };
}
