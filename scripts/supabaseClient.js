// ─────────────────────────────────────────────
// scripts/supabaseClient.js
//
// Initializes the Supabase client by fetching credentials from
// the Netlify serverless function, then dispatches 'supabaseReady'.
//
// Back-navigation guard: if window.supabase is already a live client
// (same tab, prior page load), dispatches immediately so page scripts
// that re-register their supabaseReady listener don't hang forever.
// ─────────────────────────────────────────────

(function () {
  'use strict';

  // ── Back-navigation fast path ──────────────────────────────────────────
  // When the user navigates back, the browser may restore the page from
  // bfcache or do a fresh load. Either way, window.supabase may already be
  // a live client from the previous page in this tab (globals persist across
  // same-tab navigations). If it is, dispatch immediately — don't wait for
  // another config fetch.
  function _isLiveClient(obj) {
    return obj && typeof obj.from === 'function' && typeof obj.auth === 'object';
  }

  if (_isLiveClient(window.supabase)) {
    // Already initialized — fire on next tick so listener registration
    // in the page script (which runs after this file) has time to attach.
    setTimeout(function () {
      window.dispatchEvent(new Event('supabaseReady'));
    }, 0);
    return;
  }

  // ── Normal init path ───────────────────────────────────────────────────
  var _domReady   = false;
  var _configData = null;

  function _tryInit() {
    if (!_domReady || !_configData) return;

    var lib = window.supabase && window.supabase.createClient
      ? window.supabase
      : window.__supabaseJsFactory;

    if (!lib || !lib.createClient) {
      console.error('[supabaseClient] Supabase CDN not loaded.');
      return;
    }

    window.__supabaseJsFactory = lib;
    window.supabase = lib.createClient(_configData.supabaseUrl, _configData.supabaseKey);
    window.dispatchEvent(new Event('supabaseReady'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      _domReady = true;
      _tryInit();
    });
  } else {
    _domReady = true;
  }

  fetch('/.netlify/functions/config')
    .then(function (res) {
      var ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        throw new Error(
          '/.netlify/functions/config returned ' + res.status + '.\n' +
          'Run `netlify dev` locally instead of a plain static server.'
        );
      }
      return res.json();
    })
    .then(function (config) {
      if (!config.supabaseUrl || !config.supabaseKey) {
        throw new Error('Config missing supabaseUrl or supabaseKey. Check Netlify env vars.');
      }
      _configData = config;
      _tryInit();
    })
    .catch(function (err) {
      console.error('[supabaseClient] Failed to fetch config:', err.message || err);
    });

})();
