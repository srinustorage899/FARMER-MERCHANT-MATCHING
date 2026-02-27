/**
 * farmer.js — Upload-crop page logic.
 *
 * Depends on: utils.js, location.js
 *
 * Responsibilities:
 *  - Trigger GPS fetch on load via shared Location module.
 *  - Show manual-address fallback if geolocation fails.
 *  - Keep submit button disabled until location is resolved.
 *  - Validate inputs, build JSON payload, console.log it.
 *  - Show success confirmation and reset the form.
 */
const Farmer = (() => {
  'use strict';

  const { $, showMsg, hideMsg, isPositive } = Utils;

  let coords = null;   // { latitude, longitude, city }
  let els = {};

  /* ── Location bootstrap ── */
  async function initLocation() {
    try {
      coords = await Location.fetch(els.locStatus);
      els.btnSubmit.disabled = false;

      // Offer a "Change" option after success
      Location.showChangeOption(els.locStatus, retryLocation);
    } catch {
      // Show manual address fallback
      showManualFallback();
    }
  }

  function retryLocation() {
    coords = null;
    els.btnSubmit.disabled = true;
    hideManualFallback();
    initLocation();
  }

  function showManualFallback() {
    els.manualAddr.classList.add('manual-addr--show');
    // Enable submit once user enters something
    els.manualInput.addEventListener('input', onManualInput);
  }

  function hideManualFallback() {
    els.manualAddr.classList.remove('manual-addr--show');
    els.manualInput.removeEventListener('input', onManualInput);
    els.manualInput.value = '';
  }

  function onManualInput() {
    // If manual address is provided, enable submit with fallback coords (0,0)
    if (els.manualInput.value.trim().length > 2) {
      coords = { latitude: 0, longitude: 0, city: els.manualInput.value.trim() };
      els.btnSubmit.disabled = false;
    } else {
      coords = null;
      els.btnSubmit.disabled = true;
    }
  }

  /* ── Validation ── */
  function validate(crop, qty, price) {
    if (!crop) { showMsg(els.msg, 'Please select a crop.', 'error'); return false; }
    if (!isPositive(qty)) { showMsg(els.msg, 'Quantity must be a positive number.', 'error'); return false; }
    if (!isPositive(price)) { showMsg(els.msg, 'Price must be a positive number.', 'error'); return false; }
    return true;
  }

  /* ── Submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    hideMsg(els.msg);

    const crop     = els.crop.value;
    const quantity = els.quantity.value.trim();
    const price    = els.price.value.trim();

    if (!validate(crop, quantity, price)) return;

    if (!coords) {
      showMsg(els.msg, 'Location not available. Please wait or enter address.', 'error');
      return;
    }

    // Disable during submission
    els.btnSubmit.disabled = true;
    els.btnSubmit.textContent = 'Submitting…';

    const payload = {
      crop,
      quantity: Number(quantity),
      price: Number(price),
      location: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    };

    console.log('📦 Crop Listing Payload:', JSON.stringify(payload, null, 2));

    // Call real backend API
    try {
      const res = await fetch('/api/farmer/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showMsg(els.msg, data.detail || 'Upload failed.', 'error');
        return;
      }

      console.log('✅ Backend response:', data);
      showMsg(els.msg, `Listing created (ID: ${data.listing_id.slice(0, 8)}…). Queued for indexing.`, 'success');

      // Reset
      els.form.reset();
    } catch (err) {
      console.error('Upload error:', err);
      showMsg(els.msg, 'Network error — could not reach the server.', 'error');
    } finally {
      els.btnSubmit.disabled = false;
      els.btnSubmit.textContent = 'Upload Listing';
    }
  }

  /* ── Init ── */
  function init() {
    if (!$('#upload-form')) return;

    els = {
      form:       $('#upload-form'),
      crop:       $('#crop'),
      quantity:   $('#quantity'),
      price:      $('#price'),
      btnSubmit:  $('#btn-upload'),
      locStatus:  $('#loc-status'),
      msg:        $('#upload-msg'),
      manualAddr: $('#manual-addr'),
      manualInput:$('#manual-input'),
    };

    els.btnSubmit.disabled = true;
    els.form.addEventListener('submit', handleSubmit);
    initLocation();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', Farmer.init);
