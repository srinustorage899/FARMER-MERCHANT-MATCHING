import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

/* ── Crop category data ─────────────────────────────────────────────── */
const CROP_CATEGORIES = [
  { icon: '🥬', nameKey: 'vegetables', samples: 'Tomato, Onion, Potato…' },
  { icon: '🌾', nameKey: 'grains',     samples: 'Rice, Wheat, Maize…' },
  { icon: '🍎', nameKey: 'fruits',     samples: 'Mango, Apple, Banana…' },
  { icon: '🫘', nameKey: 'pulses',     samples: 'Soybean, Groundnut, Dal…' },
  { icon: '🏭', nameKey: 'cashCrops',  samples: 'Cotton, Jute, Sugarcane…' },
  { icon: '🌶️', nameKey: 'spices',     samples: 'Turmeric, Cardamom…' },
];

/* ── MSP price cards ────────────────────────────────────────────────── */
const MSP_SAMPLES = [
  { crop: 'Wheat',  price: '₹2,425', subKey: 'perQuintal' },
  { crop: 'Rice',   price: '₹2,320', subKey: 'perQuintal' },
  { crop: 'Cotton', price: '₹7,121', subKey: 'perQuintal' },
];

/* ── Full MSP table (₹ per kg, 2025-26 rates) ──────────────────────── */
const MSP_FULL = [
  { category: '🥬 Vegetables', crops: [
    { name: 'Tomato', price: 5.00 }, { name: 'Onion', price: 8.00 },
    { name: 'Potato', price: 6.00 }, { name: 'Brinjal', price: 5.00 },
    { name: 'Cabbage', price: 4.00 }, { name: 'Carrot', price: 6.00 },
    { name: 'Cauliflower', price: 5.00 }, { name: 'Green Chilli', price: 8.00 },
    { name: 'Spinach', price: 4.00 }, { name: 'Peas', price: 10.00 },
    { name: 'Cucumber', price: 4.00 }, { name: 'Bitter Gourd', price: 6.00 },
    { name: 'Okra', price: 5.00 }, { name: 'Garlic', price: 15.00 },
    { name: 'Ginger', price: 20.00 },
  ]},
  { category: '🌾 Grains & Cereals', crops: [
    { name: 'Rice', price: 22.03 }, { name: 'Wheat', price: 23.50 },
    { name: 'Maize', price: 20.90 }, { name: 'Bajra', price: 25.50 },
    { name: 'Jowar', price: 31.50 }, { name: 'Ragi', price: 38.46 },
    { name: 'Barley', price: 18.50 },
  ]},
  { category: '🍎 Fruits', crops: [
    { name: 'Mango', price: 15.00 }, { name: 'Banana', price: 5.00 },
    { name: 'Apple', price: 30.00 }, { name: 'Grapes', price: 20.00 },
    { name: 'Orange', price: 10.00 }, { name: 'Papaya', price: 5.00 },
    { name: 'Pomegranate', price: 25.00 }, { name: 'Watermelon', price: 3.00 },
    { name: 'Guava', price: 8.00 }, { name: 'Lemon', price: 10.00 },
  ]},
  { category: '🫘 Pulses & Oilseeds', crops: [
    { name: 'Soybean', price: 44.25 }, { name: 'Groundnut', price: 60.15 },
    { name: 'Mustard', price: 55.50 }, { name: 'Chana', price: 53.35 },
    { name: 'Moong', price: 82.75 }, { name: 'Urad', price: 69.50 },
    { name: 'Tur', price: 71.00 }, { name: 'Sunflower', price: 63.38 },
  ]},
  { category: '🏭 Cash Crops', crops: [
    { name: 'Sugarcane', price: 3.15 }, { name: 'Cotton', price: 67.00 },
    { name: 'Jute', price: 50.50 }, { name: 'Tea', price: 50.00 },
    { name: 'Coffee', price: 80.00 },
  ]},
  { category: '🌶️ Spices', crops: [
    { name: 'Turmeric', price: 30.00 }, { name: 'Cumin', price: 80.00 },
    { name: 'Coriander', price: 30.00 }, { name: 'Black Pepper', price: 200.00 },
    { name: 'Cardamom', price: 500.00 },
  ]},
];

