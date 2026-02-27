/**
 * Shared utility helpers for the AgriMatch platform (React version).
 */

/**
 * Validate email format.
 */
export function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Check if value is a positive number.
 */
export function isPositive(v) {
  return v !== '' && Number(v) > 0;
}

/**
 * Haversine distance in km between two { latitude, longitude } objects.
 */
export function haversine(a, b) {
  const R = 6371;
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

/* ═══════════════════════════════════════════════════════════════
   Persistent Storage — uses localStorage so data survives
   browser close / reopens.
   ═══════════════════════════════════════════════════════════════ */

const SESSION_KEY = 'agriSession';
const USERS_KEY = 'agriUsers';          // { [email]: { name, email, password, role, createdAt } }
const ACTIVITY_KEY = 'agriActivity';    // { [email]: { uploads: [], searches: [], contacts: [] } }
const ORDERS_KEY = 'agriOrders';        // { [email]: [ { orderId, farmer, quantity, … } ] }

/* ── Session (current logged-in user) ── */
export function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
}

export function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/* ── Multi-user account store ── */
function getAllUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * Look up a registered user by email. Returns user object or null.
 */
export function getStoredUser(email) {
  const users = getAllUsers();
  return users[email] || null;
}

/**
 * Register a new user (or overwrite if same email).
 */
export function setStoredUser(data) {
  const users = getAllUsers();
  users[data.email] = {
    ...data,
    createdAt: data.createdAt || new Date().toISOString(),
  };
  saveAllUsers(users);
}

/**
 * Update fields on an existing user record.
 */
export function updateStoredUser(email, patch) {
  const users = getAllUsers();
  if (users[email]) {
    users[email] = { ...users[email], ...patch };
    saveAllUsers(users);
  }
}

/* ── Activity history ── */
function getActivityStore() {
  return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}');
}

function saveActivityStore(store) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(store));
}

function getUserActivity(email) {
  const store = getActivityStore();
  if (!store[email]) {
    store[email] = { uploads: [], searches: [], contacts: [] };
    saveActivityStore(store);
  }
  return store[email];
}

/**
 * Record a crop upload by the farmer.
 */
export function recordUpload(email, entry) {
  const store = getActivityStore();
  if (!store[email]) store[email] = { uploads: [], searches: [], contacts: [] };
  store[email].uploads.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  saveActivityStore(store);
}

/**
 * Record a search performed by the merchant.
 */
export function recordSearch(email, entry) {
  const store = getActivityStore();
  if (!store[email]) store[email] = { uploads: [], searches: [], contacts: [] };
  store[email].searches.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  saveActivityStore(store);
}

/**
 * Record a contact request made by the merchant.
 */
export function recordContact(email, entry) {
  const store = getActivityStore();
  if (!store[email]) store[email] = { uploads: [], searches: [], contacts: [] };
  store[email].contacts.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  saveActivityStore(store);
}

/**
 * Get full activity history for a user.
 */
export function getActivity(email) {
  return getUserActivity(email);
}

/**
 * Format an ISO date string for display.
 */
export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ═══════════════════════════════════════════════════════════════
   Orders — Purchase order storage
   ═══════════════════════════════════════════════════════════════ */

function getOrderStore() {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}');
}

function saveOrderStore(store) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(store));
}

/**
 * Save a new order for a user.
 */
export function saveOrder(email, order) {
  const store = getOrderStore();
  if (!store[email]) store[email] = [];
  store[email].unshift(order);
  saveOrderStore(store);
}

/**
 * Get all orders for a user (newest first).
 */
export function getOrders(email) {
  const store = getOrderStore();
  return store[email] || [];
}

/**
 * Get count of orders for a user.
 */
export function getOrderCount(email) {
  return getOrders(email).length;
}

/**
 * Get total amount spent by a user.
 */
export function getTotalSpent(email) {
  return getOrders(email).reduce((sum, o) => sum + (o.grandTotal || 0), 0);
}
