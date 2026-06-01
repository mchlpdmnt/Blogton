// ─────────────────────────────────────────────
// modules/interactions.js
// Single source of truth for all post interactions:
// likes, stars, counts, and interaction state loading.
//
// Previously: toggleLike/toggleStar/loadCounts were
// copy-pasted across feed.js, profile.js, user.js,
// blog.js, and search.js (~20 duplicate functions).
// ─────────────────────────────────────────────
window.Interactions = (function () {
  'use strict';

  // ── Internal: parse "1.2K" / "3M" / "42" back to a raw integer ──
  function _parseCount(str) {
    if (!str) return 0;
    str = str.trim();
    if (str.endsWith('M')) return parseFloat(str) * 1000000;
    if (str.endsWith('K')) return parseFloat(str) * 1000;
    return parseInt(str, 10) || 0;
  }

  // ── Return an array of post IDs the given user has interacted with ──
  // table: 'likes' | 'stars'
  async function getUserInteractions(table, postIds, userId) {
    if (!userId || !postIds || !postIds.length) return [];
    var { data } = await supabase
      .from(table)
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);
    return (data || []).map(function (r) { return r.post_id; });
  }

  // ── Fetch like / star / comment counts for a post and write them into a card ──
  // Fires three count queries in parallel; updates .like-count, .star-count,
  // .comment-count spans and adds .has-comments to the comment pill when cc > 0.
  async function loadCounts(postId, card) {
    var results = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('stars').select('*', { count: 'exact', head: true }).eq('post_id', postId),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    ]);

    var ls = card.querySelector('.like-count');
    var ss = card.querySelector('.star-count');
    var cs = card.querySelector('.comment-count');

    if (ls) ls.textContent = TobUtils.formatCount(results[0].count || 0);
    if (ss) ss.textContent = TobUtils.formatCount(results[1].count || 0);
    if (cs) {
      var cc = results[2].count || 0;
      cs.textContent = TobUtils.formatCount(cc);
      var cpill = cs.closest('.action-pill');
      if (cpill && cc > 0) cpill.classList.add('has-comments');
    }
  }

  // ── Toggle a like on a post; updates button state and count optimistically ──
  async function toggleLike(postId, btn, userId) {
    if (!userId) return;
    var isLiked = btn.classList.contains('liked');
    var countEl = btn.querySelector('.like-count');
    var raw     = _parseCount(countEl ? countEl.textContent : '0');

    if (isLiked) {
      var { error } = await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
      if (error) { TobUtils.showToast('Could not unlike. Try again.'); return; }
      btn.classList.remove('liked');
      btn.innerHTML = TobUtils.heartIcon(false) + '<span class="like-count">' + TobUtils.formatCount(Math.max(0, raw - 1)) + '</span>';
    } else {
      var { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      if (error) { TobUtils.showToast('Could not like. Try again.'); return; }
      btn.classList.add('liked');
      btn.innerHTML = TobUtils.heartIcon(true) + '<span class="like-count">' + TobUtils.formatCount(raw + 1) + '</span>';
    }
  }

  // ── Toggle a star on a post; updates button state and count optimistically ──
  async function toggleStar(postId, btn, userId) {
    if (!userId) return;
    var isStarred = btn.classList.contains('starred');
    var countEl   = btn.querySelector('.star-count');
    var raw       = _parseCount(countEl ? countEl.textContent : '0');

    if (isStarred) {
      var { error } = await supabase.from('stars').delete().eq('post_id', postId).eq('user_id', userId);
      if (error) { TobUtils.showToast('Could not un-star. Try again.'); return; }
      btn.classList.remove('starred');
      btn.innerHTML = TobUtils.starIcon(false) + '<span class="star-count">' + TobUtils.formatCount(Math.max(0, raw - 1)) + '</span>';
    } else {
      var { error } = await supabase.from('stars').insert({ post_id: postId, user_id: userId });
      if (error) { TobUtils.showToast('Could not star. Try again.'); return; }
      btn.classList.add('starred');
      btn.innerHTML = TobUtils.starIcon(true) + '<span class="star-count">' + TobUtils.formatCount(raw + 1) + '</span>';
    }
  }

  // ── Fetch like / star / comment counts for a batch of posts ──────────────
  // Returns a map: { [postId]: { likes, stars, comments } }
  // 3 queries total regardless of batch size — replaces per-card loadCounts()
  // calls in feed/search/profile batch renders.
  async function getBatchCounts(postIds) {
    if (!postIds || !postIds.length) return {};

    var results = await Promise.all([
      supabase.from('likes')   .select('post_id').in('post_id', postIds),
      supabase.from('stars')   .select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds),
    ]);

    var map = {};
    postIds.forEach(function (id) {
      map[id] = { likes: 0, stars: 0, comments: 0 };
    });

    (results[0].data || []).forEach(function (r) { if (map[r.post_id]) map[r.post_id].likes++;    });
    (results[1].data || []).forEach(function (r) { if (map[r.post_id]) map[r.post_id].stars++;    });
    (results[2].data || []).forEach(function (r) { if (map[r.post_id]) map[r.post_id].comments++; });

    return map;
  }

  return { getUserInteractions, loadCounts, getBatchCounts, toggleLike, toggleStar };
})();
