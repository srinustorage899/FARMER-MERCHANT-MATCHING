import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { isEmail, getStoredUser, setStoredUser } from '../utils/helpers';

/* ── Password‑strength helpers ─────────────────────────────────────── */
function getStrength(pw) {
  return {
    length:    pw.length >= 8,
    upper:     /[A-Z]/.test(pw),
    lower:     /[a-z]/.test(pw),
    number:    /\d/.test(pw),
  };
}
function strengthScore(s) {
  return [s.length, s.upper, s.lower, s.number].filter(Boolean).length;
}
const STRENGTH_COLORS = ['', '#ef5350', '#ff9800', '#4caf50', '#2e7d32'];

/* ── Eye icon SVGs ─────────────────────────────────────────────────── */
const EyeOpen = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeClosed = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

/* ── Spinner ───────────────────────────────────────────────────────── */
const Spinner = () => <span className="auth-spinner" />;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  // Strength labels: Weak / Fair / Good / Strong
  const strengthLabel = (sc) => {
    const labels = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
    return labels[sc] || '';
  };

  const [tab, setTab] = useState('login');

  /* ── Login state ── */
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});

  /* ── Signup state ── */
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);
  const [signupRole, setSignupRole] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState('');

  const strength = useMemo(() => getStrength(signupPassword), [signupPassword]);
  const score    = useMemo(() => strengthScore(strength), [strength]);

  function redirectByRole(role) {
    navigate(role === 'farmer' ? '/farmer' : '/merchant');
  }

  /* ── Login handler ── */
  function handleLogin(e) {
    e.preventDefault();
    const errs = {};
    if (!loginEmail) errs.email = 'Email is required';
    else if (!isEmail(loginEmail)) errs.email = 'Enter a valid email address';
    if (!loginPassword) errs.password = 'Password is required';
    else if (loginPassword.length < 6) errs.password = 'Must be at least 6 characters';
    setLoginErrors(errs);
    if (Object.keys(errs).length) return;

    setLoginLoading(true);
    setTimeout(() => {
      const stored = getStoredUser(loginEmail);
      if (!stored) {
        setLoginErrors({ form: 'No account found. Please sign up first.' });
        setLoginLoading(false);
        return;
      }
      if (stored.password !== loginPassword) {
        setLoginErrors({ form: 'Incorrect password. Please try again.' });
        setLoginLoading(false);
        return;
      }
      login({ email: stored.email, name: stored.name, role: stored.role });
      redirectByRole(stored.role);
    }, 800);
  }

  /* ── Signup handler ── */
  function handleSignup(e) {
    e.preventDefault();
    const errs = {};
    if (!signupName || signupName.length < 2) errs.name = 'Name must be at least 2 characters';
    if (!signupEmail) errs.email = 'Email is required';
    else if (!isEmail(signupEmail)) errs.email = 'Enter a valid email address';
    if (!signupPassword) errs.password = 'Password is required';
    else if (score < 4) errs.password = 'Password must meet all requirements';
    if (signupPassword !== signupConfirm) errs.confirm = 'Passwords do not match';
    if (!signupRole) errs.role = 'Please select your role';
    if (!agreeTerms) errs.terms = 'You must accept the terms';
    setSignupErrors(errs);
    if (Object.keys(errs).length) return;

    setSignupLoading(true);
    const userData = {
      name: signupName,
      email: signupEmail,
      password: signupPassword,
      role: signupRole,
    };
    // Store locally
    setStoredUser(userData);
    // Register merchant in backend if role is Merchant
    if (signupRole === 'Merchant') {
      fetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/merchant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName,
          email: signupEmail,
          password: signupPassword,
        }),
      })
      .then(r => r.json())
      .then(res => {
        // Optionally handle response
      })
      .catch(() => {});
    }
    login({ email: signupEmail, name: signupName, role: signupRole });
    setSignupSuccess('Account created! Redirecting…');
    setTimeout(() => redirectByRole(signupRole), 700);
  }

  /* ── Inline field error ── */
  const FieldErr = ({ msg }) =>
    msg ? <span className="auth-field-err">{msg}</span> : null;

  return (
    <div className="auth-page">
      {/* Background decorations */}
      <div className="auth-page__deco auth-page__deco--1" />
      <div className="auth-page__deco auth-page__deco--2" />

      <div className="auth-card">
        {/* ── Brand header ── */}
        <div className="auth-brand">
          <div className="auth-brand__icon-wrap">
            <span className="auth-brand__icon">🌾</span>
          </div>
          <h1 className="auth-brand__title">AgriMatch</h1>
          <p className="auth-brand__sub">Connecting Farmers &amp; Merchants</p>
        </div>

        {/* ── Tabs ── */}
        <div className="auth-tabs">
          <button
            className={`auth-tabs__btn${tab === 'login' ? ' auth-tabs__btn--active' : ''}`}
            type="button"
            onClick={() => { setTab('login'); setLoginErrors({}); }}
          >
            {t('login')}
          </button>
          <button
            className={`auth-tabs__btn${tab === 'signup' ? ' auth-tabs__btn--active' : ''}`}
            type="button"
            onClick={() => { setTab('signup'); setSignupErrors({}); setSignupSuccess(''); }}
          >
            {t('signUp')}
          </button>
          <span
            className="auth-tabs__indicator"
            style={{ transform: tab === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
          />
        </div>

        {/* ────────── LOGIN FORM ────────── */}
        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            {loginErrors.form && (
              <div className="auth-alert auth-alert--error">{loginErrors.form}</div>
            )}

            <div className="auth-fg">
              <label className="auth-fg__label" htmlFor="l-email">{t('email')}</label>
              <div className="auth-fg__input-wrap">
                <span className="auth-fg__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  className={`auth-fg__input${loginErrors.email ? ' auth-fg__input--err' : ''}`}
                  type="email"
                  id="l-email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors(p => ({ ...p, email: '' })); }}
                />
              </div>
              <FieldErr msg={loginErrors.email} />
            </div>

            <div className="auth-fg">
              <label className="auth-fg__label" htmlFor="l-pw">{t('password')}</label>
              <div className="auth-fg__input-wrap">
                <span className="auth-fg__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  className={`auth-fg__input${loginErrors.password ? ' auth-fg__input--err' : ''}`}
                  type={showLoginPw ? 'text' : 'password'}
                  id="l-pw"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors(p => ({ ...p, password: '' })); }}
                />
                <button className="auth-fg__eye" type="button" onClick={() => setShowLoginPw(v => !v)} tabIndex={-1} aria-label="Toggle password">
                  {showLoginPw ? EyeClosed : EyeOpen}
                </button>
              </div>
              <FieldErr msg={loginErrors.password} />
            </div>

            <div className="auth-fg__row">
              <label className="auth-check">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(v => !v)} />
                <span className="auth-check__box" />
                <span className="auth-check__text">{t('rememberMe')}</span>
              </label>
              <a className="auth-forgot" href="#!">{t('forgotPassword')}</a>
            </div>

            <button className="auth-submit" type="submit" disabled={loginLoading}>
              {loginLoading ? <><Spinner /> {t('loggingIn')}</> : t('login')}
            </button>

            {/* Social login */}
            <div className="auth-divider">
              <span>{t('orContinueWith')}</span>
            </div>
            <div className="auth-social">
              <button className="auth-social__btn" type="button">
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 33.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.2 26.7 36 24 36c-5.2 0-9.6-3.6-11.2-8.5l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C36.7 39.3 44 34 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Google
              </button>
              <button className="auth-social__btn" type="button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </button>
            </div>
          </form>
        )}

        {/* ────────── SIGNUP FORM ────────── */}
        {tab === 'signup' && (
          <form className="auth-form" onSubmit={handleSignup} noValidate>
            {signupSuccess && (
              <div className="auth-alert auth-alert--success">{signupSuccess}</div>
            )}
            {signupErrors.form && (
              <div className="auth-alert auth-alert--error">{signupErrors.form}</div>
            )}

            {/* Role selector */}
            <div className="auth-fg">
              <span className="auth-fg__label">{t('iAmA')}</span>
              <div className="auth-role">
                <label className={`auth-role__opt${signupRole === 'farmer' ? ' auth-role__opt--active' : ''}`}>
                  <input type="radio" name="role" value="farmer" className="auth-role__radio"
                    checked={signupRole === 'farmer'}
                    onChange={(e) => { setSignupRole(e.target.value); setSignupErrors(p => ({ ...p, role: '' })); }}
                  />
                  <span className="auth-role__emoji">🌾</span>
                  <span className="auth-role__name">{t('farmer')}</span>
                </label>
                <label className={`auth-role__opt${signupRole === 'merchant' ? ' auth-role__opt--active' : ''}`}>
                  <input type="radio" name="role" value="merchant" className="auth-role__radio"
                    checked={signupRole === 'merchant'}
                    onChange={(e) => { setSignupRole(e.target.value); setSignupErrors(p => ({ ...p, role: '' })); }}
                  />
                  <span className="auth-role__emoji">🏪</span>
                  <span className="auth-role__name">{t('merchant')}</span>
                </label>
              </div>
              <FieldErr msg={signupErrors.role} />
            </div>

            {/* Full name */}
            <div className="auth-fg">
              <label className="auth-fg__label" htmlFor="s-name">{t('fullName')}</label>
              <div className="auth-fg__input-wrap">
                <span className="auth-fg__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <input
                  className={`auth-fg__input${signupErrors.name ? ' auth-fg__input--err' : ''}`}
                  type="text" id="s-name" placeholder="John Doe" autoComplete="name"
                  value={signupName}
                  onChange={(e) => { setSignupName(e.target.value); setSignupErrors(p => ({ ...p, name: '' })); }}
                />
              </div>
              <FieldErr msg={signupErrors.name} />
            </div>

            {/* Email */}
            <div className="auth-fg">
              <label className="auth-fg__label" htmlFor="s-email">{t('email')}</label>
              <div className="auth-fg__input-wrap">
                <span className="auth-fg__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  className={`auth-fg__input${signupErrors.email ? ' auth-fg__input--err' : ''}`}
                  type="email" id="s-email" placeholder="you@example.com" autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => { setSignupEmail(e.target.value); setSignupErrors(p => ({ ...p, email: '' })); }}
                />
              </div>
              <FieldErr msg={signupErrors.email} />
            </div>

            {/* Password */}
            <div className="auth-fg">
              <label className="auth-fg__label" htmlFor="s-pw">{t('password')}</label>
              <div className="auth-fg__input-wrap">
                <span className="auth-fg__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  className={`auth-fg__input${signupErrors.password ? ' auth-fg__input--err' : ''}`}
                  type={showSignupPw ? 'text' : 'password'}
                  id="s-pw" placeholder="Min. 8 characters" autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors(p => ({ ...p, password: '' })); }}
                />
                <button className="auth-fg__eye" type="button" onClick={() => setShowSignupPw(v => !v)} tabIndex={-1} aria-label="Toggle password">
                  {showSignupPw ? EyeClosed : EyeOpen}
                </button>
              </div>
              <FieldErr msg={signupErrors.password} />

              {/* Password strength */}
              {signupPassword && (
                <div className="auth-strength">
                  <div className="auth-strength__bar">
                    <div
                      className="auth-strength__fill"
                      style={{ width: `${(score / 4) * 100}%`, background: STRENGTH_COLORS[score] }}
                    />
                  </div>
                  <span className="auth-strength__label" style={{ color: STRENGTH_COLORS[score] }}>
                    {strengthLabel(score)}
                  </span>
                  <ul className="auth-strength__reqs">
                    <li className={strength.length ? 'met' : ''}>
                      <span className="auth-strength__icon">{strength.length ? '✓' : '✗'}</span> {t('pwChars')}
                    </li>
                    <li className={strength.upper ? 'met' : ''}>
                      <span className="auth-strength__icon">{strength.upper ? '✓' : '✗'}</span> {t('pwUpper')}
                    </li>
                    <li className={strength.lower ? 'met' : ''}>
                      <span className="auth-strength__icon">{strength.lower ? '✓' : '✗'}</span> {t('pwLower')}
                    </li>
                    <li className={strength.number ? 'met' : ''}>
                      <span className="auth-strength__icon">{strength.number ? '✓' : '✗'}</span> {t('pwNumber')}
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="auth-fg">
              <label className="auth-fg__label" htmlFor="s-cpw">{t('confirmPassword')}</label>
              <div className="auth-fg__input-wrap">
                <span className="auth-fg__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
                </span>
                <input
                  className={`auth-fg__input${signupErrors.confirm ? ' auth-fg__input--err' : ''}`}
                  type={showSignupConfirm ? 'text' : 'password'}
                  id="s-cpw" placeholder="Re-enter password" autoComplete="new-password"
                  value={signupConfirm}
                  onChange={(e) => { setSignupConfirm(e.target.value); setSignupErrors(p => ({ ...p, confirm: '' })); }}
                />
                <button className="auth-fg__eye" type="button" onClick={() => setShowSignupConfirm(v => !v)} tabIndex={-1} aria-label="Toggle password">
                  {showSignupConfirm ? EyeClosed : EyeOpen}
                </button>
              </div>
              <FieldErr msg={signupErrors.confirm} />
            </div>

            {/* Terms */}
            <label className="auth-check">
              <input type="checkbox" checked={agreeTerms} onChange={() => { setAgreeTerms(v => !v); setSignupErrors(p => ({ ...p, terms: '' })); }} />
              <span className="auth-check__box" />
              <span className="auth-check__text">
                {t('termsAgree')} <a href="#!" className="auth-link">{t('termsOfService')}</a> & <a href="#!" className="auth-link">{t('privacyPolicy')}</a>
              </span>
            </label>
            <FieldErr msg={signupErrors.terms} />

            <button className="auth-submit" type="submit" disabled={signupLoading}>
              {signupLoading ? <><Spinner /> {t('creatingAccount')}</> : t('createAccount')}
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <p className="auth-footer">
          {t('termsAgree')} AgriMatch{' '}
          <a href="#!" className="auth-link">{t('termsOfService')}</a> &{' '}
          <a href="#!" className="auth-link">{t('privacyPolicy')}</a>.
        </p>

        <Link className="auth-back" to="/">{t('backToHome')}</Link>
      </div>
    </div>
  );
}
