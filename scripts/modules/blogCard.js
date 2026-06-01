// ─────────────────────────────────────────────
// modules/blogCard.js
// Canonical blog card builder.
//
// Previously: createBlogCard / createCard was implemented
// four separate times in feed.js, profile.js, user.js,
// and search.js (~80 lines each, ~320 lines total).
// Each copy had minor divergences — different excerpt
// lengths, different avatar class names, different icon
// ordering on the comment pill — that caused silent bugs
// in some pages but not others.
//
// Usage:
//   BlogCard.create(post, opts)
//
// opts:
//   currentUserId  string        — used for interaction toggles
//   likedIds       string[]      — pre-loaded liked post IDs
//   starredIds     string[]      — pre-loaded starred post IDs
//   cardProfile    object|null   — { username, profile_image_url }
//                                  overrides post.profiles (e.g. starred tab)
//   showMenu       boolean       — show three-dot edit/delete menu
//   onEdit         fn(post)      — called when Edit is clicked
//   onDelete       fn(postId)    — called when Delete is clicked
// ─────────────────────────────────────────────
window.BlogCard = (function () {
  'use strict';

  var _ICON_DOTS =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">' +
      '<path d="M3.899,8.983c-1.784,.012-2.899,1.213-2.899,3,0,1.89,1.09,3.022,2.913,3.034,1.811-.012,2.867-1.105,2.9-3.033-.031-1.838-1.142-2.988-2.914-3Z"/>' +
      '<path d="M11.993,8.983c-1.784,.012-2.899,1.213-2.899,3,0,1.89,1.09,3.022,2.913,3.034,1.811-.012,2.867-1.105,2.9-3.033-.031-1.838-1.142-2.988-2.914-3Z"/>' +
      '<path d="M20.086,8.983c-1.784,.012-2.899,1.213-2.899,3,0,1.89,1.09,3.022,2.913,3.034,1.811-.012,2.867-1.105,2.9-3.033-.031-1.838-1.142-2.988-2.914-3Z"/>' +
    '</svg>';

  var _ICON_EDIT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">' +
      '<path d="m12,7V.46c.913.346,1.753.879,2.465,1.59l3.484,3.486c.712.711,1.245,1.551,1.591,2.464h-6.54c-.552,0-1-.449-1-1Zm1.27,12.48c-.813.813-1.27,1.915-1.27,3.065v1.455h1.455c1.15,0,2.252-.457,3.065-1.27l6.807-6.807c.897-.897.897-2.353,0-3.25-.897-.897-2.353-.897-3.25,0l-6.807,6.807Zm-3.27,3.065c0-1.692.659-3.283,1.855-4.479l6.807-6.807c.389-.389.842-.688,1.331-.901-.004-.12-.009-.239-.017-.359h-6.976c-1.654,0-3-1.346-3-3V.024c-.161-.011-.322-.024-.485-.024h-4.515C2.243,0,0,2.243,0,5v14c0,2.757,2.243,5,5,5h5v-1.455Z"/>' +
    '</svg>';

  var _ICON_DELETE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="currentColor">' +
      '<path d="M448,85.333h-66.133C371.66,35.703,328.002,0.064,277.333,0h-42.667c-50.669,0.064-94.327,35.703-104.533,85.333H64c-11.782,0-21.333,9.551-21.333,21.333S52.218,128,64,128h21.333v277.333C85.404,464.214,133.119,511.93,192,512h128c58.881-0.07,106.596-47.786,106.667-106.667V128H448c11.782,0,21.333-9.551,21.333-21.333S459.782,85.333,448,85.333z"/>' +
    '</svg>';

  function create(post, opts) {
    opts = opts || {};

    var currentUserId = opts.currentUserId || null;
    var likedIds      = opts.likedIds      || [];
    var starredIds    = opts.starredIds    || [];
    var cardProfile   = opts.cardProfile   || (post.profiles || {});
    var showMenu      = !!(opts.showMenu && opts.onEdit && opts.onDelete);
    var onEdit        = opts.onEdit   || null;
    var onDelete      = opts.onDelete || null;

    var username    = cardProfile.username           || 'unknown';
    var displayName = cardProfile.display_name       || null;
    var authorLabel = displayName || ('@' + username);
    var avatarUrl   = cardProfile.profile_image_url  || null;
    var initial     = username.charAt(0).toUpperCase();
    var isLiked   = likedIds.indexOf(post.id)   !== -1;
    var isStarred = starredIds.indexOf(post.id) !== -1;
    var excerpt   = post.content
      ? post.content.substring(0, 160) + (post.content.length > 160 ? '...' : '')
      : '';
    var timeAgo  = TobUtils.getRelativeTime(post.created_at);
    var postHref = '/blog?id=' + post.id;
    var postUrl  = window.location.origin + postHref;

    // ── Avatar ──────────────────────────────────────
    var avatarHtml = avatarUrl
      ? '<img src="' + TobUtils.escapeAttr(avatarUrl) + '" alt="' + TobUtils.escapeAttr(initial) + '" class="blog-card-avatar-img">'
      : '<span class="blog-card-avatar-initials">' + TobUtils.escapeHtml(initial) + '</span>';

    // ── Cover image (outside .blog-card-body, canonical position) ──
    var imageHtml = post.image_url
      ? '<img src="' + TobUtils.escapeAttr(post.image_url) + '" alt="" class="blog-card-image" loading="lazy">'
      : '';

    // ── Three-dot edit/delete menu ───────────────────
    var menuHtml = showMenu
      ? '<div class="post-options-menu">' +
          '<button class="post-options-btn card-options-btn" title="Post options" type="button">' + _ICON_DOTS + '</button>' +
          '<div class="post-options-dropdown hidden">' +
            '<button class="post-options-item card-edit-btn" type="button">' + _ICON_EDIT + '<span>Edit</span></button>' +
            '<button class="post-options-item post-options-delete card-delete-btn" type="button">' + _ICON_DELETE + '<span>Delete</span></button>' +
          '</div>' +
        '</div>'
      : '';

    // ── Card DOM ─────────────────────────────────────
    var card = document.createElement('div');
    card.className = 'blog-card';
    card.innerHTML =
      '<div class="blog-card-link">' +
        '<div class="blog-card-body">' +
          '<div class="blog-card-meta">' +
            '<div class="blog-card-avatar">' + avatarHtml + '</div>' +
            '<a href="/' + encodeURIComponent(username) + '" class="blog-card-author">' + TobUtils.escapeHtml(authorLabel) + '</a>' +
            '<span class="blog-card-time"' + (showMenu ? ' style="margin-left:auto;"' : '') + '>' + timeAgo + '</span>' +
            menuHtml +
          '</div>' +
          '<h2 class="blog-card-title">' + TobUtils.escapeHtml(post.title) + '</h2>' +
          (excerpt ? '<p class="blog-card-excerpt">' + TobUtils.escapeHtml(excerpt) + '</p>' : '') +
        '</div>' +
        imageHtml +
      '</div>' +
      '<div class="blog-card-actions">' +
        '<div class="blog-card-actions-left">' +
          '<button class="action-pill' + (isLiked   ? ' liked'   : '') + '" data-action="like" data-post-id="' + post.id + '" aria-label="Like" type="button">' +
            TobUtils.heartIcon(isLiked) + '<span class="like-count">0</span>' +
          '</button>' +
          '<button class="action-pill' + (isStarred ? ' starred' : '') + '" data-action="star" data-post-id="' + post.id + '" aria-label="Favorite" type="button">' +
            TobUtils.starIcon(isStarred) + '<span class="star-count">0</span>' +
          '</button>' +
        '</div>' +
        '<div class="blog-card-actions-right">' +
          '<a href="' + postHref + '" class="action-pill comment-pill" aria-label="Comments">' +
            TobUtils.commentIcon() + '<span class="comment-count">0</span>' +
          '</a>' +
          '<button class="action-pill action-link-btn" data-url="' + TobUtils.escapeAttr(postUrl) + '" aria-label="Copy link" type="button">' +
            TobUtils.linkIcon() +
          '</button>' +
        '</div>' +
      '</div>';

    // ── Wire: whole-card navigation ──────────────────
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (e.target.closest('button, a, input, textarea')) return;
      window.location.href = postHref;
    });

    var authorLink = card.querySelector('.blog-card-author');
    if (authorLink) authorLink.addEventListener('click', function (e) { e.stopPropagation(); });

    // ── Wire: like / star / copy-link ────────────────
    var likeBtn = card.querySelector('[data-action="like"]');
    var starBtn = card.querySelector('[data-action="star"]');
    var linkBtn = card.querySelector('.action-link-btn');

    likeBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      Interactions.toggleLike(post.id, likeBtn, currentUserId);
    });
    starBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      Interactions.toggleStar(post.id, starBtn, currentUserId);
    });
    linkBtn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(linkBtn.dataset.url)
        .then(function () { TobUtils.showToast('Link copied!'); })
        .catch(function () { TobUtils.showToast('Could not copy link'); });
    });

    // ── Wire: three-dot menu ─────────────────────────
    if (showMenu) {
      var optBtn = card.querySelector('.card-options-btn');
      var editBtn = card.querySelector('.card-edit-btn');
      var delBtn  = card.querySelector('.card-delete-btn');

      optBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var dropdown = optBtn.nextElementSibling;
        document.querySelectorAll('.post-options-dropdown').forEach(function (d) {
          if (d !== dropdown) d.classList.add('hidden');
        });
        dropdown.classList.toggle('hidden');
      });

      editBtn.addEventListener('click', function () {
        card.querySelector('.post-options-dropdown').classList.add('hidden');
        onEdit(post);
      });
      delBtn.addEventListener('click', function () {
        card.querySelector('.post-options-dropdown').classList.add('hidden');
        onDelete(post.id);
      });
    }

    // ── Counts: use pre-fetched batch data when available ────────────────────
    // In batch renders (feed, profile, search) the caller passes opts.counts
    // so we apply synchronously — no extra network request per card.
    // Pages that render a single card (blog detail) fall back to loadCounts().
    if (opts.counts) {
      _applyCounts(card, opts.counts);
    } else {
      Interactions.loadCounts(post.id, card);
    }

    return card;
  }

  // ── Apply a counts object { likes, stars, comments } to a rendered card ──
  // Called by batch renders that pre-fetch counts via getBatchCounts().
  function _applyCounts(card, counts) {
    var ls = card.querySelector('.like-count');
    var ss = card.querySelector('.star-count');
    var cs = card.querySelector('.comment-count');
    if (ls) ls.textContent = TobUtils.formatCount(counts.likes    || 0);
    if (ss) ss.textContent = TobUtils.formatCount(counts.stars    || 0);
    if (cs) {
      cs.textContent = TobUtils.formatCount(counts.comments || 0);
      var cpill = cs.closest('.action-pill');
      if (cpill && counts.comments > 0) cpill.classList.add('has-comments');
    }
  }

  return { create: create, _applyCounts: _applyCounts };
})();
