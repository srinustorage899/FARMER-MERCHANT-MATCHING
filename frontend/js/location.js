/**
 * location.js — Shared geolocation module for the AgriMatch platform.
 *
 * Used by both Farmer (upload) and Merchant (search) flows.
 *
 * API:
 *   Location.fetch(statusEl)
 *     → Promise<{ latitude, longitude, city }>
 *     Renders fetching / success / error states into statusEl.
 *     On success the status includes the resolved city name.
 *     On failure the status element is updated and the promise rejects.
 *
 *   Location.showChangeOption(statusEl, onRetry)
 *     → Appends a "Change" button inside statusEl that re-triggers the flow.
 */
const Location = (() => {
  'use strict';

  const TIMEOUT_MS = 15000;

  /* ── Status rendering helpers ── */
  function setStatus(el, state, html) {
    el.className = `loc-status loc-status--${state}`;
    el.innerHTML = html;
  }

  function fetchingHTML() {
    return '<span class="spinner"></span> Fetching location…';
  }

  function successHTML(city) {
    return `<span>✓</span> Location detected: <strong>${city}</strong>`;
  }

  function errorHTML(msg) {
    return `<span>✕</span> ${msg}`;
  }

  /* ── Reverse geocode via free Nominatim API ── */
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
      return 'Lat ' + lat.toFixed(4) + ', Lon ' + lon.toFixed(4);
    }
  }

  /* ── Core fetch ── */
  /**
   * Fetch GPS coordinates, resolve city name, update UI.
   * @param {HTMLElement} statusEl – .loc-status container
   * @returns {Promise<{latitude:number, longitude:number, city:string}>}
   */
  function fetchLocation(statusEl) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setStatus(statusEl, 'error', errorHTML('Geolocation is not supported by your browser.'));
        reject(new Error('Geolocation unsupported'));
        return;
      }

      setStatus(statusEl, 'fetching', fetchingHTML());

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latitude  = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const city = await reverseGeocode(latitude, longitude);

          setStatus(statusEl, 'success', successHTML(city));
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
          setStatus(statusEl, 'error', errorHTML(msg));
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: TIMEOUT_MS, maximumAge: 0 }
      );
    });
  }

  /**
   * Append a "Change" button to the status element.
   * Clicking it calls `onRetry` (which should call fetchLocation again).
   */
  function showChangeOption(statusEl, onRetry) {
    const btn = document.createElement('button');
    btn.className = 'loc-status__change';
    btn.textContent = 'Change';
    btn.type = 'button';
    btn.addEventListener('click', onRetry);
    statusEl.appendChild(btn);
  }

  return { fetch: fetchLocation, showChangeOption };
})();
