import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

/* ── SVG Icons ── */
const icons = {
  dashboard: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  upload: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  search: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  orders: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
  profile: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  settings: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
};

const FARMER_NAV = [
  { to: '/farmer',         icon: icons.dashboard, labelKey: 'dashboard' },
  { to: '/farmer/upload',  icon: icons.upload,    labelKey: 'uploadCrop' },
  { to: '/farmer/profile', icon: icons.profile,   labelKey: 'profile' },
];

const MERCHANT_NAV = [
  { to: '/merchant',              icon: icons.dashboard, labelKey: 'dashboard' },
  { to: '/merchant/find-farmers', icon: icons.search,    labelKey: 'findFarmers' },
  { to: '/merchant/orders',       icon: icons.orders,    labelKey: 'myOrders' },
  { to: '/merchant/profile',      icon: icons.profile,   labelKey: 'profile' },
];

export default function Sidebar({ onMobileClose }) {
  const { session, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = session?.role === 'farmer' ? FARMER_NAV : MERCHANT_NAV;
  const isFarmer = session?.role === 'farmer';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <span className="sidebar__logo">🌾</span>
        <span className="sidebar__app-name">AgriMatch</span>
        {/* Mobile close button */}
        <button className="sidebar__close" onClick={onMobileClose} aria-label="Close menu">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* User pill */}
      <div className="sidebar__user">
        <div className={`sidebar__avatar ${isFarmer ? 'sidebar__avatar--farmer' : 'sidebar__avatar--merchant'}`}>
          {session?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="sidebar__user-info">
          <span className="sidebar__user-name">{session?.name || 'User'}</span>
          <span className="sidebar__user-role">{isFarmer ? t('farmer') || 'Farmer' : t('merchant') || 'Merchant'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <span className="sidebar__nav-label">MENU</span>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/farmer' || item.to === '/merchant'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
            onClick={onMobileClose}
          >
            <span className="sidebar__link-icon">{item.icon}</span>
            <span className="sidebar__link-text">{t(item.labelKey) || item.labelKey}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar__bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
          }
          onClick={onMobileClose}
        >
          <span className="sidebar__link-icon">{icons.settings}</span>
          <span className="sidebar__link-text">{t('settings') || 'Settings'}</span>
        </NavLink>
        <button className="sidebar__link sidebar__logout" onClick={logout}>
          <span className="sidebar__link-icon">{icons.logout}</span>
          <span className="sidebar__link-text">{t('logout') || 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
