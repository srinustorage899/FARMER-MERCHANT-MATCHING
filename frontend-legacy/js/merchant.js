/**
 * merchant.js — Merchant dashboard page logic.
 *
 * Depends on: utils.js
 *
 * Minimal — just wires up the dashboard cards and auth guard.
 */
const Merchant = (() => {
  'use strict';

  const { $, requireAuth, logout } = Utils;

  function init() {
    if (!$('#merchant-dash')) return;

    const session = requireAuth();
    if (!session) return;

    // Personalise greeting
    const greeting = $('#greeting');
    if (greeting) greeting.textContent = `Welcome, ${session.name}!`;

    // Logout
    const btnLogout = $('#btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', logout);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Merchant.init);
