import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { getOrders, formatDate } from '../utils/helpers';

/* ── Icons ── */
const I = {
  arrowBack: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  bag:       <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  truck:     <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  check:     <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  clock:     <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  box:       <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  rupee:     <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  pin:       <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  filter:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  empty:     <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="#f5f5f5"/><rect x="24" y="20" width="32" height="40" rx="6" fill="#fff" stroke="#e0e0e0" strokeWidth="2"/><line x1="30" y1="30" x2="50" y2="30" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round"/><line x1="30" y1="36" x2="44" y2="36" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round"/><line x1="30" y1="42" x2="48" y2="42" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round"/><line x1="30" y1="48" x2="40" y2="48" stroke="#e0e0e0" strokeWidth="2" strokeLinecap="round"/></svg>,
};

const STATUS_MAP = {
  confirmed:  { label: 'Confirmed',   color: '#1565c0', bg: '#e3f2fd' },
  processing: { label: 'Processing',  color: '#e65100', bg: '#fff3e0' },
  shipped:    { label: 'Shipped',     color: '#6a1b9a', bg: '#f3e5f5' },
  delivered:  { label: 'Delivered',   color: '#2e7d32', bg: '#e8f5e9' },
  cancelled:  { label: 'Cancelled',   color: '#c62828', bg: '#ffebee' },
};

export default function MyOrdersPage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');

  const allOrders = useMemo(() => {
    if (!session?.email) return [];
    return getOrders(session.email);
  }, [session]);

  const orders = useMemo(() => {
    if (filter === 'all') return allOrders;
    return allOrders.filter(o => o.status === filter);
  }, [allOrders, filter]);

  const stats = useMemo(() => {
    const total = allOrders.length;
    const spent = allOrders.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const qty = allOrders.reduce((s, o) => s + (o.quantity || 0), 0);
    return { total, spent, qty };
  }, [allOrders]);

  return (
    <DashboardLayout>
      <div className="mo">
        {/* Header */}
        <div className="mo__head">
          <Link className="mo__back" to="/merchant">
            {I.arrowBack} {t('backToDashboard')}
          </Link>
          <h1 className="mo__title">
            {I.bag} <span>{t('myOrders')}</span>
          </h1>
          <p className="mo__sub">{t('trackManageOrders')}</p>
        </div>

        {/* Stats strip */}
        <div className="mo__stats">
          <div className="mo__stat">
            <span className="mo__stat-icon mo__stat-icon--blue">{I.bag}</span>
            <div>
              <span className="mo__stat-val">{stats.total}</span>
              <span className="mo__stat-label">{t('totalOrders')}</span>
            </div>
          </div>
          <div className="mo__stat">
            <span className="mo__stat-icon mo__stat-icon--green">{I.rupee}</span>
            <div>
              <span className="mo__stat-val">₹{stats.spent.toLocaleString()}</span>
              <span className="mo__stat-label">{t('totalSpent')}</span>
            </div>
          </div>
          <div className="mo__stat">
            <span className="mo__stat-icon mo__stat-icon--orange">{I.box}</span>
            <div>
              <span className="mo__stat-val">{stats.qty} kg</span>
              <span className="mo__stat-label">{t('totalQuantity')}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mo__filters">
          <span className="mo__filters-label">{I.filter} {t('filter')}:</span>
          {['all', 'confirmed', 'processing', 'shipped', 'delivered'].map(f => (
            <button
              key={f}
              className={`mo__filter-btn ${filter === f ? 'mo__filter-btn--active' : ''}`}
              type="button"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t('all') : t(f)}
            </button>
          ))}
        </div>

        {/* Order list */}
        {orders.length === 0 ? (
          <div className="mo__empty">
            {I.empty}
            <p className="mo__empty-title">
              {allOrders.length === 0 ? t('noOrders') : t('noMatchingOrders')}
            </p>
            <p className="mo__empty-desc">
              {allOrders.length === 0
                ? t('startFinding')
                : t('adjustFilter')}
            </p>
            {allOrders.length === 0 && (
              <Link className="mo__empty-cta" to="/merchant/find-farmers">
                {t('findFarmers')}
              </Link>
            )}
          </div>
        ) : (
          <div className="mo__list">
            {orders.map((order, i) => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.confirmed;
              return (
                <div className="mo__card" key={order.orderId} style={{ '--i': i }}>
                  {/* Card header */}
                  <div className="mo__card-head">
                    <div className="mo__card-id">
                      <span className="mo__card-id-label">{t('order')}</span>
                      <span className="mo__card-id-val">{order.orderId}</span>
                    </div>
                    <span className="mo__card-status" style={{ color: st.color, background: st.bg }}>
                      {order.status === 'delivered' && I.check}
                      {order.status === 'confirmed' && I.clock}
                      {order.status === 'processing' && I.clock}
                      {order.status === 'shipped' && I.truck}
                      {st.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="mo__card-body">
                    <div className="mo__card-farmer">
                      <div className="mo__card-avatar">
                        {order.farmer?.name?.charAt(0) || 'F'}
                      </div>
                      <div className="mo__card-farmer-info">
                        <strong>{order.farmer?.name}</strong>
                        <span>{order.farmer?.crop} · {order.farmer?.distance} km</span>
                      </div>
                    </div>

                    <div className="mo__card-grid">
                      <div className="mo__card-cell">
                        <span className="mo__card-cell-label">{t('quantity')}</span>
                        <span className="mo__card-cell-val">{order.quantity} kg</span>
                      </div>
                      <div className="mo__card-cell">
                        <span className="mo__card-cell-label">{t('unitPrice')}</span>
                        <span className="mo__card-cell-val">₹{order.farmer?.price}/kg</span>
                      </div>
                      <div className="mo__card-cell">
                        <span className="mo__card-cell-label">{t('delivery')}</span>
                        <span className="mo__card-cell-val">₹{order.deliveryFee?.toLocaleString()}</span>
                      </div>
                      <div className="mo__card-cell">
                        <span className="mo__card-cell-label">{t('total')}</span>
                        <span className="mo__card-cell-val mo__card-cell-val--total">₹{order.grandTotal?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="mo__card-foot">
                    <span className="mo__card-date">
                      {I.clock} {formatDate(order.placedAt)}
                    </span>
                    <span className="mo__card-payment">
                      {order.payment}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
