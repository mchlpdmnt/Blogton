// ─────────────────────────────────────────────
// components/nav.js — App navbar coordinator
//
// Public API:
//   Nav.render(activePage)
//   Nav.openComposeModal(postData?)
// ─────────────────────────────────────────────
const Nav = (function () {
  'use strict';

  var composeIco =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="nav-tune-icon" fill="currentColor">' +
      '<path d="m13.498,2.671c-3.197,2.27-4.585,5.494-5.148,7.331-.665,1.178-1.1,2.501-1.287,3.998h-1.062c-.552,0-1,.448-1,1v1.298l-3.113,1.125c-1.386.554-2.159,2.064-1.797,3.513l.009.034c.445,1.78,2.045,3.029,3.88,3.029h8.043c1.835,0,3.434-1.248,3.88-3.028l.009-.036c.361-1.448-.412-2.958-1.829-3.525l-3.082-1.113v-1.298c0-.552-.448-1-1-1h-.927c.051-.341.112-.677.195-1h-.012c1.59-4.897,5.974-8.919,9.513-9.333-3.154,2.231-5.32,5.233-6.689,7.629,1.939-.285,4.286-.95,6.422-2.467,3.213-2.281,4.89-5.53,5.447-7.362.224-.736-.326-1.467-1.095-1.467-2.015,0-6.092.353-9.356,2.671Z"/>' +
    '</svg>';

  var searchIco =
    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

  var backArrowIco =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';

  function render(activePage) {
    var body = document.body;

    var nav = document.createElement('nav');
    nav.className = 'app-navbar';
    nav.innerHTML =
      '<div class="app-nav-inner">' +
        '<a href="/feed" class="app-nav-logo"><span class="nav-logo-wordmark">Blogton.</span></a>' +

        // Desktop: centered search pill + compose btn
        '<div class="app-nav-center">' +
          '<div class="nav-search-wrap" id="nav-search-wrap">' +
            '<svg class="nav-search-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<div class="nav-search-field">' +
              '<input type="search" id="nav-search-input" class="nav-search-input" placeholder=" " autocomplete="off" spellcheck="false">' +
              '<label for="nav-search-input" class="nav-search-label">Got <em class="nav-search-em">something</em> in mind?</label>' +
              '<button type="button" class="nav-search-clear hidden" id="nav-search-clear" aria-label="Clear search" tabindex="-1"><img src="/assets/cross-small.svg" width="12" height="12" alt=""></button>' +
            '</div>' +
            '<div class="nav-search-dropdown hidden" id="nav-search-dropdown" role="listbox"></div>' +
          '</div>' +
          '<button class="nav-tune-btn" id="nav-compose-btn" aria-label="Write a post" title="Write a post" type="button">' + composeIco + '</button>' +
        '</div>' +

        // Right: mobile icon row (search | compose) + avatar (links to profile)
        '<div class="app-nav-right" style="gap:0.45rem;">' +
          '<button class="nav-mobile-search-btn" id="nav-mobile-search-btn" aria-label="Search" type="button">' + searchIco + '</button>' +
          '<button class="nav-mobile-compose-btn" id="nav-mobile-compose-btn" aria-label="Write a post" type="button">' + composeIco + '</button>' +
          '<div class="nav-profile-wrap" id="nav-profile-wrap">' +
            '<a href="/profile" class="nav-profile-avatar-btn" id="nav-avatar-btn" aria-label="View profile">' +
              '<div class="nav-avatar nav-avatar-lg" id="nav-avatar"></div>' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</div>';

    // ── Mobile floating search overlay — slides in from top ──
    var mobileOverlay = document.createElement('div');
    mobileOverlay.id = 'nav-mobile-search-overlay';
    mobileOverlay.className = 'nav-mobile-search-overlay';
    mobileOverlay.innerHTML =
      '<button class="nav-mobile-search-back" id="nav-mobile-search-back" aria-label="Close search" type="button">' + backArrowIco + '</button>' +
      '<div class="nav-mobile-search-field">' +
        '<input type="search" id="nav-mobile-search-input" class="nav-mobile-search-input" placeholder="Search posts and people\u2026" autocomplete="off" spellcheck="false">' +
      '</div>';

    // Mobile results dropdown — sits below the overlay bar, full-width, fixed
    var mobileDropdown = document.createElement('div');
    mobileDropdown.id = 'nav-mobile-search-dropdown';
    mobileDropdown.className = 'nav-mobile-search-dropdown hidden';
    document.body.appendChild(mobileDropdown);

    body.prepend(mobileOverlay);
    body.prepend(nav);

    // Push the page's <main> below the fixed navbar.
    var mainEl = document.querySelector('main:not(.app-page)');
    if (mainEl) mainEl.style.paddingTop = nav.offsetHeight + 'px';

    // Keep --nav-h in sync with the actual rendered height
    document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');

    // ── Delegate ──
    ComposeModal.inject(body);
    NavSearch.init();

    // ── Desktop compose ──
    var composeBtn = document.getElementById('nav-compose-btn');
    if (composeBtn) composeBtn.addEventListener('click', function () { ComposeModal.open(); });

    // ── Mobile compose ──
    var mobileComposeBtn = document.getElementById('nav-mobile-compose-btn');
    if (mobileComposeBtn) mobileComposeBtn.addEventListener('click', function () { ComposeModal.open(); });

    // ── Mobile search overlay ──
    var mobileSearchBtn   = document.getElementById('nav-mobile-search-btn');
    var mobileSearchBack  = document.getElementById('nav-mobile-search-back');
    var mobileSearchInput = document.getElementById('nav-mobile-search-input');

    function openMobileSearch() {
      mobileOverlay.classList.add('open');
      if (mobileSearchInput) setTimeout(function () { mobileSearchInput.focus(); }, 120);
    }
    function closeMobileSearch() {
      mobileOverlay.classList.remove('open');
      if (mobileSearchInput) mobileSearchInput.value = '';
      var mob = document.getElementById('nav-mobile-search-dropdown');
      if (mob) mob.classList.add('hidden');
    }

    if (mobileSearchBtn)  mobileSearchBtn.addEventListener('click', openMobileSearch);
    if (mobileSearchBack) mobileSearchBack.addEventListener('click', closeMobileSearch);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileOverlay.classList.contains('open')) closeMobileSearch();
    });

    // ── Theme — initialise from storage (toggle lives in settings) ──
    var html   = document.documentElement;
    var stored = localStorage.getItem('tob-theme');
    var theme  = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    html.setAttribute('data-theme', theme);

    // ── Avatar ──
    UserProfile.get().then(function (profile) {
      var avatarEl = document.getElementById('nav-avatar');
      var avatarLink = document.getElementById('nav-avatar-btn');
      if (avatarLink && profile && profile.username) {
        avatarLink.href = '/' + encodeURIComponent(profile.username);
      }
      if (avatarEl) UserProfile.renderAvatar(avatarEl, profile);
    });
  }

  return {
    render: render,
    openComposeModal: function (postData) { ComposeModal.open(postData); }
  };
})();
