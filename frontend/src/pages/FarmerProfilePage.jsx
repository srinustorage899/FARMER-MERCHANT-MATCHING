import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import Navbar from '../components/Navbar';
import { getStoredUser, getActivity, formatDate } from '../utils/helpers';

/* ── stat config ─────────────────────────────────────────────── */
const STAT_CFG = [
  {
    key: 'listings',
    labelKey: 'activeListings',
    color: '#2e7d32',
    bg: '#e8f5e9',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    ),
  },
  {
    key: 'kg',
    labelKey: 'kgUploaded',
    color: '#e65100',
    bg: '#fff3e0',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    ),
  },
  {
    key: 'value',
    labelKey: 'totalValue',
    color: '#1565c0',
    bg: '#e3f2fd',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    ),
  },
];

/* ── detail rows ─────────────────────────────────────────────── */
const DETAIL_ICONS = {
  name: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  email: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  role: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  date: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  list: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

export default function FarmerProfilePage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const user = getStoredUser(session?.email);
  const activity = getActivity(session?.email);
  const uploads = activity.uploads || [];

  const totalQty = uploads.reduce((s, u) => s + (u.quantity || 0), 0);
  const totalValue = uploads.reduce((s, u) => s + (u.quantity || 0) * (u.price || 0), 0);
  const statValues = [uploads.length, totalQty.toLocaleString(), `₹${totalValue.toLocaleString()}`];

  const details = [
    { icon: DETAIL_ICONS.name, label: t('fullName'), value: user?.name || session?.name },
    { icon: DETAIL_ICONS.email, label: t('email'), value: session?.email },
    { icon: DETAIL_ICONS.role, label: t('role'), value: t('farmer') },
    { icon: DETAIL_ICONS.date, label: t('joined'), value: formatDate(user?.createdAt) },
    { icon: DETAIL_ICONS.list, label: t('totalListings'), value: uploads.length },
  ];

  return (
    <>
      <Navbar dashboardPath="/farmer" />

      <div className="pf">
        <Link className="pf-back" to="/farmer">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          {t('backToDashboard')}
        </Link>

        {/* ── Hero banner ── */}
        <section className="pf-hero pf-hero--farmer">
          <div className="pf-hero__deco" />
          <div className="pf-hero__deco2" />

          <div className="pf-hero__avatar">
            <span className="pf-hero__emoji">🧑‍🌾</span>
            <span className="pf-hero__online" />
          </div>

          <div className="pf-hero__info">
            <h1 className="pf-hero__name">{user?.name || session?.name}</h1>
            <span className="pf-hero__badge">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {t('farmer').toUpperCase()}
            </span>
            <p className="pf-hero__email">{session?.email}</p>
            <p className="pf-hero__joined">{t('memberSince')} {formatDate(user?.createdAt)}</p>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="pf-stats">
          {STAT_CFG.map((s, i) => (
            <div className="pf-stat" key={s.key} style={{ '--delay': `${i * .08}s` }}>
              <div className="pf-stat__icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <span className="pf-stat__value" style={{ color: s.color }}>{statValues[i]}</span>
              <span className="pf-stat__label">{t(s.labelKey)}</span>
            </div>
          ))}
        </section>

        {/* ── Crop Listings History ── */}
        <section className="pf-card">
          <div className="pf-card__head">
            <div className="pf-card__head-icon pf-card__head-icon--green">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h2 className="pf-card__title">{t('cropListHistory')}</h2>
          </div>

          {uploads.length === 0 ? (
            <div className="pf-empty">
              <svg className="pf-empty__art" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="12" y="18" width="56" height="44" rx="8" fill="#e8f5e9"/>
                <rect x="20" y="30" width="28" height="4" rx="2" fill="#a5d6a7"/>
                <rect x="20" y="38" width="20" height="4" rx="2" fill="#c8e6c9"/>
                <rect x="20" y="46" width="24" height="4" rx="2" fill="#c8e6c9"/>
                <circle cx="58" cy="56" r="14" fill="#43a047" opacity=".15"/>
                <path d="M54 56l3 3 6-6" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="pf-empty__text">{t('noListingsYet')}</p>
              <Link className="pf-empty__btn" to="/farmer/upload">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {t('uploadCrop')}
              </Link>
            </div>
          ) : (
            <div className="pf-history">
              {uploads.map((u, i) => (
                <div key={i} className="pf-hitem">
                  <div className="pf-hitem__icon">🌱</div>
                  <div className="pf-hitem__body">
                    <span className="pf-hitem__title">{u.crop}</span>
                    <span className="pf-hitem__sub">{u.quantity} kg at ₹{u.price}/kg • {u.location}</span>
                  </div>
                  <div className="pf-hitem__right">
                    <span className="pf-hitem__amount">₹{(u.quantity * u.price).toLocaleString()}</span>
                    <span className="pf-hitem__date">{formatDate(u.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Account Details ── */}
        <section className="pf-card">
          <div className="pf-card__head">
            <div className="pf-card__head-icon pf-card__head-icon--gray">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
            <h2 className="pf-card__title">{t('accountDetails')}</h2>
          </div>

          <div className="pf-details">
            {details.map((d, i) => (
              <div className="pf-drow" key={i}>
                <span className="pf-drow__icon">{d.icon}</span>
                <span className="pf-drow__label">{d.label}</span>
                <span className="pf-drow__value">{d.value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
