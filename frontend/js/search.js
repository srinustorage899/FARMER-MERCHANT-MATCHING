/**
 * search.js — Find-Farmers page logic for the Merchant flow.
 *
 * Depends on: utils.js, location.js
 *
 * Responsibilities:
 *  - Fetch merchant's delivery location (GPS or manual change).
 *  - Validate search form inputs.
 *  - Build search payload, console.log it.
 *  - Simulate backend response with dummy farmer data.
 *  - Render result cards (with "Best Match" badge) and map markers.
 *  - Interactive: clicking a card highlights its marker and vice-versa.
 *  - Expandable "Why this match?" sections.
 *  - Empty-state rendering when no results found.
 */
const Search = (() => {
  'use strict';

  const { $, $$, showMsg, hideMsg, isPositive, haversine, requireAuth, logout } = Utils;

  let merchantCoords = null; // { latitude, longitude, city }
  let els = {};

  /* ══════════════════════════════════════════════
     Dummy farmer data (simulates backend response)
     ══════════════════════════════════════════════ */
  const DUMMY_FARMERS = [
    { id: 1, name: 'Rajesh Kumar',    crop: 'Tomato', price: 22, quantity: 800,  lat: 19.0760, lon: 72.8777 },
    { id: 2, name: 'Anita Devi',      crop: 'Tomato', price: 25, quantity: 500,  lat: 18.5204, lon: 73.8567 },
    { id: 3, name: 'Suresh Patil',    crop: 'Onion',  price: 18, quantity: 1200, lat: 19.9975, lon: 73.7898 },
    { id: 4, name: 'Meena Sharma',    crop: 'Onion',  price: 20, quantity: 600,  lat: 20.0063, lon: 73.7635 },
    { id: 5, name: 'Vikram Singh',    crop: 'Potato', price: 15, quantity: 2000, lat: 26.8467, lon: 80.9462 },
    { id: 6, name: 'Lakshmi Reddy',   crop: 'Potato', price: 17, quantity: 900,  lat: 17.3850, lon: 78.4867 },
    { id: 7, name: 'Priya Nair',      crop: 'Tomato', price: 28, quantity: 300,  lat: 9.9312,  lon: 76.2673 },
    { id: 8, name: 'Deepak Yadav',    crop: 'Onion',  price: 16, quantity: 1500, lat: 23.2599, lon: 77.4126 },
  ];

  const MATCH_REASONS = [
    'Price is within your budget and among the lowest in the area.',
    'Large available quantity matches your bulk requirement.',
    'Very close proximity reduces transportation costs.',
    'Consistent quality rating from previous transactions.',
    'Farmer has verified organic certification.',
  ];

  /* ══════════════════════════════
     Location
     ══════════════════════════════ */
  async function initLocation() {
    try {
      merchantCoords = await Location.fetch(els.locStatus);
      els.btnSearch.disabled = false;
      Location.showChangeOption(els.locStatus, retryLocation);
    } catch {
      els.btnSearch.disabled = true;
    }
  }

  function retryLocation() {
    merchantCoords = null;
    els.btnSearch.disabled = true;
    initLocation();
  }

  /* ══════════════════════════════
     Search
     ══════════════════════════════ */
  async function handleSearch(e) {
    e.preventDefault();
    hideMsg(els.msg);

    const crop     = els.crop.value;
    const quantity = els.quantity.value.trim();
    const maxPrice = els.maxPrice.value.trim();
    const radius   = Number(els.radius.value);
    const sortBy   = els.sortBy.value;

    if (!crop)              { showMsg(els.msg, 'Please select a crop.', 'error'); return; }
    if (!isPositive(quantity)) { showMsg(els.msg, 'Enter a valid quantity.', 'error'); return; }
    if (!isPositive(maxPrice)) { showMsg(els.msg, 'Enter a valid max price.', 'error'); return; }
    if (!merchantCoords)    { showMsg(els.msg, 'Location not available yet.', 'error'); return; }

    const payload = {
      crop,
      quantity: Number(quantity),
      max_price: Number(maxPrice),
      radius,
      location: { latitude: merchantCoords.latitude, longitude: merchantCoords.longitude },
    };

    console.log('🔍 Search Payload:', JSON.stringify(payload, null, 2));

    // Show loading
    showLoader();

    // Call real backend API
    try {
      const res = await fetch('/api/merchant/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(els.msg, data.detail || 'Search failed.', 'error');
        renderEmpty();
        return;
      }

      console.log('✅ Backend returned', data.count, 'results');

      // Map backend response to the shape the renderer expects
      let results = (data.results || []).map((r) => ({
        id: r.listing_id,
        name: `Farmer ${r.listing_id.slice(0, 6)}`,
        crop: r.crop,
        price: r.price,
        quantity: r.quantity,
        lat: r.latitude,
        lon: r.longitude,
        distance: r.distance_km,
      }));

      // Client-side sort (backend already sorts by distance)
      if (sortBy === 'price')    results.sort((a, b) => a.price - b.price);
      else if (sortBy === 'quantity') results.sort((a, b) => b.quantity - a.quantity);

      renderResults(results, payload);
    } catch (err) {
      console.error('Search error:', err);
      showMsg(els.msg, 'Network error — could not reach the server.', 'error');
      renderEmpty();
    }
  }

  /* ── Simulate backend filtering ── */
  function simulateSearch(payload, sortBy) {
    const origin = payload.location;

    let results = DUMMY_FARMERS
      .filter((f) => f.crop === payload.crop)
      .filter((f) => f.price <= payload.max_price)
      .filter((f) => f.quantity >= payload.quantity * 0.3) // loose match
      .map((f) => {
        const dist = haversine(origin, { latitude: f.lat, longitude: f.lon });
        return { ...f, distance: Math.round(dist * 10) / 10 };
      })
      .filter((f) => f.distance <= payload.radius);

    // Sort
    if (sortBy === 'price')    results.sort((a, b) => a.price - b.price);
    else if (sortBy === 'distance') results.sort((a, b) => a.distance - b.distance);
    else if (sortBy === 'quantity') results.sort((a, b) => b.quantity - a.quantity);

    return results;
  }

  /* ══════════════════════════════
     Rendering
     ══════════════════════════════ */
  function showLoader() {
    els.resultsArea.innerHTML = `
      <div class="loader-center fade-in">
        <span class="spinner spinner--green"></span>
        Searching for farmers…
      </div>`;
  }

  function renderResults(results, payload) {
    if (results.length === 0) {
      renderEmpty();
      return;
    }

    console.log(`✅ Found ${results.length} farmer(s):`, results);

    // Marker positions (spread across the map canvas)
    const markerClasses = ['a', 'b', 'c', 'd', 'e'];
    const markerPositions = [
      { top: '25%', left: '20%' },
      { top: '50%', left: '55%' },
      { top: '35%', left: '75%' },
      { top: '65%', left: '30%' },
      { top: '18%', left: '60%' },
    ];

    // Build cards HTML
    const cardsHTML = results.map((f, i) => {
      const letter = String.fromCharCode(65 + i); // A, B, C…
      const badge = i === 0 ? `<span class="f-card__badge">⭐ Best Match</span>` : '';
      const reason = MATCH_REASONS[i % MATCH_REASONS.length];

      return `
        <div class="f-card fade-in" data-index="${i}" style="animation-delay: ${i * .08}s">
          ${badge}
          <div class="f-card__top">
            <span class="f-card__name">${letter}. ${f.name}</span>
            <span class="f-card__dist">📍 ${f.distance} km</span>
          </div>
          <div class="f-card__meta">
            <span>🌱 ${f.crop}</span>
            <span>💰 ₹${f.price}/kg</span>
            <span>📦 ${f.quantity} kg</span>
            <span>⭐ 4.${5 + i % 5}/5</span>
          </div>
          <div class="f-card__actions">
            <button class="btn btn--green btn--sm" type="button">Contact</button>
            <button class="btn btn--outline btn--sm f-card__why-toggle" type="button">Why this match?</button>
          </div>
          <div class="f-card__why">
            <p class="f-card__why-text">${reason}</p>
          </div>
        </div>`;
    }).join('');

    // Build markers HTML
    const markersHTML = results.slice(0, 5).map((f, i) => {
      const letter = String.fromCharCode(65 + i);
      const cls = markerClasses[i] || 'a';
      const pos = markerPositions[i] || markerPositions[0];
      return `<div class="map-marker map-marker--${cls}" data-index="${i}" style="top:${pos.top};left:${pos.left}"><span>${letter}</span></div>`;
    }).join('');

    els.resultsArea.innerHTML = `
      <div class="results-split fade-in">
        <div class="results-list" id="results-list">${cardsHTML}</div>
        <div class="map-box">
          <div class="map-box__header">🗺️ Farmer Locations</div>
          <div class="map-box__canvas" id="map-canvas">${markersHTML}</div>
        </div>
      </div>`;

    // Wire interactive behaviors
    wireCardInteractions();
  }

  function renderEmpty() {
    els.resultsArea.innerHTML = `
      <div class="empty fade-in">
        <span class="empty__icon">🔍</span>
        <p class="empty__title">No farmers found</p>
        <p class="empty__desc">Try widening your search radius, increasing max price, or selecting a different crop.</p>
      </div>`;
  }

  /* ── Card ↔ Marker interactions ── */
  function wireCardInteractions() {
    const cards   = $$('.f-card');
    const markers = $$('.map-marker');

    // Click card → highlight marker
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const idx = card.dataset.index;
        setActive(cards, markers, Number(idx));
      });
    });

    // Click marker → scroll to card
    markers.forEach((marker) => {
      marker.addEventListener('click', () => {
        const idx = marker.dataset.index;
        setActive(cards, markers, Number(idx));

        const target = cards[Number(idx)];
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    // "Why this match?" toggle
    $$('.f-card__why-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.f-card');
        const why = card.querySelector('.f-card__why');
        const isOpen = why.classList.toggle('f-card__why--open');
        btn.textContent = isOpen ? 'Hide details' : 'Why this match?';
      });
    });

    // Contact buttons
    $$('.f-card__actions .btn--green').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.f-card');
        const name = card.querySelector('.f-card__name').textContent.slice(3); // skip "A. "
        alert(`Contact request sent to ${name}! (simulated)`);
      });
    });
  }

  function setActive(cards, markers, idx) {
    cards.forEach((c, i)   => c.classList.toggle('f-card--active', i === idx));
    markers.forEach((m, i) => m.classList.toggle('map-marker--active', i === idx));
  }

  /* ══════════════════════════════
     Radius slider live update
     ══════════════════════════════ */
  function initSlider() {
    if (!els.radius) return;
    const val = els.radiusVal;
    const update = () => { val.textContent = `${els.radius.value} km`; };
    els.radius.addEventListener('input', update);
    update();
  }

  /* ══════════════════════════════
     Init
     ══════════════════════════════ */
  function init() {
    if (!$('#search-form')) return;

    const session = requireAuth();
    if (!session) return;

    $('#btn-logout')?.addEventListener('click', logout);

    els = {
      form:        $('#search-form'),
      crop:        $('#s-crop'),
      quantity:    $('#s-quantity'),
      maxPrice:    $('#s-max-price'),
      radius:      $('#s-radius'),
      radiusVal:   $('#s-radius-val'),
      sortBy:      $('#s-sort'),
      btnSearch:   $('#btn-search'),
      locStatus:   $('#loc-status'),
      msg:         $('#search-msg'),
      resultsArea: $('#results-area'),
    };

    els.btnSearch.disabled = true;
    els.form.addEventListener('submit', handleSearch);

    initSlider();
    initLocation();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Search.init);
