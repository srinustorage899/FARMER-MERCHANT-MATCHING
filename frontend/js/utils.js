/**
 * utils.js — Shared utility helpers for the AgriMatch platform.
 *
 * Exports a single `Utils` namespace containing:
 *  - DOM shortcuts
 *  - Status-message helpers
 *  - Input validation helpers
 *  - Haversine distance calculation
 *  - Session helpers
 */
const Utils = (() => {
  'use strict';

  /* ── DOM shortcuts ── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ── Status messages ── */
  /**
   * Show a feedback message inside a container element.
   * @param {HTMLElement} el  – the .msg element
   * @param {string} text
   * @param {'info'|'success'|'error'} type
   */
  function showMsg(el, text, type) {
    el.textContent = text;
    el.className = `msg msg--show msg--${type}`;
  }

  function hideMsg(el) {
    el.className = 'msg';
  }

  /* ── Validation ── */
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function isPositive(v) {
    return v !== '' && Number(v) > 0;
  }

  /* ── Haversine ── */
  /**
   * Calculate the distance in km between two { latitude, longitude } objects.
   * Uses the Haversine formula for great-circle distance.
   */
  function haversine(a, b) {
    const R = 6371; // Earth radius in km
    const toRad = (d) => (d * Math.PI) / 180;

    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);

    const sinLat = Math.sin(dLat / 2);
    const sinLon = Math.sin(dLon / 2);

    const h =
      sinLat * sinLat +
      Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;

    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  /* ── Session ── */
  function getSession() {
    return JSON.parse(sessionStorage.getItem('agriSession') || 'null');
  }

  function setSession(data) {
    sessionStorage.setItem('agriSession', JSON.stringify(data));
  }

  function clearSession() {
    sessionStorage.removeItem('agriSession');
    sessionStorage.removeItem('agriUser');
  }

  /**
   * Guard for protected pages — redirects to index.html if no session exists.
   * @returns {Object|null} session data
   */
  function requireAuth() {
    const s = getSession();
    if (!s) {
      window.location.href = 'index.html';
      return null;
    }
    return s;
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  /* ── Public API ── */
  return {
    $, $$,
    showMsg, hideMsg,
    isEmail, isPositive,
    haversine,
    getSession, setSession, clearSession,
    requireAuth, logout,
  };
})();
