// ─────────────────────────────────────────────
// modules/navSearch.js
// Debounced nav search dropdown.
//
// Previously: ~80 lines of search logic were inlined
// inside nav.js alongside navbar rendering, theme,
// logout, and the compose modal — four unrelated concerns
// in one 572-line file.
//
// Usage:
//   NavSearch.init()   — call once after nav DOM is injected
// ─────────────────────────────────────────────
window.NavSearch = (function () {
  'use strict';

  // ── Wire the search input, clear button, and outside-click close ──
  function init() {
    // Desktop
    _wireInput(
      document.getElementById('nav-search-input'),
      document.getElementById('nav-search-dropdown'),
      document.getElementById('nav-search-clear'),
      document.getElementById('nav-search-wrap')
    );

    // Mobile overlay — same query logic, different dropdown target
    _wireInput(
      document.getElementById('nav-mobile-search-input'),
      document.getElementById('nav-mobile-search-dropdown'),
      null,   // no clear button on mobile
      null    // outside-click handled by overlay close button
    );
  }

  // ── Generic wiring: one input → one dropdown ──
  function _wireInput(input, dropdown, clearBtn, outsideAnchor) {
    if (!input || !dropdown) return;
    var timer = null;

    function _toggleClear() {
      if (clearBtn) {
        if (input.value.length > 0) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }
    }

    function _hide() {
      dropdown.classList.add('hidden');
    }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      _toggleClear();
      var q = input.value.trim();
      if (q.length < 2) { _hide(); return; }
      timer = setTimeout(function () { _run(q, dropdown); }, 280);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        clearTimeout(timer);
        var q = input.value.trim();
        if (q.length >= 2) { _hide(); _run(q, dropdown); }
      }
      if (e.key === 'Escape') { _hide(); input.blur(); }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function (e) {
        e.preventDefault();
        input.value = '';
        _toggleClear();
        _hide();
        input.focus();
      });
    }

    if (outsideAnchor) {
      document.addEventListener('click', function (e) {
        if (!outsideAnchor.contains(e.target)) _hide();
      });
    }
  }

  // ── Fire parallel user + post queries then render the dropdown ──
  async function _run(q, dropdown) {
    if (!dropdown) return;

    dropdown.innerHTML = '<div class="nav-search-hint-loading">Searching\u2026</div>';
    dropdown.classList.remove('hidden');

    var safe = q.replace(/'/g, "''");
    var results = await Promise.all([
      supabase.from('profiles').select('id, username, profile_image_url').ilike('username', '%' + safe + '%').limit(4),
      supabase.from('posts').select('id, title, profiles:profiles!posts_author_id_fkey(username)').ilike('title', '%' + safe + '%').limit(5)
    ]);

    var users = results[0].data || [];
    var posts = results[1].data || [];

    if (!users.length && !posts.length) {
      dropdown.innerHTML = '<div class="nav-search-hint-empty">No results for \u201c' + _esc(q) + '\u201d</div>';
      return;
    }

    var html = '';

    if (users.length) {
      html += '<div class="nav-search-hint-label">People</div>';
      users.forEach(function (u) {
        var initial = u.username ? u.username.charAt(0).toUpperCase() : '?';
        var avatarHtml = u.profile_image_url
          ? '<img src="' + _escAttr(u.profile_image_url) + '" alt="" class="nav-hint-avatar-img">'
          : '<span class="nav-hint-avatar-init">' + _esc(initial) + '</span>';
        html +=
          '<a href="/' + encodeURIComponent(u.username) + '" class="nav-search-hint-item" role="option">' +
            '<div class="nav-hint-avatar">' + avatarHtml + '</div>' +
            '<div class="nav-hint-meta"><span class="nav-hint-title">@' + _esc(u.username) + '</span></div>' +
          '</a>';
      });
    }

    if (posts.length) {
      html += '<div class="nav-search-hint-label">Blogs</div>';
      posts.forEach(function (p) {
        var author = p.profiles ? p.profiles.username : '';
        html +=
          '<a href="/blog?id=' + p.id + '" class="nav-search-hint-item" role="option">' +
            '<div class="nav-hint-blog-icon">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
            '</div>' +
            '<div class="nav-hint-meta">' +
              '<span class="nav-hint-title">' + _esc(p.title) + '</span>' +
              (author ? '<span class="nav-hint-sub">@' + _esc(author) + '</span>' : '') +
            '</div>' +
          '</a>';
      });
    }

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
    dropdown.querySelectorAll('.nav-search-hint-item').forEach(function (a) {
      a.addEventListener('click', function () { dropdown.classList.add('hidden'); });
    });
  }

  function _hide() {
    var dd = document.getElementById('nav-search-dropdown');
    if (dd) dd.classList.add('hidden');
  }

  function _esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _escAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  return { init: init };
})();
