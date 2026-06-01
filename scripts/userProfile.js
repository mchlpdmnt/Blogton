// ─────────────────────────────────────────────
// userProfile.js — Centralized Profile Store
//
// Single source of truth for the logged-in
// user's profile data. Fetches once per session,
// caches in sessionStorage, and exposes helpers
// to render avatars consistently across all pages.
//
// Usage:
//   const profile = await UserProfile.get();
//   UserProfile.renderAvatar(element);
//   await UserProfile.refresh();   // call after saving changes in settings
// ─────────────────────────────────────────────

const UserProfile = (function () {
  'use strict';

  var CACHE_KEY = 'tob-user-profile';
  var _cached   = null;   // in-memory for current page
  var _promise  = null;   // deduplicates concurrent fetches

  // ── Internal: fetch from Supabase and write both caches ──
  async function _fetchFromDB() {
    var session = await Auth.getSession();
    if (!session) return null;

    var { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !data) {
      console.error('[UserProfile] fetch error:', error);
      return null;
    }

    _cached = data;

    // Persist across page navigations within the same session
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (_) {}

    return data;
  }

  // ── get() — returns cached profile or fetches it ──
  // Multiple callers on the same page share one in-flight request.
  async function get() {
    // 1. In-memory cache (same page)
    if (_cached) return _cached;

    // 2. sessionStorage cache (cross-page, same tab)
    try {
      var stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        _cached = JSON.parse(stored);
        return _cached;
      }
    } catch (_) {}

    // 3. Deduplicate concurrent fetches
    if (_promise) return _promise;
    _promise = _fetchFromDB().finally(function () { _promise = null; });
    return _promise;
  }

  // ── refresh() — force re-fetch then re-render all avatars on the page ──
  // Call this right after saving profile changes in settings.js.
  async function refresh() {
    _cached = null;
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
    await _fetchFromDB();
    renderAllAvatars();
  }

  // ── invalidate() — clear caches without re-fetching (e.g. on logout) ──
  function invalidate() {
    _cached = null;
    try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
  }

  // ── renderAvatar(el, profile?) ──
  // Renders a profile image or initial letter into any element.
  // If profile is omitted, uses the cached current-user profile.
  //
  //   <div class="nav-avatar" id="nav-avatar"></div>
  //   UserProfile.renderAvatar(document.getElementById('nav-avatar'));
  //
  function renderAvatar(el, profile) {
    if (!el) return;

    var p       = profile || _cached;
    var initial = (p && p.username) ? p.username.charAt(0).toUpperCase() : '?';

    if (p && p.profile_image_url) {
      // Build <img> and slot it in
      var img = document.createElement('img');
      img.src   = p.profile_image_url;
      img.alt   = initial;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;';
      img.onerror = function () {
        // Fall back to initial if the image fails to load
        el.textContent = initial;
      };
      el.textContent = '';
      el.appendChild(img);
    } else {
      el.textContent = initial;
    }
  }

  // ── renderAllAvatars() — refreshes every .nav-avatar on the page ──
  // Called automatically by refresh(). You can also call it manually
  // if you add avatar elements dynamically after the nav has rendered.
  function renderAllAvatars() {
    var els = document.querySelectorAll('.nav-avatar');
    els.forEach(function (el) { renderAvatar(el); });
  }

  return {
    get:             get,
    refresh:         refresh,
    invalidate:      invalidate,
    renderAvatar:    renderAvatar,
    renderAllAvatars: renderAllAvatars,
  };
})();
