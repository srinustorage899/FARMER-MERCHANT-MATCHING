import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Icons ── */
const I = {
  close:    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  minus:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  plus:     <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  truck:    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  shield:   <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  check:    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  star:     <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  pin:      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  rupee:    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  box:      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  wallet:   <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
  clock:    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  mapPin:   <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  bag:      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  arrowR:   <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  arrowL:   <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  copy:     <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

const PAYMENT_METHODS = [
  { id: 'cod',  label: 'Cash on Delivery',       desc: 'Pay when you receive the goods',   icon: '💵' },
  { id: 'upi',  label: 'UPI / Google Pay',        desc: 'Instant digital payment',          icon: '📱' },
  { id: 'bank', label: 'Bank Transfer (NEFT)',     desc: 'Direct bank-to-bank transfer',     icon: '🏦' },
];

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AGM-${ts}-${rand}`;
}

function estimateDelivery(distKm) {
  if (distKm <= 10) return { days: '1-2', label: 'Express' };
  if (distKm <= 50) return { days: '2-3', label: 'Standard' };
  if (distKm <= 150) return { days: '3-5', label: 'Standard' };
  return { days: '5-7', label: 'Economy' };
}

function deliveryFee(distKm, weightKg) {
  const baseFee = 50;
  const perKmRate = 2;
  const perKgRate = 0.5;
  const fee = baseFee + (distKm * perKmRate) + (weightKg * perKgRate);
  return Math.round(fee);
}

/* ═══════════════════════════════════════════════════════════════
   ORDER MODAL — 3-Step Purchase Flow
   ═══════════════════════════════════════════════════════════════ */
export default function OrderModal({ farmer, merchantName, onClose, onOrderPlaced }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [qty, setQty] = useState(Math.min(farmer.quantity, 100));
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef(null);

  const maxQty = farmer.quantity;
  const unitPrice = farmer.price;
  const subtotal = qty * unitPrice;
  const dist = farmer.distance;
  const delFee = deliveryFee(dist, qty);
  const platformFee = Math.round(subtotal * 0.02); // 2% platform fee
  const grandTotal = subtotal + delFee + platformFee;
  const delivery = estimateDelivery(dist);
  const rating = farmer.rating || (4.5 + ((farmer.name?.charCodeAt(0) || 0) % 5) * 0.1).toFixed(1);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && step < 3) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === backdropRef.current && step < 3) onClose();
  }, [onClose, step]);

  function adjustQty(delta) {
    setQty(prev => Math.max(1, Math.min(maxQty, prev + delta)));
  }

  function handleQtyInput(e) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) setQty(Math.max(1, Math.min(maxQty, val)));
    else if (e.target.value === '') setQty(1);
  }

  async function placeOrder() {
    setPlacing(true);
    // Simulate order placement (1.2s delay)
    await new Promise(r => setTimeout(r, 1200));

    const id = generateOrderId();
    setOrderId(id);

    // Build order object
    const order = {
      orderId: id,
      farmer: {
        name: farmer.name,
        crop: farmer.crop,
        price: farmer.price,
        distance: farmer.distance,
        lat: farmer.lat,
        lon: farmer.lon,
        listingId: farmer.id,
      },
      quantity: qty,
      subtotal,
      deliveryFee: delFee,
      platformFee,
      grandTotal,
      payment: PAYMENT_METHODS.find(p => p.id === payment)?.label,
      delivery: delivery,
      status: 'confirmed',
      placedAt: new Date().toISOString(),
    };

    if (onOrderPlaced) onOrderPlaced(order);
    setPlacing(false);
    setStep(3);
  }

  function copyOrderId() {
    navigator.clipboard.writeText(orderId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  /* ── Quantity percentage for slider ── */
  const qtyPct = ((qty - 1) / Math.max(maxQty - 1, 1)) * 100;

  return (
    <div className="om-backdrop" ref={backdropRef} onClick={handleBackdropClick}>
      <div className={`om ${step === 3 ? 'om--success' : ''}`}>

        {/* ── Header ── */}
        <div className="om__header">
          <div className="om__header-left">
            {step === 2 && (
              <button className="om__back" type="button" onClick={() => setStep(1)}>
                {I.arrowL}
              </button>
            )}
            <div className="om__header-info">
              <h2 className="om__title">
                {step === 1 && <>{I.bag} Configure Order</>}
                {step === 2 && <>{I.shield} Review & Confirm</>}
                {step === 3 && <>{I.check} Order Confirmed!</>}
              </h2>
              <p className="om__subtitle">
                {step === 1 && 'Adjust quantity and review pricing'}
                {step === 2 && 'Verify details before placing order'}
                {step === 3 && 'Your order has been placed successfully'}
              </p>
            </div>
          </div>

          {step < 3 && (
            <button className="om__close" type="button" onClick={onClose} aria-label="Close">
              {I.close}
            </button>
          )}
        </div>

        {/* ── Progress Steps ── */}
        <div className="om__progress">
          {['Configure', 'Review', 'Confirmed'].map((label, i) => (
            <div key={label} className={`om__step ${step > i + 1 ? 'om__step--done' : ''} ${step === i + 1 ? 'om__step--active' : ''}`}>
              <div className="om__step-dot">
                {step > i + 1 ? I.check : <span>{i + 1}</span>}
              </div>
              <span className="om__step-label">{label}</span>
              {i < 2 && <div className={`om__step-line ${step > i + 1 ? 'om__step-line--done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="om__body">

          {/* ╔════════════════════════════════════╗
             ║  STEP 1 — Configure               ║
             ╚════════════════════════════════════╝ */}
          {step === 1 && (
            <div className="om__step-content om__step-content--1">
              {/* Farmer summary card */}
              <div className="om__farmer">
                <div className="om__farmer-avatar" style={{ background: farmer.markerColor || '#43a047' }}>
                  {farmer.name?.charAt(0) || 'F'}
                </div>
                <div className="om__farmer-info">
                  <span className="om__farmer-name">{farmer.name}</span>
                  <span className="om__farmer-meta">
                    <span className="om__farmer-rating">{I.star} {rating}</span>
                    <span className="om__farmer-dist">{I.pin} {dist} km away</span>
                  </span>
                </div>
                <div className="om__farmer-crop-badge">{farmer.crop}</div>
              </div>

              {/* Quantity selector */}
              <div className="om__section">
                <h3 className="om__section-title">{I.box} Select Quantity</h3>
                <div className="om__qty-row">
                  <button className="om__qty-btn" type="button" onClick={() => adjustQty(-10)} disabled={qty <= 1}>
                    {I.minus}
                  </button>
                  <div className="om__qty-input-wrap">
                    <input
                      type="number"
                      className="om__qty-input"
                      value={qty}
                      onChange={handleQtyInput}
                      min="1"
                      max={maxQty}
                    />
                    <span className="om__qty-unit">kg</span>
                  </div>
                  <button className="om__qty-btn" type="button" onClick={() => adjustQty(10)} disabled={qty >= maxQty}>
                    {I.plus}
                  </button>
                </div>

                {/* Qty slider */}
                <input
                  type="range"
                  className="om__qty-slider"
                  min="1"
                  max={maxQty}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, #43a047 ${qtyPct}%, #e0e0e0 ${qtyPct}%)` }}
                />
                <div className="om__qty-range">
                  <span>1 kg</span>
                  <span className="om__qty-avail">{maxQty} kg available</span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="om__section">
                <h3 className="om__section-title">{I.rupee} Price Breakdown</h3>
                <div className="om__price-rows">
                  <div className="om__price-row">
                    <span>Unit Price</span>
                    <span>₹{unitPrice}/kg</span>
                  </div>
                  <div className="om__price-row">
                    <span>Quantity</span>
                    <span>{qty} kg</span>
                  </div>
                  <div className="om__price-row">
                    <span>Subtotal</span>
                    <span className="om__price-val">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="om__price-row">
                    <span>Delivery ({delivery.label})</span>
                    <span>₹{delFee.toLocaleString()}</span>
                  </div>
                  <div className="om__price-row">
                    <span>Platform Fee (2%)</span>
                    <span>₹{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="om__price-row om__price-row--total">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="om__delivery-info">
                <div className="om__delivery-icon">{I.truck}</div>
                <div>
                  <strong>Est. Delivery: {delivery.days} days</strong>
                  <span className="om__delivery-note">{delivery.label} delivery · {dist} km from farmer</span>
                </div>
              </div>
            </div>
          )}

          {/* ╔════════════════════════════════════╗
             ║  STEP 2 — Review & Confirm         ║
             ╚════════════════════════════════════╝ */}
          {step === 2 && (
            <div className="om__step-content om__step-content--2">
              {/* Order summary card */}
              <div className="om__summary-card">
                <div className="om__summary-header">
                  <span className="om__summary-label">Order Summary</span>
                </div>

                <div className="om__summary-farmer">
                  <div className="om__summary-avatar" style={{ background: farmer.markerColor || '#43a047' }}>
                    {farmer.name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <strong>{farmer.name}</strong>
                    <span className="om__summary-crop">{farmer.crop} · {qty} kg</span>
                  </div>
                  <span className="om__summary-price">₹{grandTotal.toLocaleString()}</span>
                </div>

                <div className="om__summary-grid">
                  <div className="om__summary-cell">
                    <span className="om__summary-cell-label">Unit Price</span>
                    <span className="om__summary-cell-val">₹{unitPrice}/kg</span>
                  </div>
                  <div className="om__summary-cell">
                    <span className="om__summary-cell-label">Quantity</span>
                    <span className="om__summary-cell-val">{qty} kg</span>
                  </div>
                  <div className="om__summary-cell">
                    <span className="om__summary-cell-label">Delivery</span>
                    <span className="om__summary-cell-val">₹{delFee.toLocaleString()}</span>
                  </div>
                  <div className="om__summary-cell">
                    <span className="om__summary-cell-label">Platform Fee</span>
                    <span className="om__summary-cell-val">₹{platformFee.toLocaleString()}</span>
                  </div>
                </div>

                <div className="om__summary-total">
                  <span>Total Payable</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Delivery details */}
              <div className="om__review-row">
                <div className="om__review-icon">{I.truck}</div>
                <div className="om__review-detail">
                  <strong>Delivery</strong>
                  <span>{delivery.label} · Est. {delivery.days} days</span>
                </div>
              </div>

              <div className="om__review-row">
                <div className="om__review-icon">{I.mapPin}</div>
                <div className="om__review-detail">
                  <strong>Farmer Location</strong>
                  <span>{dist} km from your location</span>
                </div>
              </div>

              {/* Payment selection */}
              <div className="om__section">
                <h3 className="om__section-title">{I.wallet} Payment Method</h3>
                <div className="om__payment-list">
                  {PAYMENT_METHODS.map(m => (
                    <label
                      key={m.id}
                      className={`om__payment-option ${payment === m.id ? 'om__payment-option--active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={m.id}
                        checked={payment === m.id}
                        onChange={(e) => setPayment(e.target.value)}
                        className="om__payment-radio"
                      />
                      <span className="om__payment-icon">{m.icon}</span>
                      <div className="om__payment-info">
                        <strong>{m.label}</strong>
                        <span>{m.desc}</span>
                      </div>
                      <div className="om__payment-check">{I.check}</div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Trust badges */}
              <div className="om__trust">
                <div className="om__trust-item">
                  {I.shield}
                  <span>Secure Transaction</span>
                </div>
                <div className="om__trust-item">
                  {I.truck}
                  <span>Tracked Delivery</span>
                </div>
                <div className="om__trust-item">
                  {I.check}
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>
          )}

          {/* ╔════════════════════════════════════╗
             ║  STEP 3 — Order Confirmed          ║
             ╚════════════════════════════════════╝ */}
          {step === 3 && (
            <div className="om__step-content om__step-content--3">
              {/* Success animation */}
              <div className="om__success-art">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="46" fill="#e8f5e9" stroke="#43a047" strokeWidth="3" className="om__success-circle" />
                  <polyline points="30,52 44,66 70,36" fill="none" stroke="#2e7d32" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="om__success-check" />
                </svg>
              </div>

              <h3 className="om__success-title">Order Placed Successfully!</h3>
              <p className="om__success-desc">
                Your order for <strong>{qty} kg of {farmer.crop}</strong> from <strong>{farmer.name}</strong> has been confirmed.
              </p>

              {/* Order ID */}
              <div className="om__order-id-card">
                <span className="om__order-id-label">Order ID</span>
                <div className="om__order-id-row">
                  <span className="om__order-id-val">{orderId}</span>
                  <button className="om__order-id-copy" type="button" onClick={copyOrderId} title="Copy">
                    {copied ? I.check : I.copy}
                  </button>
                </div>
              </div>

              {/* Quick details */}
              <div className="om__success-details">
                <div className="om__success-detail">
                  <span className="om__success-detail-icon">{I.rupee}</span>
                  <div>
                    <strong>₹{grandTotal.toLocaleString()}</strong>
                    <span>{PAYMENT_METHODS.find(p => p.id === payment)?.label}</span>
                  </div>
                </div>
                <div className="om__success-detail">
                  <span className="om__success-detail-icon">{I.truck}</span>
                  <div>
                    <strong>Est. {delivery.days} days</strong>
                    <span>{delivery.label} delivery</span>
                  </div>
                </div>
                <div className="om__success-detail">
                  <span className="om__success-detail-icon">{I.box}</span>
                  <div>
                    <strong>{qty} kg</strong>
                    <span>{farmer.crop} from {farmer.name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="om__footer">
          {step === 1 && (
            <button className="om__btn om__btn--primary" type="button" onClick={() => setStep(2)}>
              Review Order {I.arrowR}
            </button>
          )}
          {step === 2 && (
            <button
              className="om__btn om__btn--confirm"
              type="button"
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? (
                <><span className="om__btn-spinner" /> Placing Order…</>
              ) : (
                <>{I.shield} Place Order · ₹{grandTotal.toLocaleString()}</>
              )}
            </button>
          )}
          {step === 3 && (
            <div className="om__footer-row">
              <button className="om__btn om__btn--ghost" type="button" onClick={onClose}>
                Continue Shopping
              </button>
              <button className="om__btn om__btn--primary" type="button" onClick={() => { onClose(); navigate('/merchant/orders'); }}>
                View My Orders {I.arrowR}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
