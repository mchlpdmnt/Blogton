// ─────────────────────────────────────────────
// pages/user.js — Other User's Profile (read-only)
//
// PUBLIC PAGE — no login required to view.
// If the visitor IS logged in, we load their session so we can:
//   - detect if they're viewing their own profile (redirect to /profile)
//   - show personalised like/star state on blog cards
// If they are NOT logged in, we still render the full profile read-only.
// ─────────────────────────────────────────────
(function () {
  'use strict';

  var currentUser = null; // null when logged out — safe, checked before use
  var viewProfile = null;
  var activeTab   = 'blogs';

  async function init() {
    // getSession() — does NOT redirect. Returns null for logged-out visitors.
    // requireAuth() would redirect logged-out users to /home, breaking public profiles.
    var session = await Auth.getSession();
    currentUser = session ? session.user : null;

    var params   = new URLSearchParams(window.location.search);
    var username = params.get('u') || usernameFromPath();

    if (!username) {
      // No username in path or query — send logged-in users to their own profile,
      // logged-out users to the landing page.
      window.location.replace(currentUser ? '/profile' : '/home');
      return;
    }

    history.replaceState(null, '', '/' + encodeURIComponent(username));

    var profile = await TobUtils.withToast(
      supabase.from('profiles').select('*').eq('username', username).single(),
      'Could not load this profile.'
    );

    if (!profile) { Nav.render(''); renderNotFound(); return; }

    // Logged-in user viewing their own profile → redirect to /profile
    if (currentUser && profile.id === currentUser.id) {
      window.location.replace('/profile');
      return;
    }

    viewProfile = profile;
    document.title = '@' + viewProfile.username + '\u2014 Blogton';
    Nav.render('');
    renderLayout();
    setupTabs();
    loadTabContent();
  }

  // ── Two-column layout ──────────────────────
  function renderLayout() {
    var container   = document.getElementById('profile-content');
    var initial     = viewProfile.username.charAt(0).toUpperCase();
    var joinedDate  = new Date(viewProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var bio         = (viewProfile.bio || '').replace(/\n{3,}/g, '\n\n');
    var displayName = viewProfile.display_name || '';

    var avatarHtml = viewProfile.profile_image_url
      ? '<img src="' + TobUtils.escapeAttr(viewProfile.profile_image_url) + '" alt="Profile" class="profile-avatar-img">'
      : '<div class="profile-avatar-text">' + TobUtils.escapeHtml(initial) + '</div>';

    var coverInnerHtml = viewProfile.cover_image_url
      ? '<img src="' + TobUtils.escapeAttr(viewProfile.cover_image_url) + '" alt="Cover">' : '';

    container.innerHTML =
      '<div class="profile-layout">' +
        '<aside class="profile-sidebar">' +
          '<div class="profile-sidebar-card">' +
            '<div class="profile-cover-sm">' + coverInnerHtml + '</div>' +
            '<div class="profile-sidebar-identity">' +
              '<div class="profile-avatar">' + avatarHtml + '</div>' +
              '<div class="profile-sidebar-info' + (displayName ? ' has-display-name' : '') + '">' +
                (displayName
                  ? '<span class="profile-display-name">' + TobUtils.escapeHtml(displayName) + '</span>'
                  : '') +
                '<p class="profile-username-static">@' + TobUtils.escapeHtml(viewProfile.username) + '</p>' +
                '<p class="profile-joined">Joined ' + joinedDate + '</p>' +
              '</div>' +
            '</div>' +
            (bio
              ? '<div class="profile-about"><h3 class="profile-about-label">About</h3><p class="profile-about-text">' + TobUtils.escapeHtml(bio) + '</p></div>'
              : '') +
          '</div>' +
        '</aside>' +
        '<section class="profile-main">' +
          '<div class="tabs profile-tabs-row" id="profile-tabs">' +
            '<button class="tab-btn active" data-tab="blogs">Their Blogs</button>' +
          '</div>' +
          '<div class="profile-main-scroll">' +
            '<div id="tab-content" class="profile-grid"></div>' +
          '</div>' +
        '</section>' +
      '</div>';
  }

  // ── Tabs ──────────────────────────────────
  function setupTabs() {
    document.querySelectorAll('#profile-tabs .tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#profile-tabs .tab-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        loadTabContent();
      });
    });
  }

  async function loadTabContent() {
    var container = document.getElementById('tab-content');
    container.innerHTML =
      '<div class="skeleton-card">' +
        '<div class="skeleton skeleton-image"></div>' +
        '<div class="skeleton skeleton-text title"></div>' +
        '<div class="skeleton skeleton-text"></div>' +
        '<div class="skeleton skeleton-text short"></div>' +
      '</div>';
    await loadBlogs(container);
  }

  // ── Their Blogs ───────────────────────────
  async function loadBlogs(container) {
    var posts = await TobUtils.withToast(
      supabase.from('posts')
        .select('id, title, content, image_url, created_at, author_id')
        .eq('author_id', viewProfile.id)
        .order('created_at', { ascending: false }),
      'Could not load posts.'
    );

    if (!posts || !posts.length) {
      container.innerHTML =
        '<div class="empty-state">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
          "<p>This user hasn't posted anything yet.</p>" +
        '</div>';
      return;
    }

    // Like/star state only available when the visitor is logged in
    var ids        = posts.map(function (p) { return p.id; });
    var likedIds   = currentUser ? await Interactions.getUserInteractions('likes',  ids, currentUser.id) : [];
    var starredIds = currentUser ? await Interactions.getUserInteractions('stars',  ids, currentUser.id) : [];

    container.innerHTML = '';
    posts.forEach(function (post) {
      var cardPost = Object.assign({}, post, {
        profiles: {
          username:          viewProfile.username,
          display_name:      viewProfile.display_name || null,
          profile_image_url: viewProfile.profile_image_url
        }
      });
      container.appendChild(BlogCard.create(cardPost, {
        currentUserId: currentUser ? currentUser.id : null,
        likedIds:      likedIds,
        starredIds:    starredIds,
      }));
    });
  }

  function renderNotFound() {
    document.getElementById('profile-content').innerHTML =
      '<div class="empty-state">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
        '<p>User not found.</p>' +
      '</div>';
  }

  function usernameFromPath() {
    var path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    var reserved = ['home', 'about', 'contact', 'privacy', 'feed', 'profile', 'settings', 'blog', 'user', 'search'];
    if (!path || path.indexOf('/') !== -1 || reserved.indexOf(path) !== -1) return null;
    return decodeURIComponent(path);
  }

  window.addEventListener('supabaseReady', init, { once: true });
})(); 