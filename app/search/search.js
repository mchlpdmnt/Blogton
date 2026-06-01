// ─────────────────────────────────────────────
// pages/search.js — Search Results
//
// Reduced from 346 → ~115 lines by delegating:
//   BlogCard.create()                   — blog card rendering
//   Interactions.getUserInteractions()  — like/star state
//   TobUtils.showState()               — replaces local showState()
// ─────────────────────────────────────────────
(function () {
  'use strict';

  var currentUser  = null;
  var activeTab    = 'blogs';
  var lastQuery    = '';
  var cachedUsers  = [];
  var cachedPosts  = [];
  var debounceTimer;

  var _states;

  async function init() {
    var session = await Auth.requireAuth();
    if (!session) return;
    history.replaceState(null, '', '/search' + window.location.search);
    currentUser = session.user;
    Nav.render('search');

    _states = {
      loader:  document.getElementById('search-loader'),
      empty:   document.getElementById('search-empty'),
      prompt:  document.getElementById('search-prompt'),
      results: document.getElementById('search-results-content'),
    };

    setupPageSearchBar();
    setupTabs();

    var params = new URLSearchParams(window.location.search);
    var q = (params.get('q') || '').trim();
    if (q) {
      var input = document.getElementById('search-page-input');
      if (input) input.value = q;
      document.title = '\u201c' + q + '\u201d Search Results \u2014 Blogton';
      runSearch(q);
    }
  }

  // ── In-page search bar ────────────────────
  function setupPageSearchBar() {
    var input = document.getElementById('search-page-input');
    if (!input) return;

    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var q = input.value.trim();
      var url = new URL(window.location.href);
      if (q) { url.searchParams.set('q', q); } else { url.searchParams.delete('q'); }
      window.history.replaceState(null, '', url.toString());

      if (q.length < 2) {
        TobUtils.showState('prompt', _states);
        document.getElementById('search-tabs').style.display = 'none';
        document.getElementById('search-results-content').innerHTML = '';
        return;
      }
      debounceTimer = setTimeout(function () { runSearch(q); }, 300);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(debounceTimer);
        var q = input.value.trim();
        if (q.length >= 2) runSearch(q);
      }
    });
  }

  // ── Tabs ──────────────────────────────────
  function setupTabs() {
    var tabBtns = document.querySelectorAll('#search-tabs .tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        renderActiveTab();
      });
    });
  }

  function updateTabActive() {
    document.querySelectorAll('#search-tabs .tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === activeTab);
    });
  }

  // ── Run Supabase search ────────────────────
  async function runSearch(q) {
    if (q === lastQuery) { renderActiveTab(); return; }
    lastQuery = q;

    TobUtils.showState('loader', _states);
    document.getElementById('search-tabs').style.display = 'none';

    var safe = q.replace(/'/g, "''");
    var [usersRes, postsRes] = await Promise.all([
      supabase.from('profiles').select('id, username, created_at, profile_image_url').ilike('username', '%' + safe + '%').limit(30),
      supabase.from('posts')
        .select('id, title, content, image_url, created_at, author_id, profiles:profiles!posts_author_id_fkey(username, display_name, profile_image_url)')
        .or('title.ilike.%' + safe + '%,content.ilike.%' + safe + '%')
        .order('created_at', { ascending: false }).limit(30)
    ]);

    cachedUsers = usersRes.data || [];
    cachedPosts = postsRes.data || [];

    if (!cachedUsers.length && !cachedPosts.length) {
      TobUtils.showState('empty', _states);
      var msgEl = document.getElementById('search-empty-msg');
      if (msgEl) msgEl.textContent = 'No results for \u201c' + q + '\u201d.';
      document.getElementById('search-tabs').style.display = 'none';
      return;
    }

    TobUtils.showState('results', _states);
    document.getElementById('search-tabs').style.display = '';
    activeTab = (!cachedPosts.length && cachedUsers.length) ? 'users' : 'blogs';
    updateTabActive();
    renderActiveTab();
  }

  // ── Render active tab ─────────────────────
  function renderActiveTab() {
    var container = document.getElementById('search-results-content');
    container.innerHTML = '';
    if (activeTab === 'blogs') renderBlogs(container);
    else renderUsers(container);
  }

  async function renderBlogs(container) {
    if (!cachedPosts.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          '<p>No matching blogs found.</p>' +
        '</div>';
      return;
    }

    var postIds    = cachedPosts.map(function (p) { return p.id; });
    var likedIds   = await Interactions.getUserInteractions('likes', postIds, currentUser.id);
    var starredIds = await Interactions.getUserInteractions('stars', postIds, currentUser.id);

    cachedPosts.forEach(function (post) {
      container.appendChild(BlogCard.create(post, {
        currentUserId: currentUser.id,
        likedIds:      likedIds,
        starredIds:    starredIds,
      }));
    });
  }

  function renderUsers(container) {
    if (!cachedUsers.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>' +
          '<p>No matching users found.</p>' +
        '</div>';
      return;
    }
    cachedUsers.forEach(function (u) { container.appendChild(createUserCard(u)); });
  }

  // ── User card (search-only component, no BlogCard equivalent) ──
  function createUserCard(u) {
    var card      = document.createElement('a');
    card.href      = '/' + encodeURIComponent(u.username);
    card.className = 'user-card blog-card-link';
    var initial    = u.username.charAt(0).toUpperCase();
    var joinedDate = new Date(u.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var avatarHtml = u.profile_image_url
      ? '<img src="' + TobUtils.escapeAttr(u.profile_image_url) + '" alt="' + TobUtils.escapeAttr(initial) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">'
      : TobUtils.escapeHtml(initial);

    card.innerHTML =
      '<div class="user-card-avatar">' + avatarHtml + '</div>' +
      '<div class="user-card-info">' +
        '<span class="user-card-username">@' + TobUtils.escapeHtml(u.username) + '</span>' +
        '<span class="user-card-joined">Joined ' + joinedDate + '</span>' +
      '</div>' +
      '<svg class="user-card-arrow" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    return card;
  }

  window.addEventListener('supabaseReady', init, { once: true });
})();
