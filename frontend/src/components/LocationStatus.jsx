import { useState } from 'react';
import { geocodeAddress } from '../utils/location';
import { useLanguage } from '../hooks/useLanguage';

/**
 * LocationStatus — renders the location fetching / success / error indicator,
 * plus an inline manual-entry field that geocodes real addresses.
 */
export default function LocationStatus({ status, city, error, onRetry, onManualLocation }) {
  const { t } = useLanguage();
  const [showManual, setShowManual] = useState(false);
  const [query, setQuery] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState('');

  async function handleGeocode() {
    if (!query.trim()) return;
    setGeocoding(true);
    setGeoError('');
    try {
      const result = await geocodeAddress(query.trim());
      if (onManualLocation) onManualLocation(result);
      setShowManual(false);
      setQuery('');
    } catch (err) {
      setGeoError(err.message || t('locationUnavail'));
    } finally {
      setGeocoding(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGeocode();
    }
  }

  /* Manual entry form (shown on demand) */
  const manualForm = showManual && (
    <div className="loc-manual">
      <div className="loc-manual__row">
        <input
          className="loc-manual__input"
          type="text"
          placeholder="e.g. Nashik, Maharashtra"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={geocoding}
          autoFocus
        />
        <button
          className="loc-manual__btn"
          type="button"
          onClick={handleGeocode}
          disabled={geocoding || !query.trim()}
        >
          {geocoding ? (
            <span className="spinner spinner--sm" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,.3)' }} />
          ) : (
            t('findLocation')
          )}
        </button>
      </div>
      {geoError && <p className="loc-manual__error">{geoError}</p>}
      <p className="loc-manual__hint">{t('locationHint')}</p>
    </div>
  );

  if (status === 'fetching' || status === 'idle') {
    return (
      <>
        <div className="loc-status loc-status--fetching">
          <span className="spinner"></span> {t('fetchingLocation')}
        </div>
        <button className="loc-status__manual-toggle" type="button" onClick={() => setShowManual(!showManual)}>
          {t('enterLocationManually')}
        </button>
        {manualForm}
      </>
    );
  }

  if (status === 'success') {
    return (
      <>
        <div className="loc-status loc-status--success">
          <span>✓</span> {t('locationDetected')}: <strong>{city}</strong>
          {onRetry && (
            <button className="loc-status__change" type="button" onClick={onRetry}>
              {t('detectAgain')}
            </button>
          )}
          <button className="loc-status__change" type="button" onClick={() => setShowManual(!showManual)}>
            {t('enterManually')}
          </button>
        </div>
        {manualForm}
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <div className="loc-status loc-status--error">
          <span>✕</span> {error || t('locationUnavail')}
          {onRetry && (
            <button className="loc-status__change" type="button" onClick={onRetry}>
              {t('detectAgain')}
            </button>
          )}
        </div>
        <button
          className="loc-status__manual-toggle loc-status__manual-toggle--highlight"
          type="button"
          onClick={() => setShowManual(!showManual)}
        >
          {t('enterLocationInstead')}
        </button>
        {manualForm}
      </>
    );
  }

  return null;
}
