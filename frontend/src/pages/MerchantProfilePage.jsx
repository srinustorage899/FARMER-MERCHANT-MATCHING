import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import DashboardLayout from '../components/DashboardLayout';
import { getStoredUser, getActivity, formatDate } from '../utils/helpers';

/* ── stat config ─────────────────────────────────────────────── */
const STAT_CFG = [
  {
    key: 'searches',
    labelKey: 'searches',
    color: '#1565c0',
    bg: '#e3f2fd',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    ),
  },
  {
    key: 'contacts',
    labelKey: 'contactsMade',
    color: '#2e7d32',
    bg: '#e8f5e9',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    ),
  },
  {
    key: 'found',
    labelKey: 'farmersFound',
    color: '#e65100',
    bg: '#fff3e0',
    icon: (
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
  },
];

/* ── detail row icons ────────────────────────────────────────── */
const ICON = {
  name: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  email: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  role: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  date: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  search: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  contact: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
};

export default function MerchantProfilePage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const user = getStoredUser(session?.email);
  const activity = getActivity(session?.email);
  const searches = activity.searches || [];
  const contacts = activity.contacts || [];

  const farmersFound = searches.reduce((s, x) => s + (x.resultsCount || 0), 0);
  const statValues = [searches.length, contacts.length, farmersFound];

  const details = [
    { icon: ICON.name, label: t('fullName'), value: user?.name || session?.name },
    { icon: ICON.email, label: t('email'), value: session?.email },
    { icon: ICON.role, label: t('role'), value: t('merchant') },
    { icon: ICON.date, label: t('joined'), value: formatDate(user?.createdAt) },
    { icon: ICON.search, label: t('totalSearches'), value: searches.length },
    { icon: ICON.contact, label: t('totalContacts'), value: contacts.length },
  ];

  return (
    <DashboardLayout>
      <div className="pf">
        <Link className="pf-back" to="/merchant">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          {t('backToDashboard')}
        </Link>

        {/* ── Hero banner ── */}
        <section className="pf-hero pf-hero--merchant">
          <div className="pf-hero__deco" />
          <div className="pf-hero__deco2" />

          <div className="pf-hero__avatar">
            <span className="pf-hero__emoji">🏪</span>
            <span className="pf-hero__online" />
          </div>

          <div className="pf-hero__info">
            <h1 className="pf-hero__name">{user?.name || session?.name}</h1>
            <span className="pf-hero__badge pf-hero__badge--merchant">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {t('merchant').toUpperCase()}
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

        {/* ── Contact History ── */}
        <section className="pf-card">
          <div className="pf-card__head">
            <div className="pf-card__head-icon pf-card__head-icon--blue">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <h2 className="pf-card__title">{t('contactHistory')}</h2>
          </div>

          {contacts.length === 0 ? (
            <div className="pf-empty">
              <svg className="pf-empty__art" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="36" r="20" fill="#e3f2fd"/>
                <circle cx="32" cy="32" r="8" fill="#90caf9"/>
                <circle cx="48" cy="32" r="8" fill="#90caf9"/>
                <path d="M26 48c0-4 6-7 14-7s14 3 14 7" stroke="#1565c0" strokeWidth="2" fill="none"/>
                <circle cx="60" cy="58" r="12" fill="#1565c0" opacity=".12"/>
                <path d="M56 58l3 3 6-6" stroke="#1565c0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="pf-empty__text">{t('noContactsYet')}</p>
              <Link className="pf-empty__btn pf-empty__btn--blue" to="/merchant/find-farmers">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                {t('findFarmers')}
              </Link>
            </div>
          ) : (
            <div className="pf-history">
              {contacts.map((c, i) => (
                <div key={i} className="pf-hitem">
                  <div className="pf-hitem__icon">🧑‍🌾</div>
                  <div className="pf-hitem__body">
                    <span className="pf-hitem__title">{c.farmerName}</span>
                    <span className="pf-hitem__sub">{t('contactRequestSent')}</span>
                  </div>
                  <div className="pf-hitem__right">
                    <span className="pf-hitem__date">{formatDate(c.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Search History ── */}
        <section className="pf-card">
          <div className="pf-card__head">
            <div className="pf-card__head-icon pf-card__head-icon--orange">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h2 className="pf-card__title">{t('searchHistory')}</h2>
          </div>

          {searches.length === 0 ? (
            <div className="pf-empty">
              <svg className="pf-empty__art" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="36" cy="36" r="22" fill="#fff3e0"/>
                <circle cx="36" cy="36" r="14" stroke="#ffb74d" strokeWidth="3" fill="none"/>
                <line x1="46" y1="46" x2="60" y2="60" stroke="#ffb74d" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <p className="pf-empty__text">{t('noSearchesYet')}</p>
            </div>
          ) : (
            <div className="pf-history">
              {searches.map((s, i) => (
                <div key={i} className="pf-hitem">
                  <div className="pf-hitem__icon">🌱</div>
                  <div className="pf-hitem__body">
                    <span className="pf-hitem__title">{s.crop}</span>
                    <span className="pf-hitem__sub">
                      {s.quantity} kg • Max ₹{s.maxPrice}/kg • {s.radius} km radius
                    </span>
                  </div>
                  <div className="pf-hitem__right">
                    <span className="pf-hitem__amount">
                      {s.resultsCount} result{s.resultsCount !== 1 ? 's' : ''}
                    </span>
                    <span className="pf-hitem__date">{formatDate(s.timestamp)}</span>
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
    </DashboardLayout>
  );
}
