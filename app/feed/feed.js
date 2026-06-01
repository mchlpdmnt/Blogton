// ─────────────────────────────────────────────
// pages/feed.js — Feed Page
//
// Masonry: JS-driven shortest-column distribution.
// Each card goes into whichever column currently has
// the smallest offsetHeight — true masonry packing.
//
// Column count is read from CSS --masonry-cols exactly
// once at init. Columns are never rebuilt on resize;
// no resize listener, no layout flash.
//
// Posts are Fisher-Yates shuffled per batch before
// being placed, so the visual order is randomised.
// ─────────────────────────────────────────────
(function () {
  'use strict';

  var PAGE_SIZE     = 10;
  var currentOffset = 0;
  var loading       = false;
  var allLoaded     = false;
  var currentUser   = null;

  var _cols    = [];  // column <div> elements
  var _states;
  var _pendingBatch = []; // cards queued for the current batch animation

  // ── Fisher-Yates shuffle (in-place) ────────────────
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // ── Masonry engine ─────────────────────────────────
  function getTargetColCount(container) {
    var raw = getComputedStyle(container).getPropertyValue('--masonry-cols').trim();
    var n   = parseInt(raw, 10);
    return (n && n > 0) ? n : 4;
  }

  function buildColumns(container, n) {
    container.innerHTML = '';
    _cols = [];
    for (var i = 0; i < n; i++) {
      var col = document.createElement('div');
      col.className = 'feed-masonry-col';
      container.appendChild(col);
      _cols.push(col);
    }
  }

  // True masonry: pick the shortest column each time.
  // Card starts invisible; animateBatch() reveals the whole batch together.
  function appendCard(card) {
    var shortest = _cols.reduce(function (min, col) {
      return col.offsetHeight < min.offsetHeight ? col : min;
    });
    card.style.opacity   = '0';
    card.style.transform = 'translateY(22px)';
    shortest.appendChild(card);
    _pendingBatch.push(card);
  }

  // Staggered entrance for all cards appended during a loadPosts() call.
  // Called once per batch, after all cards are in the DOM.
  function animateBatch() {
    if (!_pendingBatch.length) return;
    var batch = _pendingBatch.slice(); // snapshot
    _pendingBatch = [];

    if (typeof anime === 'undefined') {
      // anime.js not loaded — just make cards visible immediately
      batch.forEach(function (c) { c.style.opacity = '1'; c.style.transform = ''; });
      return;
    }

    anime({
      targets:   batch,
      opacity:   [0, 1],
      translateY: [22, 0],
      duration:  480,
      easing:    'easeOutExpo',
      delay:     anime.stagger(55, { start: 60 }),
    });
  }

  // ── Init ───────────────────────────────────────────
  async function init() {
    var session = await Auth.requireAuth();
    if (!session) return;
    history.replaceState(null, '', '/feed');
    currentUser = session.user;
    Nav.render('feed');

    _states = {
      loader:  document.getElementById('feed-loader'),
      empty:   document.getElementById('feed-empty'),
      results: document.getElementById('feed-posts'),
    };

    var container = document.getElementById('feed-posts');

    // Read column count once from CSS; never rebuild on resize.
    buildColumns(container, getTargetColCount(container));

    renderGreeting(session.user);
    loadPosts();
    setupInfiniteScroll();

    window.addEventListener('scroll', function onScroll() {
      var hint = document.getElementById('feed-scroll-hint');
      if (hint) hint.style.opacity = '0';
      window.removeEventListener('scroll', onScroll);
    }, { passive: true });
  }

  // ── Load posts ─────────────────────────────────────
  async function loadPosts() {
    if (loading || allLoaded) return;
    loading = true;

    var isPaginating = currentOffset > 0;

    if (isPaginating) {
      // Cards already visible — show loader without touching the masonry container.
      // showState() hides every element in the map except the target, which would
      // nuke all existing cards for the duration of the network call (the flash).
      if (_states.loader) _states.loader.style.display = '';
    } else {
      // Initial load: container is empty, safe to use showState normally.
      TobUtils.showState('loader', _states);
    }

    var posts = await TobUtils.withToast(
      supabase
        .from('posts')
        .select('id, title, content, image_url, created_at, profiles:profiles!posts_author_id_fkey ( username, display_name, profile_image_url )')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1),
      'Could not load posts. Please refresh.'
    );

    if (isPaginating) {
      if (_states.loader) _states.loader.style.display = 'none';
    } else {
      TobUtils.showState('results', _states);
    }
    loading = false;

    if (!posts) return;
    if (posts.length === 0) {
      if (currentOffset === 0) TobUtils.showState('empty', _states);
      allLoaded = true;
      return;
    }

    // Shuffle this batch before placing cards so the masonry
    // layout has no implied recency signal from position alone.
    shuffle(posts);

    var postIds    = posts.map(function (p) { return p.id; });
    var likedIds   = await Interactions.getUserInteractions('likes',  postIds, currentUser.id);
    var starredIds = await Interactions.getUserInteractions('stars',  postIds, currentUser.id);

    posts.forEach(function (post) {
      var card = BlogCard.create(post, {
        currentUserId: currentUser.id,
        likedIds:      likedIds,
        starredIds:    starredIds,
      });
      appendCard(card);
    });

    // Trigger staggered entrance for this batch now that all cards are in the DOM.
    animateBatch();

    currentOffset += posts.length;
    if (posts.length < PAGE_SIZE) allLoaded = true;

    // Re-check sentinel in case the batch didn't push it out of view
    // (e.g. layout reflow from avatar/image loads, or viewport taller than batch)
    if (!allLoaded) setTimeout(checkSentinelAfterLoad, 120);
  }

  // ── Infinite scroll ────────────────────────────────
  function setupInfiniteScroll() {
    var sentinel = document.getElementById('feed-sentinel');
    if (!sentinel) return;

    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !allLoaded) loadPosts();
    }, { rootMargin: '200px' });

    observer.observe(sentinel);
  }

  // ── After a batch lands, re-trigger if sentinel is still in view ──
  // Handles: avatar/image loads that reflow layout after the observer
  // already fired, and first batches that don't fill the viewport.
  function checkSentinelAfterLoad() {
    if (allLoaded) return;
    var sentinel = document.getElementById('feed-sentinel');
    if (!sentinel) return;
    var rect = sentinel.getBoundingClientRect();
    // If sentinel is within 400px of the bottom of the viewport, load more
    if (rect.top < window.innerHeight + 400) {
      loadPosts();
    }
  }

  // ── Greeting ───────────────────────────────────────
  var GREETINGS = [
    "What's the haps, @{u}?",
    "Ready to drop something good, @{u}?",
    "The feed missed you, @{u}.",
    "Got something on your mind, @{u}?",
    "Welcome back, @{u}. Write something.",
    "Good to see you, @{u}.",
    "What are we thinking about today, @{u}?",
    "The blank page is waiting, @{u}.",
    "Inspiration strikes again, @{u}?",
    "Your words matter, @{u}.",
  ];

  async function renderGreeting(user) {
    var el = document.getElementById('feed-greeting');
    if (!el) return;
    var profile  = await UserProfile.get();
    var username = (profile && profile.username)
      ? profile.username
      : (user.email ? user.email.split('@')[0] : 'there');
    var template = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    var text     = template.replace('{u}', username);
    var atIndex  = text.indexOf('@' + username);
    if (atIndex !== -1) {
      el.innerHTML =
        TobUtils.escapeHtml(text.slice(0, atIndex)) +
        '<em class="feed-greeting-user">@' + TobUtils.escapeHtml(username) + '</em>' +
        TobUtils.escapeHtml(text.slice(atIndex + 1 + username.length));
    } else {
      el.textContent = text;
    }
  }

  window.addEventListener('supabaseReady', init, { once: true });
})();