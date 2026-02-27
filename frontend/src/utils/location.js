/**
 * Geolocation utilities for the AgriMatch platform (React version).
 */

const TIMEOUT_MS = 15000;

/**
 * Reverse geocode coordinates using Nominatim (free OSM service).
 */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!res.ok) throw new Error('Geocode failed');
    const data = await res.json();
    const addr = data.address || {};
    return addr.city || addr.town || addr.village || addr.county || addr.state || 'Unknown area';
  } catch {
    return `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
  }
}

/**
 * Forward-geocode: convert a place name / address into real coordinates.
 * Uses OpenStreetMap Nominatim (free, no API key needed).
 * @param {string} query  — e.g. "Nashik, Maharashtra" or "Delhi"
 * @returns {Promise<{ latitude: number, longitude: number, city: string }>}
 */
export async function geocodeAddress(query) {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;

  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Geocoding request failed.');

  const results = await res.json();
  if (!results.length) throw new Error('Location not found. Try a different name.');

  const top = results[0];
  const addr = top.address || {};
  const city =
    addr.city || addr.town || addr.village || addr.county || addr.state || top.display_name.split(',')[0];

  return {
    latitude: parseFloat(top.lat),
    longitude: parseFloat(top.lon),
    city,
    display: top.display_name,
  };
}

/**
 * Fetch current GPS position and resolve the city name.
 * @returns {Promise<{ latitude: number, longitude: number, city: string }>}
 */
export function fetchLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const city = await reverseGeocode(latitude, longitude);
        resolve({ latitude, longitude, city });
      },
      (err) => {
        let msg;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            msg = 'Location permission denied. Please allow access and reload.';
            break;
          case err.POSITION_UNAVAILABLE:
            msg = 'Location unavailable. Try again later.';
            break;
          case err.TIMEOUT:
            msg = 'Location request timed out. Please try again.';
            break;
          default:
            msg = 'An unknown error occurred while fetching location.';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 }
    );
  });
}
