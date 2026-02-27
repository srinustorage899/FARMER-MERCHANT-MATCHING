import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Navbar from '../components/Navbar';

export default function MerchantDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  const STATS = [
    { icon: '🔍', value: '—', label: t('searchesToday'), color: '#2196f3' },
    { icon: '🧑‍🌾', value: '—', label: t('farmersFound'), color: '#4caf50' },
    { icon: '📦', value: '—', label: t('orders'), color: '#ff9800' },
    { icon: '⭐', value: '—', label: t('rating'), color: '#f44336' },
  ];

  const ACTIONS = [
    {
      to: '/merchant/find-farmers',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      ),
      label: t('findFarmers'),
      desc: t('searchNearby'),
      accent: '#2196f3',
      bg: '#e3f2fd',
    },
    {
      to: '/merchant/orders',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      ),
      label: t('myOrders'),
      desc: t('trackOrders'),
      accent: '#4caf50',
      bg: '#e8f5e9',
    },
    {
      to: '/merchant/profile',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ),
      label: t('myProfile'),
      desc: t('updateBusiness'),
      accent: '#ff9800',
      bg: '#fff3e0',
    },
  ];

  const ACTIVITY = [
    { text: 'Searched for Tomato within 50 km', time: t('justNow'), dot: '#2196f3' },
    { text: 'Connected with Rajesh (Potato)', time: t('hrsAgo').replace('{0}', '1'), dot: '#4caf50' },
    { text: 'Updated delivery location', time: t('yesterday'), dot: '#ff9800' },
  ];

  return (
    <>
      <Navbar dashboardPath="/merchant" />

      <div className="db">
        {/* ── Welcome banner ── */}
        <section className="db-banner db-banner--merchant">
          <div className="db-banner__bg" />
          <div className="db-banner__content">
            <span className="db-banner__wave">👋</span>
            <h1 className="db-banner__title">{greeting}, {session?.name}!</h1>
            <p className="db-banner__sub">{t('merchantDashSub')}</p>
          </div>
          <div className="db-banner__art">
            <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="130" cy="30" r="16" fill="rgba(255,255,255,.1)"/>
              <rect x="40" y="50" width="40" height="40" rx="8" fill="rgba(255,255,255,.08)"/>
              <rect x="85" y="60" width="30" height="30" rx="6" fill="rgba(255,255,255,.06)"/>
              <circle cx="55" cy="45" r="3" fill="rgba(255,255,255,.15)"/>
              <circle cx="100" cy="55" r="2" fill="rgba(255,255,255,.15)"/>
            </svg>
          </div>
        </section>

        {/* ── Quick stats ── */}
        <section className="db-stats">
          {STATS.map((s) => (
            <div className="db-stat" key={s.label}>
              <div className="db-stat__icon" style={{ background: `${s.color}15`, color: s.color }}>
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
            <p className="db-tip__text">{t('merchantTip')}</p>
          </div>
        </section>
      </div>
    </>
  );
}
