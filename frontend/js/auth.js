/**
 * auth.js — Login & Signup logic for the AgriMatch platform.
 *
 * Depends on: utils.js (must be loaded first)
 *
 * Responsibilities:
 *  - Toggle between Login / Signup tabs
 *  - Validate inputs (email, password length, role)
 *  - Simulate credential storage via sessionStorage
 *  - Role-based redirect: Farmer → farmer-dashboard, Merchant → merchant-dashboard
 */
const Auth = (() => {
  'use strict';

  const { $, showMsg, hideMsg, isEmail, setSession } = Utils;

  let els = {};

  /* ── Tab switching ── */
  function switchTab(active) {
    const isLogin = active === 'login';
    els.tabLogin.classList.toggle('tabs__btn--active', isLogin);
    els.tabSignup.classList.toggle('tabs__btn--active', !isLogin);
    els.formLogin.classList.toggle('form--hidden', !isLogin);
    els.formSignup.classList.toggle('form--hidden', isLogin);
    hideMsg(els.msgLogin);
    hideMsg(els.msgSignup);
  }

  /* ── Login ── */
  function handleLogin(e) {
    e.preventDefault();
    hideMsg(els.msgLogin);

    const email = els.loginEmail.value.trim();
    const password = els.loginPassword.value;

    if (!email || !password) {
      showMsg(els.msgLogin, 'Please fill in all fields.', 'error');
      return;
    }
    if (!isEmail(email)) {
      showMsg(els.msgLogin, 'Enter a valid email address.', 'error');
      return;
    }
    if (password.length < 6) {
      showMsg(els.msgLogin, 'Password must be at least 6 characters.', 'error');
      return;
    }

    // Simulated credential check
    const stored = JSON.parse(sessionStorage.getItem('agriUser') || 'null');

    if (!stored || stored.email !== email) {
      showMsg(els.msgLogin, 'No account found. Please sign up first.', 'error');
      return;
    }
    if (stored.password !== password) {
      showMsg(els.msgLogin, 'Incorrect password.', 'error');
      return;
    }

    setSession({ email: stored.email, name: stored.name, role: stored.role });
    redirect(stored.role);
  }

  /* ── Signup ── */
  function handleSignup(e) {
    e.preventDefault();
    hideMsg(els.msgSignup);

    const name     = els.signupName.value.trim();
    const email    = els.signupEmail.value.trim();
    const password = els.signupPassword.value;
    const roleEl   = $('input[name="role"]:checked');

    if (!name || !email || !password) {
      showMsg(els.msgSignup, 'Please fill in all fields.', 'error');
      return;
    }
    if (name.length < 2) {
      showMsg(els.msgSignup, 'Name must be at least 2 characters.', 'error');
      return;
    }
    if (!isEmail(email)) {
      showMsg(els.msgSignup, 'Enter a valid email address.', 'error');
      return;
    }
    if (password.length < 6) {
      showMsg(els.msgSignup, 'Password must be at least 6 characters.', 'error');
      return;
    }
    if (!roleEl) {
      showMsg(els.msgSignup, 'Please select a role.', 'error');
      return;
    }

    const role = roleEl.value;

    // Persist (simulated backend)
    sessionStorage.setItem('agriUser', JSON.stringify({ name, email, password, role }));
    setSession({ email, name, role });

    showMsg(els.msgSignup, 'Account created! Redirecting…', 'success');
    setTimeout(() => redirect(role), 700);
  }

  /* ── Redirect by role ── */
  function redirect(role) {
    window.location.href = role === 'farmer'
      ? 'farmer-dashboard.html'
      : 'merchant-dashboard.html';
  }

  /* ── Init ── */
  function init() {
    if (!$('#form-login')) return; // only run on auth page

    els = {
      tabLogin:       $('#tab-login'),
      tabSignup:      $('#tab-signup'),
      formLogin:      $('#form-login'),
      formSignup:     $('#form-signup'),
      loginEmail:     $('#login-email'),
      loginPassword:  $('#login-password'),
      signupName:     $('#signup-name'),
      signupEmail:    $('#signup-email'),
      signupPassword: $('#signup-password'),
      msgLogin:       $('#msg-login'),
      msgSignup:      $('#msg-signup'),
    };

    els.tabLogin.addEventListener('click', () => switchTab('login'));
    els.tabSignup.addEventListener('click', () => switchTab('signup'));
    els.formLogin.addEventListener('submit', handleLogin);
    els.formSignup.addEventListener('submit', handleSignup);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Auth.init);
