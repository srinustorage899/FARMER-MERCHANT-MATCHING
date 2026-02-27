import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Navbar from '../components/Navbar';

export default function FarmerDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  const STATS = [
    { icon: '📦', value: '—', label: t('activeListings'), color: '#4caf50' },
    { icon: '👁️', value: '—', label: t('profileViews'), color: '#2196f3' },
    { icon: '🤝', value: '—', label: t('connections'), color: '#ff9800' },
    { icon: '⭐', value: '—', label: t('rating'), color: '#f44336' },
  ];

  const ACTIONS = [
    {
      to: '/farmer/upload',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      ),
      label: t('uploadCrop'),
      desc: t('listHarvest'),
      accent: '#4caf50',
      bg: '#e8f5e9',
    },
    {
      to: '/farmer/profile',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ),
      label: t('myProfile'),
      desc: t('updateProfile'),
      accent: '#2196f3',
      bg: '#e3f2fd',
    },
  ];

  const ACTIVITY = [
    { text: 'Listed 500 kg Tomato', time: t('justNow'), dot: '#4caf50' },
    { text: 'Profile viewed by Fresh Mart', time: t('hrsAgo').replace('{0}', '2'), dot: '#2196f3' },
    { text: 'Price updated for Onion', time: t('yesterday'), dot: '#ff9800' },
  ];

  return (
    <>
      <Navbar dashboardPath="/farmer" />

      <div className="db">
        {/* ── Welcome banner ── */}
        <section className="db-banner db-banner--farmer">
          <div className="db-banner__bg" />
          <div className="db-banner__content">
            <span className="db-banner__wave">👋</span>
            <h1 className="db-banner__title">{greeting}, {session?.name}!</h1>
            <p className="db-banner__sub">{t('farmerDashSub')}</p>
          </div>
          <div className="db-banner__art">
            <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="130" cy="25" r="18" fill="rgba(255,255,255,.12)"/>
              <circle cx="130" cy="25" r="12" fill="rgba(255,255,255,.18)"/>
              <ellipse cx="80" cy="100" rx="75" ry="22" fill="rgba(255,255,255,.08)"/>
              <rect x="60" y="58" width="4" height="32" rx="2" fill="rgba(255,255,255,.15)"/>
              <circle cx="62" cy="54" r="8" fill="rgba(255,255,255,.12)"/>
              <rect x="90" y="64" width="4" height="26" rx="2" fill="rgba(255,255,255,.15)"/>
              <circle cx="92" cy="60" r="7" fill="rgba(255,255,255,.1)"/>
              <rect x="35" y="68" width="4" height="22" rx="2" fill="rgba(255,255,255,.12)"/>
              <circle cx="37" cy="64" r="6" fill="rgba(255,255,255,.09)"/>
            </svg>
          </div>
        </section>

        {/* ── Quick stats ── */}
        <section className="db-stats">
          {STATS.map((s) => (
            <div className="db-stat" key={s.label}>
              <div className="db-stat__icon" style={{ background: s.bg || `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <span className="db-stat__value">{s.value}</span>
              <span className="db-stat__label">{s.label}</span>
            </div>
          ))}
        </section>

        {/* ── Quick actions ── */}
        <section className="db-section">
          <h2 className="db-section__title">{t('quickActions')}</h2>
          <div className="db-actions">
            {ACTIONS.map((a) => (
              <Link className="db-action" to={a.to} key={a.to}>
                <div className="db-action__icon" style={{ background: a.bg, color: a.accent }}>
                  {a.icon}
                </div>
                <div className="db-action__text">
                  <span className="db-action__label">{a.label}</span>
                  <span className="db-action__desc">{a.desc}</span>
                </div>
                <span className="db-action__arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent activity ── */}
        <section className="db-section">
          <h2 className="db-section__title">{t('recentActivity')}</h2>
          <div className="db-activity">
            {ACTIVITY.map((a, i) => (
              <div className="db-activity__item" key={i}>
                <span className="db-activity__dot" style={{ background: a.dot }} />
                <span className="db-activity__text">{a.text}</span>
                <span className="db-activity__time">{a.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tip card ── */}
        <section className="db-tip">
          <span className="db-tip__icon">💡</span>
          <div>
            <span className="db-tip__title">{t('proTip')}</span>
            <p className="db-tip__text">{t('farmerTip')}</p>
          </div>
        </section>
      </div>
    </>
  );
}
