import { useState } from 'react';
import Sidebar from './Sidebar';

/**
 * DashboardLayout — wraps every authenticated page.
 *
 *   ┌──────────┬──────────────────────────────┐
 *   │ Sidebar  │  Main content (children)     │
 *   │  260px   │  flex: 1                     │
 *   │  fixed   │  scrollable                  │
 *   └──────────┴──────────────────────────────┘
 */
export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="layout__overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`layout__sidebar ${mobileOpen ? 'layout__sidebar--open' : ''}`}>
        <Sidebar onMobileClose={() => setMobileOpen(false)} />
      </div>

      {/* Main area */}
      <div className="layout__main">
        {/* Mobile top bar */}
        <header className="layout__topbar">
          <button
            className="layout__hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="layout__topbar-brand">🌾 AgriMatch</span>
        </header>

        <div className="layout__content">
          {children}
        </div>
      </div>
    </div>
  );
}
