import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { getActivity, getOrderCount, formatDate } from '../utils/helpers';
import DashboardLayout from '../components/DashboardLayout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function FarmerDashboard() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const activity = getActivity(session?.email);
  const connections = activity?.contacts?.length || 0;
  const totalOrders = getOrderCount(session?.email);

  useEffect(() => {
    if (!session?.name) { setLoading(false); return; }
    fetch(`${API}/api/farmer/stats?farmer_name=${encodeURIComponent(session.name)}`)
      .then(r => r.json())
      .then(data => setDbStats(data))
      .catch(() => setDbStats(null))
      .finally(() => setLoading(false));
  }, [session?.name]);

  const STATS = [
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, value: loading ? '…' : (dbStats?.active_listings ?? 0), label: t('activeListings'), color: '#4caf50' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, value: loading ? '…' : (dbStats?.total_listings ?? 0), label: t('totalListings') || 'Total Listings', color: '#2196f3' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, value: connections, label: t('connections'), color: '#ff9800' },
    { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>, value: totalOrders, label: t('orders') || 'Orders', color: '#f44336' },
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

  // Build activity from real data
  const recentUploads = (activity?.uploads || []).slice(0, 3).map(u => ({
    text: `Listed ${u.quantity || ''} kg ${u.crop || 'crop'}`,
    time: formatDate(u.timestamp),
    dot: '#4caf50',
  }));
  const recentContacts = (activity?.contacts || []).slice(0, 2).map(c => ({
    text: `Connected with ${c.merchant || c.name || 'a merchant'}`,
    time: formatDate(c.timestamp),
    dot: '#2196f3',
  }));
  const recentDbListings = (dbStats?.recent_listings || []).slice(0, 3).map(l => ({
    text: `${l.crop} — ${l.quantity} kg @ ₹${l.price}/kg`,
    time: formatDate(l.created_at),
    dot: l.active ? '#4caf50' : '#999',
  }));
  const ACTIVITY = recentUploads.length || recentContacts.length
    ? [...recentUploads, ...recentContacts].slice(0, 5)
    : recentDbListings.length
      ? recentDbListings
      : [{ text: t('noRecentActivity') || 'No recent activity', time: '', dot: '#ccc' }];

  return (
    <DashboardLayout>
      <div className="db">
        {/* ── Welcome banner ── */}
        <section className="db-banner db-banner--farmer">
          <div className="db-banner__bg" />
          <div className="db-banner__content">
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
          <span className="db-tip__icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg></span>
          <div>
            <span className="db-tip__title">{t('proTip')}</span>
            <p className="db-tip__text">{t('farmerTip')}</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
