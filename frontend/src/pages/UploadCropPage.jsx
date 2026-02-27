import { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusMsg from '../components/StatusMsg';
import LocationStatus from '../components/LocationStatus';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { isPositive, recordUpload } from '../utils/helpers';

const CROP_LIST = [
  { name: 'Tomato',      icon: '🍅', category: 'Vegetables' },
  { name: 'Onion',       icon: '🧅', category: 'Vegetables' },
  { name: 'Potato',      icon: '🥔', category: 'Vegetables' },
  { name: 'Brinjal',     icon: '🍆', category: 'Vegetables' },
  { name: 'Cabbage',     icon: '🥬', category: 'Vegetables' },
  { name: 'Carrot',      icon: '🥕', category: 'Vegetables' },
  { name: 'Cauliflower', icon: '🥦', category: 'Vegetables' },
  { name: 'Green Chilli',icon: '🌶️', category: 'Vegetables' },
  { name: 'Spinach',     icon: '🥬', category: 'Vegetables' },
  { name: 'Peas',        icon: '🫛', category: 'Vegetables' },
  { name: 'Cucumber',    icon: '🥒', category: 'Vegetables' },
  { name: 'Bitter Gourd',icon: '🥒', category: 'Vegetables' },
  { name: 'Okra',        icon: '🌿', category: 'Vegetables' },
  { name: 'Garlic',      icon: '🧄', category: 'Vegetables' },
  { name: 'Ginger',      icon: '🫚', category: 'Vegetables' },
  { name: 'Rice',        icon: '🌾', category: 'Grains & Cereals' },
  { name: 'Wheat',       icon: '🌾', category: 'Grains & Cereals' },
  { name: 'Maize',       icon: '🌽', category: 'Grains & Cereals' },
  { name: 'Bajra',       icon: '🌾', category: 'Grains & Cereals' },
  { name: 'Jowar',       icon: '🌾', category: 'Grains & Cereals' },
  { name: 'Ragi',        icon: '🌾', category: 'Grains & Cereals' },
  { name: 'Barley',      icon: '🌾', category: 'Grains & Cereals' },
  { name: 'Mango',       icon: '🥭', category: 'Fruits' },
  { name: 'Banana',      icon: '🍌', category: 'Fruits' },
  { name: 'Apple',       icon: '🍎', category: 'Fruits' },
  { name: 'Grapes',      icon: '🍇', category: 'Fruits' },
  { name: 'Orange',      icon: '🍊', category: 'Fruits' },
  { name: 'Papaya',      icon: '🫒', category: 'Fruits' },
  { name: 'Pomegranate', icon: '🫐', category: 'Fruits' },
  { name: 'Watermelon',  icon: '🍉', category: 'Fruits' },
  { name: 'Guava',       icon: '🍈', category: 'Fruits' },
  { name: 'Lemon',       icon: '🍋', category: 'Fruits' },
  { name: 'Soybean',     icon: '🫘', category: 'Pulses & Oilseeds' },
  { name: 'Groundnut',   icon: '🥜', category: 'Pulses & Oilseeds' },
  { name: 'Mustard',     icon: '🌻', category: 'Pulses & Oilseeds' },
  { name: 'Chana',       icon: '🫘', category: 'Pulses & Oilseeds' },
  { name: 'Moong',       icon: '🫛', category: 'Pulses & Oilseeds' },
  { name: 'Urad',        icon: '🫘', category: 'Pulses & Oilseeds' },
  { name: 'Tur',         icon: '🫘', category: 'Pulses & Oilseeds' },
  { name: 'Sunflower',   icon: '🌻', category: 'Pulses & Oilseeds' },
  { name: 'Sugarcane',   icon: '🎋', category: 'Cash Crops' },
  { name: 'Cotton',      icon: '☁️', category: 'Cash Crops' },
  { name: 'Jute',        icon: '🌿', category: 'Cash Crops' },
  { name: 'Tea',         icon: '🍵', category: 'Cash Crops' },
  { name: 'Coffee',      icon: '☕', category: 'Cash Crops' },
  { name: 'Turmeric',    icon: '🟡', category: 'Spices' },
  { name: 'Cumin',       icon: '🌰', category: 'Spices' },
  { name: 'Coriander',   icon: '🌿', category: 'Spices' },
  { name: 'Black Pepper',icon: '⚫', category: 'Spices' },
  { name: 'Cardamom',    icon: '🟢', category: 'Spices' },
];

// Group crops by category
const CROP_CATEGORIES = CROP_LIST.reduce((acc, crop) => {
  if (!acc[crop.category]) acc[crop.category] = [];
  acc[crop.category].push(crop);
  return acc;
}, {});

function getCropIcon(name) {
  return CROP_LIST.find(c => c.name === name)?.icon || '🌱';
}

export default function UploadCropPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const { coords, setCoords, status, error, retry } = useLocation(true);

  const [crop, setCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);

  // Manual geocoded location handler
  function handleManualLocation(result) {
    setCoords(result);
  }

  const locationReady = coords != null;

  function handleNewUpload() {
    setUploadSuccess(false);
    setLastUpload(null);
    setMsg({ text: '', type: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (!crop) { setMsg({ text: 'Please select a crop.', type: 'error' }); return; }
    if (!isPositive(quantity)) { setMsg({ text: 'Quantity must be a positive number.', type: 'error' }); return; }
    if (!isPositive(price)) { setMsg({ text: 'Price must be a positive number.', type: 'error' }); return; }
    if (!coords) { setMsg({ text: 'Location not available. Please wait or enter address.', type: 'error' }); return; }

    setSubmitting(true);

    const payload = {
      crop,
      quantity: Number(quantity),
      price: Number(price),
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      farmer_name: session?.name || undefined,
    };

    console.log('📦 Crop Listing Payload:', JSON.stringify(payload, null, 2));

    try {
      const res = await fetch('/api/farmer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setMsg({ text: data.detail || 'Upload failed.', type: 'error' });
        return;
      }

      console.log('✅ Backend response:', data);

      // Record in activity history
      if (session?.email) {
        recordUpload(session.email, {
          listingId: data.listing_id,
          crop,
          quantity: Number(quantity),
          price: Number(price),
          location: coords.city || 'Unknown',
        });
      }

      // Store last upload details for success screen
      setLastUpload({
        crop,
        icon: getCropIcon(crop),
        quantity: Number(quantity),
        price: Number(price),
        location: coords.city || 'Unknown',
        id: data.listing_id,
      });
      setUploadSuccess(true);

      // Reset form
      setCrop('');
      setQuantity('');
      setPrice('');
    } catch (err) {
      console.error('Upload error:', err);
      setMsg({ text: 'Network error — could not reach the server.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar dashboardPath="/farmer" />

      <div className="page-wrap">
        <Link className="back" to="/farmer">← {t('backToDashboard')}</Link>

        {/* ── Success Overlay ── */}
        {uploadSuccess && lastUpload && (
          <div className="upload-success-card">
            <div className="upload-success-check">
              <svg viewBox="0 0 52 52" className="upload-success-svg">
                <circle className="upload-success-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="upload-success-tick" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h3 className="upload-success-title">{t('uploadSuccess')}</h3>
            <p className="upload-success-sub">{t('uploadSuccessSub')}</p>

            <div className="upload-success-details">
              <div className="upload-success-row">
                <span className="upload-success-icon">{lastUpload.icon}</span>
                <div>
                  <strong>{lastUpload.crop}</strong>
                  <span className="upload-success-meta">
                    {lastUpload.quantity} kg · ₹{lastUpload.price}/kg · {lastUpload.location}
                  </span>
                </div>
              </div>
              <div className="upload-success-id">
                {t('listingId')}: <code>{lastUpload.id.slice(0, 12)}…</code>
              </div>
            </div>

            <div className="upload-success-actions">
              <button className="btn btn--green" onClick={handleNewUpload}>
                {t('uploadAnother')}
              </button>
              <Link className="btn btn--outline" to="/farmer">
                {t('backToDashboard')}
              </Link>
            </div>
          </div>
        )}

        {/* ── Upload Form ── */}
        {!uploadSuccess && (
          <div className="card upload-card">
            <div className="upload-card__header">
              <span className="upload-card__header-icon">🌾</span>
              <div>
                <h2 className="card__header" style={{ marginBottom: 0, textAlign: 'left' }}>{t('uploadCropTitle')}</h2>
                <p className="upload-card__subtitle">{t('uploadSubtitle')}</p>
              </div>
            </div>

            {/* GPS status */}
            <LocationStatus
              status={status}
              city={coords?.city}
              error={error}
              onRetry={retry}
              onManualLocation={handleManualLocation}
            />

            <form className="form mt-2" onSubmit={handleSubmit} noValidate>
              {/* Crop selector */}
              <div className="fg">
                <label className="fg__label" htmlFor="crop">
                  {t('crop')} {crop && <span className="fg__label-icon">{getCropIcon(crop)}</span>}
                </label>
                <select
                  className="fg__select fg__select--crop"
                  id="crop"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  required
                >
                  <option value="" disabled>{t('selectCrop')}</option>
                  {Object.entries(CROP_CATEGORIES).map(([category, crops]) => (
                    <optgroup key={category} label={category}>
                      {crops.map(c => (
                        <option key={c.name} value={c.name}>
                          {c.icon}  {c.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Quantity & Price side-by-side */}
              <div className="upload-row">
                <div className="fg">
                  <label className="fg__label" htmlFor="quantity">{t('quantity')}</label>
                  <div className="fg__input-wrap">
                    <input
                      className="fg__input"
                      type="number"
                      id="quantity"
                      placeholder="e.g. 500"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    <span className="fg__input-unit">kg</span>
                  </div>
                </div>

                <div className="fg">
                  <label className="fg__label" htmlFor="price">{t('pricePerKg')}</label>
                  <div className="fg__input-wrap">
                    <input
                      className="fg__input"
                      type="number"
                      id="price"
                      placeholder="e.g. 25"
                      min="0.01"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                    <span className="fg__input-unit">₹</span>
                  </div>
                </div>
              </div>

              {/* Summary preview */}
              {crop && quantity && price && (
                <div className="upload-preview">
                  <span className="upload-preview__icon">{getCropIcon(crop)}</span>
                  <span className="upload-preview__text">
                    <strong>{crop}</strong> — {quantity} kg × ₹{price}/kg = <strong>₹{(Number(quantity) * Number(price)).toLocaleString('en-IN')}</strong>
                  </span>
                </div>
              )}

              <StatusMsg text={msg.text} type={msg.type} />

              <button
                className="btn btn--green btn--block btn--lg"
                type="submit"
                disabled={!locationReady || submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }}></span>
                    {t('uploading')}
                  </>
                ) : (
                  <>{t('uploadListing')}</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
