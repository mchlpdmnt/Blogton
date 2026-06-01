// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// pages/blog.js â€” Single post detail view
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function () {
  'use strict';

  var currentUser = null;
  var currentPost = null;

  var ICON_EDIT =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="m12,7V.46c.913.346,1.753.879,2.465,1.59l3.484,3.486c.712.711,1.245,1.551,1.591,2.464h-6.54c-.552,0-1-.449-1-1Zm1.27,12.48c-.813.813-1.27,1.915-1.27,3.065v1.455h1.455c1.15,0,2.252-.457,3.065-1.27l6.807-6.807c.897-.897.897-2.353,0-3.25-.897-.897-2.353-.897-3.25,0l-6.807,6.807Zm-3.27,3.065c0-1.692.659-3.283,1.855-4.479l6.807-6.807c.389-.389.842-.688,1.331-.901-.004-.12-.009-.239-.017-.359h-6.976c-1.654,0-3-1.346-3-3V.024c-.161-.011-.322-.024-.485-.024h-4.515C2.243,0,0,2.243,0,5v14c0,2.757,2.243,5,5,5h5v-1.455Z"/></svg>';

  var ICON_DELETE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14" fill="currentColor"><path d="M448,85.333h-66.133C371.66,35.703,328.002,0.064,277.333,0h-42.667c-50.669,0.064-94.327,35.703-104.533,85.333H64c-11.782,0-21.333,9.551-21.333,21.333S52.218,128,64,128h21.333v277.333C85.404,464.214,133.119,511.93,192,512h128c58.881-0.07,106.596-47.786,106.667-106.667V128H448c11.782,0,21.333-9.551,21.333-21.333S459.782,85.333,448,85.333z"/></svg>';

  var ICON_DOTS =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';

  var ICON_QUOTE =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M9.583,0H1.75C0.784,0,0,0.784,0,1.75v7.833c0,0.966,0.784,1.75,1.75,1.75h3.747l-2.03,9.908C3.355,21.69,3.52,22.142,3.848,22.47C4.078,22.7,4.387,22.826,4.706,22.826c0.109,0,0.219-0.013,0.327-0.04L14.5,20.25V1.75C14.5,0.784,13.716,0,12.75,0H9.583z"/><path d="M22.25,0h-3.167H17.5v18.5l7.042-1.762C24.812,16.71,25,16.388,25,16.042V1.75C25,0.784,24.216,0,23.25,0H22.25z"/></svg>';

  var ICON_SEND =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.7,2.3c-0.4-0.4-1-0.5-1.5-0.3L1.2,10.7c-0.5,0.3-0.8,0.8-0.7,1.4c0.1,0.6,0.5,1,1.1,1.2l7.4,2l2,7.4c0.2,0.6,0.6,1,1.2,1.1c0.1,0,0.1,0,0.2,0c0.5,0,1-0.3,1.2-0.7l8.7-19C22.2,3.3,22.1,2.7,21.7,2.3z"/></svg>';

  function renderNameStack(username, displayName, className) {
    var handle = '@' + username;
    var primary = displayName || handle;
    var html =
      '<span class="' + className + '-primary">' + TobUtils.escapeHtml(primary) + '</span>';

    if (displayName) {
      html += '<span class="' + className + '-handle">' + TobUtils.escapeHtml(handle) + '</span>';
    }

    return html;
  }

  async function init() {
    var session = await Auth.requireAuth();
    if (!session) return;
    history.replaceState(null, '', '/blog' + window.location.search);
    currentUser = session.user;
    Nav.render('');

    var params = new URLSearchParams(window.location.search);
    var postId = params.get('id');
    if (!postId) { renderNotFound(); return; }

    await loadPost(postId);
    setupDeleteModal();
    setupLightbox();

    document.addEventListener('click', function (e) {
      if (e.target.closest('.post-options-menu')) return;
      closePostOptionsMenus();
    });
  }

  async function loadPost(postId) {
    var container = document.getElementById('blog-content');
    container.innerHTML =
      '<div style="padding:2rem 0;">' +
        '<div class="skeleton" style="height:2.4rem;max-width:70%;border-radius:8px;margin-bottom:1rem;"></div>' +
        '<div class="skeleton" style="height:360px;border-radius:12px;margin-bottom:1rem;"></div>' +
        '<div class="skeleton" style="height:1rem;margin-bottom:0.5rem;border-radius:6px;"></div>' +
        '<div class="skeleton" style="height:1rem;max-width:80%;border-radius:6px;"></div>' +
      '</div>';

    var { data: post, error } = await supabase
      .from('posts')
      .select('*, profiles:profiles!posts_author_id_fkey ( username, display_name, profile_image_url )')
      .eq('id', postId)
      .single();

    if (error || !post) { renderNotFound(); return; }
    currentPost = post;
    document.title = post.title + ' â€” Blogton';
    renderPost(post);
  }

  async function renderPost(post) {
    var container  = document.getElementById('blog-content');
    var sidebarEl  = document.getElementById('blog-sidebar');
    var isOwn      = post.author_id === currentUser.id;
    var username    = post.profiles ? post.profiles.username     : 'unknown';
    var displayName = post.profiles ? post.profiles.display_name : null;
    var authorNameHtml = renderNameStack(username, displayName, 'blog-author-name');
    var initial     = username.charAt(0).toUpperCase();
    var profileImg = post.profiles ? post.profiles.profile_image_url : null;
    var postUrl    = window.location.origin + '/blog?id=' + post.id;

    var { data: likeData } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle();
    var { data: starData } = await supabase.from('stars').select('id').eq('post_id', post.id).eq('user_id', currentUser.id).maybeSingle();
    var { count: likeCount } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
    var { count: starCount } = await supabase.from('stars').select('*', { count: 'exact', head: true }).eq('post_id', post.id);

    var isLiked   = !!likeData;
    var isStarred = !!starData;

    var authorAvatarInner = profileImg
      ? '<img src="' + TobUtils.escapeAttr(profileImg) + '" alt="">'
      : TobUtils.escapeHtml(initial);

    var optionsHtml = isOwn
      ? '<div class="post-options-menu">' +
          '<button class="post-options-btn" type="button" aria-label="Post options">' + ICON_DOTS + '</button>' +
          '<div class="post-options-dropdown hidden">' +
            '<button class="post-options-item edit-post-btn" type="button">' + ICON_EDIT + '<span>Edit</span></button>' +
            '<button class="post-options-item post-options-delete delete-post-btn" type="button">' + ICON_DELETE + '<span>Delete</span></button>' +
          '</div>' +
        '</div>'
      : '';

    var titleEl = document.getElementById('blog-title');
    if (titleEl) {
      titleEl.textContent = post.title;
      titleEl.style.display = '';
    }

    // â”€â”€ META TOP: author row + action pills â€” above the title on mobile â”€â”€
    var metaTopEl = document.getElementById('blog-meta-top');
    if (metaTopEl) {
      metaTopEl.innerHTML =
        '<div class="blog-author-row">' +
          '<div class="blog-author-avatar">' + authorAvatarInner + '</div>' +
          '<a href="/' + encodeURIComponent(username) + '" class="blog-author-name">' + authorNameHtml + '</a>' +
          '<span class="blog-author-time">' + TobUtils.getRelativeTime(post.created_at) + '</span>' +
        '</div>' +
        '<div class="blog-action-row">' +
          '<button class="blog-action-pill' + (isLiked ? ' liked' : '') + '" id="like-btn">' +
            TobUtils.heartIcon(isLiked) +
            '<span id="like-count">' + TobUtils.formatCount(likeCount || 0) + '</span>' +
          '</button>' +
          '<button class="blog-action-pill' + (isStarred ? ' starred' : '') + '" id="star-btn">' +
            TobUtils.starIcon(isStarred) +
            '<span id="star-count">' + TobUtils.formatCount(starCount || 0) + '</span>' +
          '</button>' +
          '<button class="blog-action-link-btn" id="link-btn" aria-label="Copy link">' +
            TobUtils.linkIcon() +
          '</button>' +
          (optionsHtml ? optionsHtml : '') +
        '</div>';
    }

    // â”€â”€ LEFT: image â†’ content only â”€â”€
    var imageHtml = post.image_url
      ? '<img src="' + TobUtils.escapeAttr(post.image_url) + '" alt="" class="blog-detail-image">'
      : '';

    var contentHtml = TobUtils.escapeHtml(post.content || '')
      .split('\n\n').map(function (p) { return '<p>' + p + '</p>'; }).join('');

    container.innerHTML =
      '<article>' +
        imageHtml +
        '<div class="blog-detail-content">' + contentHtml + '</div>' +
      '</article>';

    // â”€â”€ RIGHT SIDEBAR: author + actions (desktop only) + comments â”€â”€
    sidebarEl.innerHTML =
      '<div class="blog-sidebar-meta">' +
        '<div class="blog-author-row">' +
          '<div class="blog-author-avatar">' + authorAvatarInner + '</div>' +
          '<a href="/' + encodeURIComponent(username) + '" class="blog-author-name">' + authorNameHtml + '</a>' +
          '<span class="blog-author-time">' + TobUtils.getRelativeTime(post.created_at) + '</span>' +
        '</div>' +
        '<div class="blog-action-row">' +
          '<button class="blog-action-pill' + (isLiked ? ' liked' : '') + '" id="like-btn-sidebar">' +
            TobUtils.heartIcon(isLiked) +
            '<span id="like-count-sidebar">' + TobUtils.formatCount(likeCount || 0) + '</span>' +
          '</button>' +
          '<button class="blog-action-pill' + (isStarred ? ' starred' : '') + '" id="star-btn-sidebar">' +
            TobUtils.starIcon(isStarred) +
            '<span id="star-count-sidebar">' + TobUtils.formatCount(starCount || 0) + '</span>' +
          '</button>' +
          '<button class="blog-action-link-btn" id="link-btn-sidebar" aria-label="Copy link">' +
            TobUtils.linkIcon() +
          '</button>' +
          (optionsHtml ? optionsHtml : '') +
        '</div>' +
      '</div>' +
      '<div id="comments-section"></div>';

    // Wire actions â€” meta-top buttons
    document.getElementById('like-btn').addEventListener('click', function () { toggleLike(post.id, this); });
    document.getElementById('star-btn').addEventListener('click', function () { toggleStar(post.id, this); });
    document.getElementById('link-btn').addEventListener('click', function () {
      navigator.clipboard.writeText(postUrl).then(function () { TobUtils.showToast('Link copied!'); });
    });

    // Wire sidebar counterparts
    var likeSidebar = document.getElementById('like-btn-sidebar');
    var starSidebar = document.getElementById('star-btn-sidebar');
    var linkSidebar = document.getElementById('link-btn-sidebar');
    if (likeSidebar) likeSidebar.addEventListener('click', function () { toggleLike(post.id, this); });
    if (starSidebar) starSidebar.addEventListener('click', function () { toggleStar(post.id, this); });
    if (linkSidebar) linkSidebar.addEventListener('click', function () {
      navigator.clipboard.writeText(postUrl).then(function () { TobUtils.showToast('Link copied!'); });
    });

    wirePostOptionsMenus();

    renderComments(post.id);
  }

  function closePostOptionsMenus(exceptDropdown) {
    document.querySelectorAll('.post-options-dropdown').forEach(function (dropdown) {
      if (dropdown !== exceptDropdown) dropdown.classList.add('hidden');
    });
  }

  function wirePostOptionsMenus() {
    document.querySelectorAll('.post-options-menu').forEach(function (menu) {
      var optionsBtn = menu.querySelector('.post-options-btn');
      var dropdown = menu.querySelector('.post-options-dropdown');
      var editBtn = menu.querySelector('.edit-post-btn');
      var deleteBtn = menu.querySelector('.delete-post-btn');

      if (optionsBtn && dropdown) {
        optionsBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          closePostOptionsMenus(dropdown);
          dropdown.classList.toggle('hidden');
        });
      }

      if (editBtn && dropdown) {
        editBtn.addEventListener('click', function () {
          dropdown.classList.add('hidden');
          Nav.openComposeModal(currentPost);
        });
      }

      if (deleteBtn && dropdown) {
        deleteBtn.addEventListener('click', function () {
          dropdown.classList.add('hidden');
          document.getElementById('delete-modal').classList.remove('hidden');
        });
      }
    });
  }

  async function renderComments(postId) {
    var container = document.getElementById('comments-section');
    var profile   = await UserProfile.get();
    var myInitial = (profile && profile.username) ? profile.username.charAt(0).toUpperCase() : '?';
    var myImg     = profile ? profile.profile_image_url : null;

    var myAvatarHtml = myImg
      ? '<img src="' + TobUtils.escapeAttr(myImg) + '" alt="">'
      : myInitial;

    container.innerHTML =
      '<h3 class="comments-title">Comments</h3>' +
      '<div class="comment-input-row">' +
        '<div class="comment-input-avatar">' + myAvatarHtml + '</div>' +
        '<div class="comment-input-wrap">' +
          '<input type="text" class="comment-input-field" id="comment-input" autocomplete="off">' +
          '<label class="comment-input-label" id="comment-input-label" for="comment-input">' +
            'Got <em>something</em> to say?' +
          '</label>' +
        '</div>' +
        '<button class="comment-send-btn" id="submit-comment-btn" aria-label="Post comment">' + ICON_SEND + '</button>' +
      '</div>' +
      '<div id="comments-list"></div>';

    var inputEl = document.getElementById('comment-input');
    var labelEl = document.getElementById('comment-input-label');
    function updateLabel() { if (labelEl) labelEl.style.opacity = inputEl.value ? '0' : '1'; }
    inputEl.addEventListener('focus',  function () { if (labelEl) labelEl.style.opacity = '0'; });
    inputEl.addEventListener('blur',   updateLabel);
    inputEl.addEventListener('input',  updateLabel);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(postId); }
    });

    document.getElementById('submit-comment-btn').addEventListener('click', function () { submitComment(postId); });

    loadComments(postId);
  }

  async function loadComments(postId) {
    var listEl = document.getElementById('comments-list');
    listEl.innerHTML = '<div style="padding:0.75rem 0;color:var(--muted);font-size:0.84rem;">Loading\u2026</div>';

    // Fetch comments + which ones the current user has liked â€” parallel.
    var [commentsResult, likedResult] = await Promise.all([
      supabase
        .from('comments')
        .select('*, profiles:profiles!comments_user_id_fkey ( username, display_name, profile_image_url )')
        .eq('post_id', postId)
        .order('created_at', { ascending: true }),
      supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', currentUser.id)
    ]);

    var all = commentsResult.data || [];

    // Build a Set of comment IDs the current user has liked for O(1) lookup.
    var likedCommentIds = new Set(
      (likedResult.data || []).map(function (r) { return r.comment_id; })
    );

    // Aggregate like counts per comment in a single additional query.
    // We fetch counts only for the comments in this post to keep it tight.
    var commentIds = all.map(function (c) { return c.id; });
    var likeCounts = {};  // commentId â†’ count

    if (commentIds.length > 0) {
      var { data: likeCountRows } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .in('comment_id', commentIds);

      (likeCountRows || []).forEach(function (row) {
        likeCounts[row.comment_id] = (likeCounts[row.comment_id] || 0) + 1;
      });
    }

    if (all.length === 0) {
      listEl.innerHTML = '<div style="padding:0.75rem 0;color:var(--muted);font-size:0.84rem;">No comments yet.</div>';
      return;
    }

    var topLevel = all.filter(function (c) { return !c.parent_comment_id; });
    listEl.innerHTML = '';
    topLevel.forEach(function (c) {
      var el = createCommentEl(c, postId, likedCommentIds, likeCounts);
      listEl.appendChild(el);
    });
  }

  function createCommentEl(comment, postId, likedCommentIds, likeCounts) {
    var el       = document.createElement('div');
    el.className = 'comment-item';

    var isOwn      = comment.user_id === currentUser.id;
    var username   = comment.profiles ? comment.profiles.username     : 'unknown';
    var displayName = comment.profiles ? comment.profiles.display_name : null;
    var commentAuthorHtml = renderNameStack(username, displayName, 'comment-author-name');
    var initial    = username.charAt(0).toUpperCase();
    var profileImg = comment.profiles ? comment.profiles.profile_image_url : null;
    var isLiked    = likedCommentIds.has(comment.id);
    var likeCount  = likeCounts[comment.id] || 0;

    var avatarInner = profileImg
      ? '<img src="' + TobUtils.escapeAttr(profileImg) + '" alt="">'
      : TobUtils.escapeHtml(initial);

    var likeCountLabel = likeCount > 0 ? TobUtils.formatCount(likeCount) : '';
    var likeBtnHtml =
      '<button class="comment-like-btn' + (isLiked ? ' liked' : '') + '" ' +
        'data-comment-id="' + comment.id + '" ' +
        'aria-label="Like comment" type="button">' +
        TobUtils.heartIcon(isLiked) +
        '<span class="comment-like-count">' + likeCountLabel + '</span>' +
      '</button>';

    var deleteBtnHtml = isOwn
      ? '<button class="comment-action-btn comment-delete-btn" data-comment-id="' + comment.id + '" aria-label="Delete comment" type="button">' + ICON_DELETE + '</button>'
      : '';

    el.innerHTML =
      '<div class="comment-avatar">' + avatarInner + '</div>' +
      '<div class="comment-body">' +
        '<div class="comment-main">' +
          '<div class="comment-header">' +
            '<a href="/' + encodeURIComponent(username) + '" class="comment-author">' + commentAuthorHtml + '</a>' +
          '</div>' +
          '<p class="comment-text">' + TobUtils.escapeHtml(comment.content) + '</p>' +
        '</div>' +
        '<div class="comment-side-actions">' +
          '<div class="comment-side-top">' +
            '<span class="comment-time">' + TobUtils.getRelativeTime(comment.created_at) + '</span>' +
            deleteBtnHtml +
          '</div>' +
          '<div class="comment-side-bottom">' +
            likeBtnHtml +
          '</div>' +
        '</div>' +
      '</div>';

    var likeBtn = el.querySelector('.comment-like-btn');
    likeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleCommentLike(comment.id, likeBtn);
    });

    var delBtn = el.querySelector('.comment-delete-btn');
    if (delBtn) delBtn.addEventListener('click', function () { deleteComment(comment.id, postId); });

    return el;
  }
  // â”€â”€ Toggle like on a comment â€” optimistic UI update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function toggleCommentLike(commentId, btn) {
    var isLiked    = btn.classList.contains('liked');
    var countEl    = btn.querySelector('.comment-like-count');
    var rawCount   = parseInt(countEl.textContent.replace(/K|M/, function (s) {
      return s === 'K' ? '000' : '000000';
    })) || 0;

    // Optimistic update
    if (isLiked) {
      btn.classList.remove('liked');
      btn.innerHTML = TobUtils.heartIcon(false) + '<span class="comment-like-count">' + (rawCount > 1 ? TobUtils.formatCount(rawCount - 1) : '') + '</span>';
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUser.id);
    } else {
      btn.classList.add('liked');
      btn.innerHTML = TobUtils.heartIcon(true) + '<span class="comment-like-count">' + TobUtils.formatCount(rawCount + 1) + '</span>';
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUser.id });
    }
  }

  async function submitComment(postId) {
    var inputEl = document.getElementById('comment-input');
    var content = inputEl.value.trim();
    if (!content) return;
    var { error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentUser.id, content: content });
    if (error) { TobUtils.showToast('Error posting comment.'); return; }
    inputEl.value = '';
    var labelEl = document.getElementById('comment-input-label');
    if (labelEl) labelEl.style.opacity = '1';
    TobUtils.showToast('Comment posted!');
    loadComments(postId);
  }

  async function deleteComment(commentId, postId) {
    var modal = document.getElementById('comment-delete-modal');
    var confirmBtn = document.getElementById('comment-delete-confirm-btn');
    modal.classList.remove('hidden');
    var newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', async function () {
      modal.classList.add('hidden');
      await supabase.from('comments').delete().eq('id', commentId);
      TobUtils.showToast('Comment deleted.');
      loadComments(postId);
    });
  }

  // â”€â”€ Sync helpers: update every instance of the like/star button at once â”€â”€
  function syncLikeUI(liked, count) {
    ['like-btn', 'like-btn-sidebar'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      if (liked) btn.classList.add('liked'); else btn.classList.remove('liked');
      btn.innerHTML = TobUtils.heartIcon(liked) + '<span>' + TobUtils.formatCount(count) + '</span>';
    });
  }

  function syncStarUI(starred, count) {
    ['star-btn', 'star-btn-sidebar'].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      if (starred) btn.classList.add('starred'); else btn.classList.remove('starred');
      btn.innerHTML = TobUtils.starIcon(starred) + '<span>' + TobUtils.formatCount(count) + '</span>';
    });
  }

  async function toggleLike(postId, btn) {
    var isLiked  = btn.classList.contains('liked');
    var countEl  = btn.querySelector('span');
    var rawCount = parseFormattedCount(countEl ? countEl.textContent : '0');
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      syncLikeUI(false, Math.max(0, rawCount - 1));
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUser.id });
      syncLikeUI(true, rawCount + 1);
    }
  }

  async function toggleStar(postId, btn) {
    var isStarred = btn.classList.contains('starred');
    var countEl   = btn.querySelector('span');
    var rawCount  = parseFormattedCount(countEl ? countEl.textContent : '0');
    if (isStarred) {
      await supabase.from('stars').delete().eq('post_id', postId).eq('user_id', currentUser.id);
      syncStarUI(false, Math.max(0, rawCount - 1));
    } else {
      await supabase.from('stars').insert({ post_id: postId, user_id: currentUser.id });
      syncStarUI(true, rawCount + 1);
    }
  }

  function parseFormattedCount(str) {
    if (!str) return 0;
    str = str.trim();
    if (str.endsWith('M')) return parseFloat(str) * 1000000;
    if (str.endsWith('K')) return parseFloat(str) * 1000;
    return parseInt(str) || 0;
  }

  function setupDeleteModal() {
    document.getElementById('delete-cancel-btn').addEventListener('click', function () {
      document.getElementById('delete-modal').classList.add('hidden');
    });
    document.getElementById('delete-confirm-btn').addEventListener('click', async function () {
      if (!currentPost) return;
      await supabase.from('likes').delete().eq('post_id', currentPost.id);
      await supabase.from('stars').delete().eq('post_id', currentPost.id);
      await supabase.from('posts').delete().eq('id', currentPost.id);
      window.location.href = '/feed';
    });
    document.getElementById('comment-delete-cancel-btn').addEventListener('click', function () {
      document.getElementById('comment-delete-modal').classList.add('hidden');
    });
  }

  function renderNotFound() {
    document.getElementById('blog-content').innerHTML =
      '<div class="empty-state"><p>Post not found. <a href="/feed" style="color:var(--accent);">Go back to feed</a>.</p></div>';
  }

  function setupLightbox() {
    var overlay = document.createElement('div');
    overlay.id = 'img-lightbox';
    overlay.className = 'img-lightbox hidden';
    overlay.innerHTML =
      '<div class="img-lightbox-backdrop"></div>' +
      '<div class="img-lightbox-img-wrap">' +
        '<button class="img-lightbox-close" aria-label="Close">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<img id="img-lightbox-img" src="" alt="">' +
      '</div>';
    document.body.appendChild(overlay);

    function openLightbox(src) {
      document.getElementById('img-lightbox-img').src = src;
      overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() { overlay.classList.add('hidden'); document.body.style.overflow = ''; }

    document.getElementById('blog-content').addEventListener('click', function (e) {
      var img = e.target.closest('.blog-detail-image');
      if (img) { e.preventDefault(); openLightbox(img.src); }
    });
    overlay.querySelector('.img-lightbox-backdrop').addEventListener('click', closeLightbox);
    overlay.querySelector('.img-lightbox-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
  }

  window.addEventListener('supabaseReady', init, { once: true });
})();
