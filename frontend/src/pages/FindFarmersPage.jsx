import { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusMsg from '../components/StatusMsg';
import LocationStatus from '../components/LocationStatus';
import OrderModal from '../components/OrderModal';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { isPositive, recordSearch, recordContact, saveOrder } from '../utils/helpers';

/* ── SVG Icons (inline) ────────────────────────────────────────── */
const ICO = {
  search: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  pin: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  crop: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  box: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  rupee: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  star: <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  phone: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  info: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  chevDown: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  chevUp: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  sliders: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  map: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  arrowBack: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
};

const CROP_LIST = [
  { name: 'Tomato',       category: 'Vegetables' },
  { name: 'Onion',        category: 'Vegetables' },
  { name: 'Potato',       category: 'Vegetables' },
  { name: 'Brinjal',      category: 'Vegetables' },
  { name: 'Cabbage',      category: 'Vegetables' },
  { name: 'Carrot',       category: 'Vegetables' },
  { name: 'Cauliflower',  category: 'Vegetables' },
  { name: 'Green Chilli', category: 'Vegetables' },
  { name: 'Spinach',      category: 'Vegetables' },
  { name: 'Peas',         category: 'Vegetables' },
  { name: 'Cucumber',     category: 'Vegetables' },
  { name: 'Bitter Gourd', category: 'Vegetables' },
  { name: 'Okra',         category: 'Vegetables' },
  { name: 'Garlic',       category: 'Vegetables' },
  { name: 'Ginger',       category: 'Vegetables' },
  { name: 'Rice',         category: 'Grains & Cereals' },
  { name: 'Wheat',        category: 'Grains & Cereals' },
  { name: 'Maize',        category: 'Grains & Cereals' },
  { name: 'Bajra',        category: 'Grains & Cereals' },
  { name: 'Jowar',        category: 'Grains & Cereals' },
  { name: 'Ragi',         category: 'Grains & Cereals' },
  { name: 'Barley',       category: 'Grains & Cereals' },
  { name: 'Mango',        category: 'Fruits' },
  { name: 'Banana',       category: 'Fruits' },
  { name: 'Apple',        category: 'Fruits' },
  { name: 'Grapes',       category: 'Fruits' },
  { name: 'Orange',       category: 'Fruits' },
  { name: 'Papaya',       category: 'Fruits' },
  { name: 'Pomegranate',  category: 'Fruits' },
  { name: 'Watermelon',   category: 'Fruits' },
  { name: 'Guava',        category: 'Fruits' },
  { name: 'Lemon',        category: 'Fruits' },
  { name: 'Soybean',      category: 'Pulses & Oilseeds' },
  { name: 'Groundnut',    category: 'Pulses & Oilseeds' },
  { name: 'Mustard',      category: 'Pulses & Oilseeds' },
  { name: 'Chana',        category: 'Pulses & Oilseeds' },
  { name: 'Moong',        category: 'Pulses & Oilseeds' },
  { name: 'Urad',         category: 'Pulses & Oilseeds' },
  { name: 'Tur',          category: 'Pulses & Oilseeds' },
  { name: 'Sunflower',    category: 'Pulses & Oilseeds' },
  { name: 'Sugarcane',    category: 'Cash Crops' },
  { name: 'Cotton',       category: 'Cash Crops' },
  { name: 'Jute',         category: 'Cash Crops' },
  { name: 'Tea',          category: 'Cash Crops' },
  { name: 'Coffee',       category: 'Cash Crops' },
  { name: 'Turmeric',     category: 'Spices' },
  { name: 'Cumin',        category: 'Spices' },
  { name: 'Coriander',    category: 'Spices' },
  { name: 'Black Pepper', category: 'Spices' },
  { name: 'Cardamom',     category: 'Spices' },
];

const CROP_CATEGORIES = CROP_LIST.reduce((acc, crop) => {
  if (!acc[crop.category]) acc[crop.category] = [];
  acc[crop.category].push(crop);
  return acc;
}, {});

const MATCH_REASONS = [
  'Price is within your budget and among the lowest in the area.',
  'Large available quantity matches your bulk requirement.',
  'Very close proximity reduces transportation costs.',
  'Consistent quality rating from previous transactions.',
  'Farmer has verified organic certification.',
];

/* ── Leaflet marker icons by color ── */
const MARKER_COLORS = ['#43a047', '#ff9800', '#2196f3', '#ef5350', '#757575'];
const MARKER_LETTERS = ['A', 'B', 'C', 'D', 'E'];

function createMarkerIcon(color, letter, isActive = false) {
  const size = isActive ? 42 : 32;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round(size * 1.4)}" viewBox="0 0 32 45">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 29 16 29s16-17 16-29C32 7.2 24.8 0 16 0z"
            fill="${color}" stroke="#fff" stroke-width="1.5"
            filter="${isActive ? 'drop-shadow(0 3px 6px rgba(0,0,0,.35))' : 'drop-shadow(0 2px 3px rgba(0,0,0,.2))'}"/>
      <text x="16" y="21" text-anchor="middle" fill="#fff"
            font-size="14" font-weight="700" font-family="sans-serif">${letter}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'leaflet-marker-custom',
    iconSize: [size, Math.round(size * 1.4)],
    iconAnchor: [size / 2, Math.round(size * 1.4)],
    popupAnchor: [0, -Math.round(size * 1.2)],
  });
}