/* ── Stats ──────────────────────────────────────────────────────────── */
const STATS = [
  { value: '50+',   labelKey: 'supportedCrops' },
  { value: '500km', labelKey: 'searchRadius' },
  { value: 'Live',  labelKey: 'gpsMatching' },
  { value: '₹0',    labelKey: 'commissionFees' },
];

/* ── Farmer result sample cards (for the map preview section) ──────── */
const SAMPLE_FARMERS = [
  {
    letter: 'A', color: '#43a047', name: 'Rajesh',
    badge: 'Best Match', crop: 'Tomato', qty: '500kg',
    price: '₹1,800/q', dist: '14km away',
  },
  {
    letter: 'B', color: '#1e88e5', name: 'Suresh',
    crop: 'Potato', qty: '1,200kg',
    price: '₹1,600/q', dist: '120km away',
  },
  {
    letter: 'C', color: '#f57c00', name: 'Ankit',
    crop: 'Onion', qty: '300kg',
    price: '₹1,900/q', dist: '175km away',
  },
];

export default function HomePage() {
  const { session } = useAuth();
  const { t } = useLanguage();
  const [showMsp, setShowMsp] = useState(false);
  const hpRef = useRef(null);

  /* Scroll-reveal: add .hp-visible to sections when they enter viewport */
  useEffect(() => {
    const el = hpRef.current;
    if (!el) return;
    const targets = el.querySelectorAll('.hp-reveal');
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('hp-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <div className="hp" ref={hpRef}>
      {/* ────────── NAVBAR ────────── */}
      <nav className="hp-nav">
        <Link className="hp-nav__brand" to="/">
          <span className="hp-nav__logo">🌾</span> AgriMatch
        </Link>
        <div className="hp-nav__links">
          <a className="hp-nav__link" href="#how-it-works">{t('howItWorks')}</a>
          <a className="hp-nav__link" href="#for-farmers">{t('forFarmers')}</a>
          <a className="hp-nav__link" href="#for-merchants">{t('forMerchants')}</a>
          <a className="hp-nav__link" href="#msp">{t('mspRates')}</a>
        </div>
        <div className="hp-nav__actions">
          {session ? (
            <Link
              className="btn btn--green btn--sm"
              to={session.role === 'farmer' ? '/farmer' : '/merchant'}
            >
              {t('dashboard')}
            </Link>
          ) : (
            <>
              <Link className="hp-nav__login" to="/login">{t('logIn')}</Link>
              <Link className="btn btn--green btn--sm" to="/login">{t('signIn')}</Link>
            </>
          )}
        </div>
        {/* Mobile hamburger */}
        <button className="hp-nav__hamburger" aria-label="Menu" onClick={e => {
          e.currentTarget.closest('.hp-nav').classList.toggle('hp-nav--open');
        }}>
          <span /><span /><span />
        </button>
      </nav>

      {/* ────────── HERO ────────── */}
      <section className="hero">
        <div className="hero__inner">
          <div className="hero__text">
            <span className="hero__badge"><span className="hero__badge-dot"></span> {t('mspRatesLiveNow')}</span>
            <h1 className="hero__title">
              <span className="hero__title-line hero__title-line--1">{t('sellYourHarvest')}</span><br />
              <span className="hero__title-line hero__title-line--2 hero__title--green">{t('findFreshProduce')}</span><br />
              <span className="hero__title-line hero__title-line--3 hero__title--underline">{t('noMiddlemen')}</span>
            </h1>
            <p className="hero__sub">
              {t('heroDesc')}
            </p>
            <div className="hero__ctas">
              <Link className="btn btn--green hero__cta-btn" to="/login">{t('imFarmer')}</Link>
              <Link className="btn btn--orange hero__cta-btn" to="/login">{t('imMerchant')}</Link>
            </div>
            <div className="hero__trust">
              <span className="hero__trust-item" style={{ animationDelay: '1s' }}><span className="hero__trust-check">✓</span> {t('govtApproved')}</span>
              <span className="hero__trust-item" style={{ animationDelay: '1.15s' }}><span className="hero__trust-check">✓</span> {t('zeroCommission')}</span>
              <span className="hero__trust-item" style={{ animationDelay: '1.3s' }}><span className="hero__trust-check">✓</span> {t('instantPayment')}</span>
            </div>
          </div>

          <div className="hero__visual">
            {/* Illustration: farmer field background with floating cards */}
            <div className="hero__illustration">
              <div className="hero__illus-bg">
                <svg viewBox="0 0 440 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero__illus-svg">
                  {/* Sky gradient */}
                  <defs>
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e8f5e9" />
                      <stop offset="60%" stopColor="#f1f8e9" />
                      <stop offset="100%" stopColor="#c8e6c9" />
                    </linearGradient>
                    <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#43a047" />
                      <stop offset="100%" stopColor="#2e7d32" />
                    </linearGradient>
                    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fff9c4" />
                      <stop offset="60%" stopColor="#ffee58" />
                      <stop offset="100%" stopColor="#fdd835" />
                    </radialGradient>
                    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity=".08" />
                    </filter>
                  </defs>
                  <rect width="440" height="340" rx="18" fill="url(#skyGrad)"/>

                  {/* Clouds */}
                  <g className="hero__clouds" opacity=".5">
                    <ellipse cx="70" cy="50" rx="40" ry="14" fill="#fff"/>
                    <ellipse cx="55" cy="45" rx="25" ry="12" fill="#fff"/>
                    <ellipse cx="90" cy="46" rx="22" ry="10" fill="#fff"/>
                    <ellipse cx="280" cy="35" rx="35" ry="12" fill="#fff"/>
                    <ellipse cx="265" cy="30" rx="22" ry="10" fill="#fff"/>
                    <ellipse cx="300" cy="32" rx="20" ry="9" fill="#fff"/>
                    <ellipse cx="180" cy="65" rx="28" ry="10" fill="#fff" opacity=".4"/>
                  </g>

                  {/* Birds */}
                  <g stroke="#78909c" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity=".35">
                    <path d="M140 75 Q145 70 150 75 Q155 70 160 75"/>
                    <path d="M220 50 Q224 46 228 50 Q232 46 236 50"/>
                  </g>

                  {/* AI MATCHING label */}
                  <text x="215" y="28" textAnchor="middle" fontSize="11" fill="#388e3c" fontWeight="700" fontFamily="system-ui" letterSpacing="1.5">AI MATCHING</text>

                  {/* Sun with glow ring */}
                  <circle cx="370" cy="65" r="42" fill="#fff9c4" opacity=".35"/>
                  <circle cx="370" cy="65" r="32" fill="#fff9c4" opacity=".6"/>
                  <circle cx="370" cy="65" r="22" fill="url(#sunGlow)"/>

                  {/* Back hills */}
                  <ellipse cx="110" cy="260" rx="180" ry="70" fill="#a5d6a7"/>
                  <ellipse cx="340" cy="270" rx="160" ry="60" fill="#81c784"/>

                  {/* Trees on back hills */}
                  {[60, 150, 240, 330, 390].map((x, i) => (
                    <g key={`tree-${i}`}>
                      <rect x={x-2} y={215 + (i%2)*8} width="4" height="18" rx="2" fill="#5d4037" opacity=".6"/>
                      <circle cx={x} cy={210 + (i%2)*8} r={9 + (i%3)*2} fill={i%2===0 ? '#66bb6a' : '#81c784'}/>
                    </g>
                  ))}

                  {/* Front field */}
                  <path d="M0 255 Q110 230 220 250 Q330 270 440 245 L440 340 L0 340 Z" fill="#66bb6a"/>
                  <path d="M0 280 Q110 265 220 275 Q330 285 440 272 L440 340 L0 340 Z" fill="url(#hillFront)"/>

                  {/* Crop rows on front field */}
                  {[35,80,125,170,215,260,305,355,400].map((x, i) => (
                    <g key={`crop-${i}`}>
                      <line x1={x} y1="260" x2={x} y2={245 - (i%2)*4} stroke="#2e7d32" strokeWidth="2.2"/>
                      <circle cx={x} cy={241 - (i%2)*4} r="5.5" fill={['#ef5350','#ffb74d','#66bb6a','#ff7043','#fdd835'][i%5]}/>
                    </g>
                  ))}

                  {/* Farmer with hat */}
                  <g filter="url(#softShadow)">
                    {/* Hat */}
                    <ellipse cx="110" cy="202" rx="16" ry="5" fill="#5d4037"/>
                    <rect x="103" y="193" width="14" height="10" rx="3" fill="#5d4037"/>
                    {/* Head */}
                    <circle cx="110" cy="208" r="10" fill="#8d6e63"/>
                    {/* Body */}
                    <rect x="103" y="218" width="14" height="22" rx="5" fill="#5d4037"/>
                    {/* Arms */}
                    <line x1="103" y1="224" x2="88" y2="212" stroke="#5d4037" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="117" y1="224" x2="130" y2="232" stroke="#5d4037" strokeWidth="3" strokeLinecap="round"/>
                    {/* Legs */}
                    <line x1="107" y1="240" x2="104" y2="255" stroke="#5d4037" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="113" y1="240" x2="116" y2="255" stroke="#5d4037" strokeWidth="3" strokeLinecap="round"/>
                    {/* Tool/stick */}
                    <line x1="88" y1="212" x2="82" y2="195" stroke="#795548" strokeWidth="2" strokeLinecap="round"/>
                  </g>

                  {/* Connection arc with dots */}
                  <path className="hero__arc" d="M140 220 Q220 130 360 195" stroke="#ff9800" strokeWidth="2.5" strokeDasharray="6 4" fill="none" opacity=".7"/>
                  <circle className="hero__arc-dot" cx="180" cy="180" r="5" fill="#ff9800" opacity=".85"/>
                  <circle className="hero__arc-dot" cx="240" cy="155" r="5" fill="#ff9800" opacity=".85" style={{ animationDelay: '.15s' }}/>
                  <circle className="hero__arc-dot" cx="310" cy="165" r="5" fill="#ff9800" opacity=".85" style={{ animationDelay: '.3s' }}/>

                  {/* Merchant building */}
                  <g filter="url(#softShadow)">
                    <rect x="345" y="195" width="28" height="32" rx="4" fill="#37474f"/>
                    <rect x="350" y="200" width="8" height="8" rx="1" fill="#80cbc4" opacity=".6"/>
                    <rect x="360" y="200" width="8" height="8" rx="1" fill="#80cbc4" opacity=".6"/>
                    <rect x="354" y="213" width="10" height="14" rx="2" fill="#4db6ac" opacity=".5"/>
                    <rect x="345" y="191" width="28" height="5" rx="2" fill="#455a64"/>
                  </g>

                  {/* Flowers on hills */}
                  {[50,130,200,280,370].map((x, i) => (
                    <circle key={`flower-${i}`} cx={x} cy={268 + (i%3)*5} r="3" fill={['#f48fb1','#ce93d8','#fff176','#ef9a9a','#80cbc4'][i]} opacity=".7"/>
                  ))}
                </svg>
              </div>

              {/* Floating farmer card */}
              <div className="hero__float-card hero__float-card--farmer">
                <div className="hero__float-card-avatar-ring hero__float-card-avatar-ring--green">
                  <span className="hero__float-card-avatar">🧑‍🌾</span>
                </div>
                <div>
                  <div className="hero__float-card-name">Ramesh K.</div>
                  <div className="hero__float-card-detail">Tomato · 42 Quintals</div>
                  <div className="hero__float-card-price">₹1,450/q</div>
                </div>
              </div>

              {/* Floating merchant card */}
              <div className="hero__float-card hero__float-card--merchant">
                <div className="hero__float-card-avatar-ring hero__float-card-avatar-ring--blue">
                  <span className="hero__float-card-avatar">🏪</span>
                </div>
                <div>
                  <div className="hero__float-card-name">Fresh Mart</div>
                  <div className="hero__float-card-detail">Top Buyer · Verified</div>
                  <div className="hero__float-card-tag">Looking for Wheat</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Hero wave separator */}
        <div className="hero__wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 40 Q360 80 720 40 Q1080 0 1440 40 L1440 80 L0 80 Z" fill="#fff"/>
          </svg>
        </div>
      </section>

      {/* ────────── HOW IT WORKS ─────── */}
      <section className="hp-section hp-reveal" id="how-it-works">
        <span className="hp-section__eyebrow">{t('simpleProcess')}</span>
        <h2 className="hp-section__title">{t('howAgriMatchWorks')}</h2>
        <div className="steps">
          {[
            {
              num: '1', color: 'green',
              title: t('farmerListsCrop'),
              desc: t('step1Desc'),
            },
            {
              num: '2', color: 'green',
              title: t('smartAIMatching'),
              desc: t('step2Desc'),
            },
            {
              num: '3', color: 'green',
              title: t('directConnection'),
              desc: t('step3Desc'),
            },
          ].map((s) => (
            <div className="step" key={s.num}>
              <div className={`step__circle step__circle--${s.color}`}>{s.num}</div>
              <div className="step__icon">
                {s.num === '1' ? '📤' : s.num === '2' ? '🔍' : '🤝'}
              </div>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── DUAL VALUE PROP ───── */}
      <section className="hp-section hp-reveal" id="for-farmers">
        <div className="dual">
          {/* Farmers card */}
          <div className="dual__card dual__card--green">
            <div className="dual__header">
              <span className="dual__icon">🧑‍🌾</span>
              <h3 className="dual__title">{t('forFarmers')}</h3>
            </div>
            <ul className="dual__list">
              <li>{t('farmerBenefit1')}</li>
              <li>{t('farmerBenefit2')}</li>
              <li>{t('farmerBenefit3')}</li>
              <li>{t('farmerBenefit4')}</li>
            </ul>
            {/* Mini preview */}
            <div className="dual__preview">
              <div className="dual__preview-header">
                <div className="dual__preview-dot dual__preview-dot--green"></div>
                <div className="dual__preview-dot dual__preview-dot--gray"></div>
                <div className="dual__preview-dot dual__preview-dot--gray"></div>
              </div>
              <div className="dual__preview-body">
                <div className="dual__preview-row"><span className="dual__preview-label">{t('crop')}</span><span className="dual__preview-val">Tomato</span></div>
                <div className="dual__preview-row"><span className="dual__preview-label">{t('quantity')}</span><span className="dual__preview-val">500 kg</span></div>
                <div className="dual__preview-row"><span className="dual__preview-label">{t('price')}</span><span className="dual__preview-val">₹25/kg</span></div>
              </div>
              <div className="dual__preview-bar">
                <span>{t('newListings')}</span>
                <span className="dual__preview-badge">This: 1 of 3</span>
              </div>
            </div>
          </div>

          {/* Merchants card */}
          <div className="dual__card dual__card--orange" id="for-merchants">
            <div className="dual__header">
              <span className="dual__icon">🏪</span>
              <h3 className="dual__title">{t('forMerchants')}</h3>
            </div>
            <ul className="dual__list">
              <li>{t('merchantBenefit1')}</li>
              <li>{t('merchantBenefit2')}</li>
              <li>{t('merchantBenefit3')}</li>
              <li>{t('merchantBenefit4')}</li>
            </ul>
            {/* Mini map preview */}
            <div className="dual__preview dual__preview--blue">
              <div className="dual__preview-header">
                <div className="dual__preview-dot dual__preview-dot--blue"></div>
                <div className="dual__preview-dot dual__preview-dot--gray"></div>
                <div className="dual__preview-dot dual__preview-dot--gray"></div>
              </div>
              <div className="dual__preview-map">
                <div className="dual__preview-map-pin" style={{ top: '30%', left: '45%' }}>📍</div>
                <div className="dual__preview-map-pin" style={{ top: '55%', left: '65%' }}>📍</div>
                <div className="dual__preview-map-pin" style={{ top: '40%', left: '25%' }}>📍</div>
                <div className="dual__preview-map-circle"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── 50+ CROPS ──────── */}
      <section className="hp-section hp-reveal" id="crops">
        <div className="crops-header">
          <div>
            <h2 className="hp-section__title hp-section__title--left">{t('cropsSupported')}</h2>
            <p className="hp-section__sub">{t('browseCropsDesc')}</p>
          </div>
          <Link className="crops-header__link" to="/login">{t('viewAllCrops')}</Link>
        </div>
        <div className="crops-grid">
          {CROP_CATEGORIES.map((c) => (
            <div className="crop-card" key={c.nameKey}>
              <span className="crop-card__icon">{c.icon}</span>
              <h4 className="crop-card__name">{t(c.nameKey)}</h4>
              <p className="crop-card__samples">{c.samples}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── MSP / FAIR PRICES ── */}
      <section className="msp-banner hp-reveal" id="msp">
        <div className="msp-banner__inner">
          <div className="msp-banner__text">
            <span className="msp-banner__badge">{t('govtProtected')}</span>
            <h2 className="msp-banner__title">{t('fairPricesGuaranteed')}</h2>
            <p className="msp-banner__desc">
              {t('mspDesc')}
            </p>
            <button className="msp-banner__link" type="button" onClick={() => setShowMsp(true)}>{t('checkMspRates')}</button>
          </div>
          <div className="msp-cards">
            {MSP_SAMPLES.map((m) => (
              <div className="msp-card" key={m.crop}>
                <span className="msp-card__crop">{m.crop}</span>
                <span className="msp-card__price">{m.price}</span>
                <span className="msp-card__sub">{t(m.subKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── MSP MODAL ──────── */}
      {showMsp && (
        <div className="msp-modal-overlay" onClick={() => setShowMsp(false)}>
          <div className="msp-modal" onClick={e => e.stopPropagation()}>
            <div className="msp-modal__header">
              <div>
                <h2 className="msp-modal__title">{t('mspRatesTitle')}</h2>
                <p className="msp-modal__subtitle">{t('mspModalSubtitle')}</p>
              </div>
              <button className="msp-modal__close" onClick={() => setShowMsp(false)} aria-label="Close">✕</button>
            </div>
            <div className="msp-modal__body">
              {MSP_FULL.map((cat) => (
                <div className="msp-modal__category" key={cat.category}>
                  <h3 className="msp-modal__cat-title">{cat.category}</h3>
                  <div className="msp-modal__grid">
                    {cat.crops.map((c) => (
                      <div className="msp-modal__item" key={c.name}>
                        <span className="msp-modal__crop-name">{c.name}</span>
                        <span className="msp-modal__crop-price">₹{c.price.toFixed(2)}/kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="msp-modal__footer">
              <p>{t('mspSource')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ────────── MAP PREVIEW ──────── */}
      <section className="hp-section hp-reveal">
        <h2 className="hp-section__title">{t('findNearbyInstantly')}</h2>
        <p className="hp-section__sub" style={{ marginBottom: '2rem' }}>
          {t('mapPreviewDesc')}
        </p>
        <div className="map-preview">
          {/* Search panel */}
          <div className="map-preview__panel">
            <div className="map-preview__search-bar">
              <span>🔍</span>
              <span>{t('searchCropEg')}</span>
            </div>
            <div className="map-preview__filters">
              <span className="map-preview__chip map-preview__chip--active">{t('within50km')}</span>
              <span className="map-preview__chip">{t('priceLowHigh')}</span>
            </div>
            {/* Sample farmer cards */}
            {SAMPLE_FARMERS.map((f) => (
              <div className="map-preview__farmer" key={f.letter}>
                <div className="map-preview__farmer-marker" style={{ background: f.color }}>{f.letter}</div>
                <div className="map-preview__farmer-info">
                  <div className="map-preview__farmer-row">
                    <span className="map-preview__farmer-name">{f.name}</span>
                    {f.badge && <span className="map-preview__farmer-badge">{f.badge}</span>}
                  </div>
                  <div className="map-preview__farmer-crop">
                    <span>{f.crop}</span> · <span>{f.qty}</span>
                    <span className="map-preview__farmer-dist">{f.dist}</span>
                  </div>
                  <div className="map-preview__farmer-price">{f.price}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Map area */}
          <div className="map-preview__map">
            <svg viewBox="0 0 500 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="map-preview__map-svg">
              {/* Map tiles simulation */}
              <rect width="500" height="360" fill="#e8eee8"/>
              {/* Roads */}
              <line x1="0" y1="120" x2="500" y2="100" stroke="#d4d4d4" strokeWidth="3"/>
              <line x1="0" y1="240" x2="500" y2="250" stroke="#d4d4d4" strokeWidth="2"/>
              <line x1="180" y1="0" x2="200" y2="360" stroke="#d4d4d4" strokeWidth="2"/>
              <line x1="350" y1="0" x2="330" y2="360" stroke="#d4d4d4" strokeWidth="2"/>
              {/* Radius circle */}
              <circle cx="280" cy="190" r="100" fill="#43a047" fillOpacity=".12" stroke="#43a047" strokeWidth="2" strokeDasharray="6 4"/>
              {/* Center marker (merchant) */}
              <circle cx="280" cy="190" r="8" fill="#1e88e5" stroke="#fff" strokeWidth="3"/>
              {/* Farmer pins */}
              <g>
                <circle cx="230" cy="150" r="10" fill="#43a047"/>
                <text x="230" y="154" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">A</text>
              </g>
              <g>
                <circle cx="330" cy="170" r="10" fill="#1e88e5"/>
                <text x="330" y="174" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">B</text>
              </g>
              <g>
                <circle cx="260" cy="240" r="10" fill="#f57c00"/>
                <text x="260" y="244" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">C</text>
              </g>
            </svg>
            {/* Zoom controls */}
            <div className="map-preview__zoom">
              <div>+</div>
              <div>−</div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── STATS ──────────── */}
      <section className="hp-stats hp-reveal">
        {STATS.map((s) => (
          <div className="hp-stat" key={s.labelKey}>
            <span className="hp-stat__value">{s.value}</span>
            <span className="hp-stat__label">{t(s.labelKey)}</span>
          </div>
        ))}
      </section>

      {/* ────────── FINAL CTA ──────── */}
      <section className="hp-cta hp-reveal">
        <h2 className="hp-cta__title">
          {t('readyToTransform')}
        </h2>
        <p className="hp-cta__sub">
          {t('ctaDesc')}
        </p>
        <div className="hp-cta__btns">
          <Link className="btn hp-cta__btn hp-cta__btn--white" to="/login">{t('getStartedFarmer')}</Link>
          <Link className="btn hp-cta__btn hp-cta__btn--outline" to="/login">{t('getStartedMerchant')}</Link>
        </div>
      </section>

      {/* ────────── FOOTER ──────────── */}
      <footer className="hp-footer">
        <div className="hp-footer__inner">
          <div className="hp-footer__brand">🌾 AgriMatch</div>
          <div className="hp-footer__links">
            <a href="#!">{t('aboutUs')}</a>
            <a href="#!">{t('contact')}</a>
            <a href="#!">{t('privacyPolicy')}</a>
            <a href="#!">{t('terms')}</a>
          </div>
          <div className="hp-footer__india">{t('madeInIndia')}</div>
        </div>
        <div className="hp-footer__copy">
          © 2026 AgriMatch Technologies Pvt. Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
