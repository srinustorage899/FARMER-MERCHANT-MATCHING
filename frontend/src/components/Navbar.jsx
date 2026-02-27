import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export default function Navbar({ dashboardPath = '/' }) {
  const { session, logout } = useAuth();
  const { t } = useLanguage();
  const profilePath = session?.role === 'farmer' ? '/farmer/profile' : '/merchant/profile';

  return (
    <nav className="nav">
      <Link className="nav__brand" to={dashboardPath}>
        🌾 AgriMatch
      </Link>
      <div className="nav__right">
        <Link className="nav__link" to={dashboardPath}>
          {t('dashboard')}
        </Link>
        <Link className="nav__link" to={profilePath}>
          {t('profile')}
        </Link>
        <Link className="nav__link" to="/settings">
          ⚙️ {t('settings')}
        </Link>
        <button className="nav__logout" type="button" onClick={logout}>
          {t('logout')}
        </button>
      </div>
    </nav>
  );
}