/* ── Component to auto-fit map bounds ── */
function MapBoundsController({ results, merchantCoords }) {
  const map = useMap();
  useEffect(() => {
    if (!results || results.length === 0) return;
    const points = results.map(r => [r.lat, r.lon]);
    if (merchantCoords) points.push([merchantCoords.latitude, merchantCoords.longitude]);
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [results, merchantCoords, map]);
  return null;
}

export default function FindFarmersPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { coords, status, error, retry } = useLocation(true);

  const [crop, setCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  /* ── Order Modal state ── */
  const [orderFarmer, setOrderFarmer] = useState(null);

  const cardRefs = useRef([]);
  const markerRefs = useRef([]);

  const locationReady = coords != null;

  async function handleSearch(e) {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!crop) { setMsg({ text: 'Please select a crop.', type: 'error' }); return; }
    if (!isPositive(quantity)) { setMsg({ text: 'Enter a valid quantity.', type: 'error' }); return; }
    if (!isPositive(maxPrice)) { setMsg({ text: 'Enter a valid max price.', type: 'error' }); return; }
    if (!coords) { setMsg({ text: 'Location not available yet.', type: 'error' }); return; }

    const payload = {
      crop,
      quantity: Number(quantity),
      max_price: Number(maxPrice),
      location: { latitude: coords.latitude, longitude: coords.longitude },
    };

    console.log('🔍 Search Payload:', JSON.stringify(payload, null, 2));

    setLoading(true);
    setResults(null);
    setHoveredIdx(-1);

    try {
      const res = await fetch('/api/merchant/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg({ text: data.detail || 'Search failed.', type: 'error' });
        setResults([]);
        return;
      }

      console.log('✅ Backend returned', data.count, 'results');

      let mapped = (data.results || []).map((r) => ({
        id: r.listing_id,
        name: r.farmer_name || `Farmer ${r.listing_id.slice(0, 6)}`,
        crop: r.crop,
        price: r.price,
        quantity: r.quantity,
        lat: r.latitude,
        lon: r.longitude,
        distance: r.distance_km,
        matchScore: r.match_score,
      }));

      // Results are already optimally ranked by the backend
      // using a composite score (60% distance + 40% price)

      if (session?.email) {
        recordSearch(session.email, {
          crop,
          quantity: Number(quantity),
          maxPrice: Number(maxPrice),
          resultsCount: mapped.length,
        });
      }

      setResults(mapped);
    } catch (err) {
      console.error('Search error:', err);
      setMsg({ text: 'Network error — could not reach the server.', type: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  const handleCardHover = useCallback((idx) => {
    setHoveredIdx(idx);
    if (markerRefs.current[idx]) {
      markerRefs.current[idx].openPopup();
    }
  }, []);

  const handleCardLeave = useCallback(() => {
    setHoveredIdx(-1);
    markerRefs.current.forEach(m => m?.closePopup());
  }, []);

  const handleMarkerHover = useCallback((idx) => {
    setHoveredIdx(idx);
    cardRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setHoveredIdx(-1);
  }, []);

  function handleContact(name) {
    if (session?.email) {
      recordContact(session.email, { farmerName: name });
    }
    alert(`Contact info for ${name} has been shared. They will reach out shortly!`);
  }

  function handleBuy(farmer, idx) {
    setOrderFarmer({
      ...farmer,
      markerColor: MARKER_COLORS[idx % MARKER_COLORS.length],
      rating: (4.5 + (idx % 5) * 0.1).toFixed(1),
    });
  }

  function handleOrderPlaced(order) {
    if (session?.email) {
      saveOrder(session.email, order);
    }
  }

  function handleOrderClose() {
    setOrderFarmer(null);
  }

  const markerIcons = useMemo(() => {
    return MARKER_LETTERS.map((letter, i) => ({
      normal: createMarkerIcon(MARKER_COLORS[i], letter, false),
      active: createMarkerIcon(MARKER_COLORS[i], letter, true),
    }));
  }, []);

  return (
    <>
      <Navbar dashboardPath="/merchant" />

      <div className="ff">
        {/* ── Page header ── */}
        <div className="ff-head">
          <Link className="ff-head__back" to="/merchant">
            {ICO.arrowBack} {t('backToDashboard')}
          </Link>
          <h1 className="ff-head__title">
            {ICO.search}
            <span>{t('findFarmersNear')}</span>
          </h1>
          <p className="ff-head__sub">{t('findFarmersSub')}</p>
        </div>

        <div className="ff-body">
          {/* ══════════ LEFT: SEARCH PANEL ══════════ */}
          <aside className="ff-panel">
            {/* Panel header */}
            <div className="ff-panel__head">
              <div className="ff-panel__head-icon">{ICO.sliders}</div>
              <span className="ff-panel__head-label">{t('searchFilters')}</span>
            </div>

            {/* Location */}
            <div className="ff-field">
              <span className="ff-field__label">
                {ICO.pin} {t('deliveryLocation')}
              </span>
              <LocationStatus
                status={status}
                city={coords?.city}
                error={error}
                onRetry={retry}
                onManualLocation={(result) => setCoords(result)}
              />
            </div>

            <form className="ff-form" onSubmit={handleSearch} noValidate>
              {/* Crop */}
              <div className="ff-field">
                <label className="ff-field__label" htmlFor="s-crop">
                  {ICO.crop} {t('crop')}
                </label>
                <div className="ff-select-wrap">
                  <select
                    className="ff-select"
                    id="s-crop"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    required
                  >
                    <option value="" disabled>{t('selectCrop')}</option>
                    {Object.entries(CROP_CATEGORIES).map(([category, crops]) => (
                      <optgroup key={category} label={category}>
                        {crops.map(c => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <span className="ff-select-wrap__arrow">{ICO.chevDown}</span>
                </div>
              </div>

              {/* Qty + Price row */}
              <div className="ff-row">
                <div className="ff-field">
                  <label className="ff-field__label" htmlFor="s-quantity">
                    {ICO.box} {t('quantity')}
                  </label>
                  <div className="ff-input-wrap">
                    <input
                      className="ff-input"
                      type="number"
                      id="s-quantity"
                      placeholder="e.g. 500"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    <span className="ff-input-wrap__unit">kg</span>
                  </div>
                </div>

                <div className="ff-field">
                  <label className="ff-field__label" htmlFor="s-max-price">
                    {ICO.rupee} {t('maxPriceKg')}
                  </label>
                  <div className="ff-input-wrap">
                    <input
                      className="ff-input"
                      type="number"
                      id="s-max-price"
                      placeholder="e.g. 30"
                      min="0.01"
                      step="0.01"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      required
                    />
                    <span className="ff-input-wrap__unit">₹</span>
                  </div>
                </div>
              </div>

              {/* Sort removed — backend returns optimally ranked results */}

              <StatusMsg text={msg.text} type={msg.type} />

              <button
                className="ff-submit"
                type="submit"
                disabled={!locationReady || loading}
              >
                {loading ? (
                  <><span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} /> {t('searching')}</>
                ) : (
                  <>{ICO.search} {t('searchFarmers')}</>
                )}
              </button>
            </form>
          </aside>

          {/* ══════════ RIGHT: RESULTS ══════════ */}
          <main className="ff-results">
            {/* Initial empty */}
            {results === null && !loading && (
              <div className="ff-empty">
                <svg className="ff-empty__art" width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="50" fill="#e3f2fd"/>
                  <rect x="35" y="30" width="50" height="60" rx="8" fill="#fff" stroke="#90caf9" strokeWidth="2"/>
                  <rect x="43" y="42" width="28" height="4" rx="2" fill="#bbdefb"/>
                  <rect x="43" y="50" width="20" height="4" rx="2" fill="#e3f2fd"/>
                  <rect x="43" y="58" width="24" height="4" rx="2" fill="#e3f2fd"/>
                  <circle cx="85" cy="85" r="18" fill="#1e88e5" opacity=".12"/>
                  <circle cx="85" cy="85" r="10" stroke="#1565c0" strokeWidth="2.5" fill="none"/>
                  <line x1="92" y1="92" x2="100" y2="100" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                <p className="ff-empty__title">{t('readyToSearch')}</p>
                <p className="ff-empty__desc">{t('readyToSearchDesc')}</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="ff-empty ff-empty--loading">
                <div className="ff-loader">
                  <div className="ff-loader__ring" />
                </div>
                <p className="ff-empty__title">{t('searchingFor')}</p>
                <p className="ff-empty__desc">{t('matchingBest')}</p>
              </div>
            )}

            {/* No results */}
            {results !== null && results.length === 0 && !loading && (
              <div className="ff-empty">
                <svg className="ff-empty__art" width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="50" fill="#fff3e0"/>
                  <circle cx="50" cy="50" r="20" stroke="#ffb74d" strokeWidth="3" fill="none"/>
                  <line x1="64" y1="64" x2="82" y2="82" stroke="#ffb74d" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="42" y1="42" x2="58" y2="58" stroke="#ef6c00" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/>
                  <line x1="58" y1="42" x2="42" y2="58" stroke="#ef6c00" strokeWidth="2.5" strokeLinecap="round" opacity=".5"/>
                </svg>
                <p className="ff-empty__title">{t('noFarmersFound')}</p>
                <p className="ff-empty__desc">{t('noFarmersDesc')}</p>
              </div>
            )}

            {/* ── Results: cards + map ── */}
            {results !== null && results.length > 0 && !loading && (
              <>
                {/* Result count bar */}
                <div className="ff-rbar">
                  <span className="ff-rbar__count">
                    <span className="ff-rbar__num">{results.length}</span> {results.length !== 1 ? t('farmersFoundP') : t('farmerFound')}
                  </span>
                  <span className="ff-rbar__sort">Ranked by best match (distance + price)</span>
                </div>

                <div className="ff-split">
                  <div className="ff-list">
                    {results.map((f, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const reason = MATCH_REASONS[i % MATCH_REASONS.length];
                      return (
                        <FarmerCard
                          key={f.id}
                          ref={(el) => (cardRefs.current[i] = el)}
                          farmer={f}
                          letter={letter}
                          index={i}
                          isBest={i === 0}
                          isHovered={hoveredIdx === i}
                          markerColor={MARKER_COLORS[i % MARKER_COLORS.length]}
                          reason={reason}
                          onMouseEnter={() => handleCardHover(i)}
                          onMouseLeave={handleCardLeave}
                          onContact={() => handleContact(f.name)}
                          onBuy={() => handleBuy(f, i)}
                        />
                      );
                    })}
                  </div>

                  {/* ── Leaflet map ── */}
                  <div className="ff-map">
                    <div className="ff-map__head">
                      {ICO.map}
                      <span>{t('farmerLocations')}</span>
                      <span className="ff-map__badge">{results.length} {t('pinned')}</span>
                    </div>
                    <div className="ff-map__wrap">
                      <MapContainer
                        center={coords ? [coords.latitude, coords.longitude] : [17.385, 78.487]}
                        zoom={11}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%', borderRadius: '0 0 16px 16px' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapBoundsController results={results} merchantCoords={coords} />

                        {coords && (
                          <Marker
                            position={[coords.latitude, coords.longitude]}
                            icon={L.divIcon({
                              html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                                <circle cx="14" cy="14" r="12" fill="#1565c0" stroke="#fff" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,.3))"/>
                                <text x="14" y="19" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">⬤</text>
                              </svg>`,
                              className: 'leaflet-marker-custom',
                              iconSize: [28, 28],
                              iconAnchor: [14, 14],
                            })}
                          >
                            <Popup>📍 {t('yourLocation')}</Popup>
                          </Marker>
                        )}

                        {results.map((f, i) => (
                          <Marker
                            key={f.id}
                            position={[f.lat, f.lon]}
                            icon={markerIcons[i % markerIcons.length][hoveredIdx === i ? 'active' : 'normal']}
                            ref={(el) => { markerRefs.current[i] = el; }}
                            eventHandlers={{
                              mouseover: () => handleMarkerHover(i),
                              mouseout: () => handleMarkerLeave(),
                            }}
                          >
                            <Popup>
                              <div className="map-popup">
                                <strong>{f.name}</strong>
                                <span>₹{f.price}/kg · {f.quantity} kg</span>
                                <span>{f.distance} km away</span>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Order Modal ── */}
      {orderFarmer && (
        <OrderModal
          farmer={orderFarmer}
          merchantName={session?.name || 'Merchant'}
          onClose={handleOrderClose}
          onOrderPlaced={handleOrderPlaced}
        />
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   FarmerCard — Premium result card
   ══════════════════════════════════════════ */
const FarmerCard = forwardRef(function FarmerCard(
  { farmer, letter, index, isBest, isHovered, markerColor, reason, onMouseEnter, onMouseLeave, onContact, onBuy },
  ref
) {
  const [whyOpen, setWhyOpen] = useState(false);
  const { t } = useLanguage();
  const rating = (4.5 + (index % 5) * 0.1).toFixed(1);

  return (
    <div
      ref={ref}
      className={`fc ${isHovered ? 'fc--active' : ''} ${isBest ? 'fc--best' : ''}`}
      style={{ '--i': index }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isBest && (
        <span className="fc__badge">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {t('bestMatch')}
        </span>
      )}

      {/* Top row */}
      <div className="fc__top">
        <div className="fc__id">
          <span className="fc__letter" style={{ background: markerColor }}>{letter}</span>
          <div className="fc__name-wrap">
            <span className="fc__name">{farmer.name}</span>
            <span className="fc__rating">
              {ICO.star} {rating}
            </span>
          </div>
        </div>
        <span className="fc__dist">
          {ICO.pin} {farmer.distance} km
        </span>
      </div>

      {/* Info grid */}
      <div className="fc__grid">
        <div className="fc__cell">
          <span className="fc__cell-label">{t('crop')}</span>
          <span className="fc__cell-val fc__cell-val--crop">{farmer.crop}</span>
        </div>
        <div className="fc__cell">
          <span className="fc__cell-label">{t('price')}</span>
          <span className="fc__cell-val fc__cell-val--price">₹{farmer.price}/kg</span>
        </div>
        <div className="fc__cell">
          <span className="fc__cell-label">{t('available')}</span>
          <span className="fc__cell-val">{farmer.quantity} kg</span>
        </div>
        <div className="fc__cell">
          <span className="fc__cell-label">{t('total')}</span>
          <span className="fc__cell-val fc__cell-val--total">₹{(farmer.price * farmer.quantity).toLocaleString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="fc__actions">
        <button
          className="fc__btn fc__btn--buy"
          type="button"
          onClick={(e) => { e.stopPropagation(); onBuy(); }}
        >
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          {t('buyNow')}
        </button>
        <button
          className="fc__btn fc__btn--ghost"
          type="button"
          onClick={(e) => { e.stopPropagation(); onContact(); }}
        >
          {ICO.phone} {t('contact')}
        </button>
        <button
          className="fc__btn fc__btn--ghost"
          type="button"
          onClick={(e) => { e.stopPropagation(); setWhyOpen((v) => !v); }}
        >
          {ICO.info} {whyOpen ? 'Hide' : 'Why?'}
        </button>
      </div>

      {/* Expandable reason */}
      <div className={`fc__why ${whyOpen ? 'fc__why--open' : ''}`}>
        <p className="fc__why-text">{reason}</p>
      </div>
    </div>
  );
});
