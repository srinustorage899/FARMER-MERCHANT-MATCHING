import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

const THEME_KEY  = 'agriTheme';
const UNIT_KEY   = 'agriUnit';
const RADIUS_KEY = 'agriRadius';
const NOTIF_KEY  = 'agriNotif';

function loadPref(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export default function SettingsPage() {
  const { session, logout } = useAuth();
  const { lang, setLang, t, languages } = useLanguage();

  const dashboardPath = session?.role === 'farmer' ? '/farmer' : '/merchant';

  /* ── Preferences ── */
  const [theme, setTheme]     = useState(() => loadPref(THEME_KEY, 'system'));
  const [unit, setUnit]       = useState(() => loadPref(UNIT_KEY, 'km'));
  const [radius, setRadius]   = useState(() => loadPref(RADIUS_KEY, '50'));
  const [notif, setNotif]     = useState(() => loadPref(NOTIF_KEY, 'true') === 'true');
  const [saved, setSaved]     = useState(false);

  /* Apply theme to <html> */
  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute('data-theme');
    if (theme === 'dark')  root.setAttribute('data-theme', 'dark');
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    // 'system' → let prefers-color-scheme handle it (no attribute)
  }, [theme]);

  function persist(key, val) {
    try { localStorage.setItem(key, val); } catch { /* noop */ }
  }

  function handleTheme(v) { setTheme(v); persist(THEME_KEY, v); flash(); }
  function handleUnit(v)  { setUnit(v);  persist(UNIT_KEY, v);  flash(); }
  function handleNotif(v) { setNotif(v); persist(NOTIF_KEY, String(v)); flash(); }
  function handleRadius(v){ setRadius(v); persist(RADIUS_KEY, v); flash(); }

  function handleLang(code) {
    setLang(code);
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function handleClearData() {
    if (!window.confirm(t('clearDataWarn'))) return;
    localStorage.clear();
    logout();
    window.location.href = '/';
  }

  return (
    <>
      <Navbar dashboardPath={dashboardPath} />

      <div className="page-wrap">
        <div className="st">
          {/* Back link */}
          <Link className="st-back" to={dashboardPath}>← {t('back')} {t('dashboard')}</Link>

          <h1 className="st-title">⚙️ {t('settingsTitle')}</h1>

          {saved && <div className="st-toast">{t('savedSettings')}</div>}

          {/* ── Language ── */}
          <section className="st-section">
            <h2 className="st-section__title">🌐 {t('language')}</h2>
            <p className="st-section__desc">{t('chooseLanguage')}</p>
            <div className="st-lang-grid">
              {languages.map((l) => (
                <button
                  key={l.code}
                  className={`st-lang-btn ${lang === l.code ? 'st-lang-btn--active' : ''}`}
                  type="button"
                  onClick={() => handleLang(l.code)}
                >
                  <span className="st-lang-btn__native">{l.nativeLabel}</span>
                  <span className="st-lang-btn__eng">{l.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Theme ── */}
          <section className="st-section">
            <h2 className="st-section__title">🎨 {t('theme')}</h2>
            <div className="st-toggle-group">
              {[
                { val: 'light',  label: t('lightMode'),  icon: '☀️' },
                { val: 'dark',   label: t('darkMode'),   icon: '🌙' },
                { val: 'system', label: t('systemMode'), icon: '💻' },
              ].map((o) => (
                <button
                  key={o.val}
                  className={`st-toggle ${theme === o.val ? 'st-toggle--active' : ''}`}
                  type="button"
                  onClick={() => handleTheme(o.val)}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Distance Unit ── */}
          <section className="st-section">
            <h2 className="st-section__title">📏 {t('distanceUnit')}</h2>
            <div className="st-toggle-group">
              {[
                { val: 'km',    label: t('kilometers') },
                { val: 'miles', label: t('miles') },
              ].map((o) => (
                <button
                  key={o.val}
                  className={`st-toggle ${unit === o.val ? 'st-toggle--active' : ''}`}
                  type="button"
                  onClick={() => handleUnit(o.val)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          {/* ── Default Search Radius ── */}
          <section className="st-section">
            <h2 className="st-section__title">📡 {t('defaultRadius')}</h2>
            <div className="st-range-wrap">
              <input
                className="st-range"
                type="range"
                min="5"
                max="200"
                step="5"
                value={radius}
                onChange={(e) => handleRadius(e.target.value)}
              />
              <span className="st-range__val">{radius} {unit === 'km' ? 'km' : 'mi'}</span>
            </div>
          </section>

          {/* ── Notifications ── */}
          <section className="st-section">
            <h2 className="st-section__title">🔔 {t('notifications')}</h2>
            <label className="st-switch">
              <input
                type="checkbox"
                checked={notif}
                onChange={(e) => handleNotif(e.target.checked)}
              />
              <span className="st-switch__slider"></span>
              <span className="st-switch__label">{t('enableNotifs')}</span>
            </label>
          </section>

          {/* ── About ── */}
          <section className="st-section">
            <h2 className="st-section__title">ℹ️ {t('aboutApp')}</h2>
            <p className="st-section__desc">
              AgriMatch — {t('heroSubtitle')}
            </p>
            <p className="st-version">{t('version')} 1.0.0</p>
          </section>

          {/* ── Danger zone ── */}
          <section className="st-section st-section--danger">
            <h2 className="st-section__title">⚠️ {t('clearData')}</h2>
            <p className="st-section__desc">{t('clearDataWarn')}</p>
            <button className="st-danger-btn" type="button" onClick={handleClearData}>
              {t('clearData')}
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
