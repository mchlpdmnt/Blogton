// ─────────────────────────────────────────────
// modules/composeModal.js
// Create / Edit post modal.
//
// Desktop: floating centered dialog (max-width 1200px).
// Clicking outside or pressing Escape triggers a
// "Discard draft?" confirmation overlay (injected inside
// the compose backdrop itself, z-index layered on top).
// If the draft is blank, it closes directly — no prompt.
//
// Browser refresh / tab-close / navigation away while a
// dirty draft is open fires the native beforeunload prompt.
// The handler is registered on open() and torn down on close().
//
// Styles are injected via <style> in inject() so the
// module is self-contained and cache-proof.
//
// Usage:
//   ComposeModal.inject(body)         — call once inside Nav.render()
//   ComposeModal.open(postData?)      — null/undefined = create mode
//                                       { id, title, content, image_url } = edit mode
//   ComposeModal.close()              — programmatic close
// ─────────────────────────────────────────────
window.ComposeModal = (function () {
  'use strict';

  var _uploadedImagePath  = null;
  var _composeUser        = null;
  var _editingPostId      = null;
  var _isOpen             = false;

  // ── beforeunload: warn on browser refresh / tab-close ──────────────────
  // Stored so we can remove the exact same function reference on close().
  function _beforeUnloadHandler(e) {
    if (!_isOpen || !_isDirty()) return;
    e.preventDefault();
    // Modern browsers require returnValue to be set (the string is ignored).
    e.returnValue = '';
  }

  function _registerBeforeUnload() {
    window.addEventListener('beforeunload', _beforeUnloadHandler);
  }

  function _unregisterBeforeUnload() {
    window.removeEventListener('beforeunload', _beforeUnloadHandler);
  }

  // ── Returns true when there is content worth losing ─────────────────────
  function _isDirty() {
    var titleVal   = (document.getElementById('compose-title')   || {}).value || '';
    var contentVal = (document.getElementById('compose-content') || {}).value || '';
    return !!(titleVal.trim() || contentVal.trim() || _uploadedImagePath);
  }

  // ── Inject critical styles (self-contained, cache-proof) ──────────────
  function _injectStyles() {
    if (document.getElementById('compose-modal-styles')) return;
    var style = document.createElement('style');
    style.id = 'compose-modal-styles';
    style.textContent = [
      // ── Backdrop: dimmed overlay covering the whole viewport ──
      '.compose-modal-backdrop {',
      '  position: fixed; inset: 0; z-index: 900;',
      '  background: rgba(0,0,0,0.45);',
      '  backdrop-filter: blur(3px);',
      '  -webkit-backdrop-filter: blur(3px);',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 2rem;',
      '  animation: cmb-in 0.2s ease;',
      '}',
      '.compose-modal-backdrop.hidden { display: none !important; }',
      '@keyframes cmb-in { from { opacity: 0; } to { opacity: 1; } }',

      // ── Modal box ──
      '.compose-modal {',
      '  position: relative;',
      '  background: var(--bg);',
      '  border: 1px solid var(--border);',
      '  border-radius: 18px;',
      '  width: 100%; max-width: 1200px;',
      '  max-height: 88vh; min-height: 520px;',
      '  overflow: hidden;',
      '  display: flex; flex-direction: column;',
      '  box-shadow: 0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1);',
      '  animation: cm-in 0.28s cubic-bezier(0.22,1,0.36,1);',
      '}',
      '@keyframes cm-in {',
      '  from { opacity: 0; transform: translateY(20px) scale(0.97); }',
      '  to   { opacity: 1; transform: translateY(0) scale(1); }',
      '}',

      // ── Cancel confirm overlay (inside modal, on top of form) ──
      '.compose-confirm-overlay {',
      '  position: absolute; inset: 0; z-index: 10;',
      '  background: rgba(0,0,0,0.45);',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 1.5rem;',
      '  border-radius: 18px;',
      '  animation: cmb-in 0.15s ease;',
      '}',
      '.compose-confirm-overlay.hidden { display: none !important; }',

      '.compose-confirm-box {',
      '  background: var(--bg);',
      '  border: 1px solid var(--border);',
      '  border-radius: 16px;',
      '  padding: 2rem 2rem 1.5rem;',
      '  max-width: 340px; width: 100%;',
      '  box-shadow: 0 16px 48px rgba(0,0,0,0.2);',
      '  animation: cm-in 0.2s cubic-bezier(0.22,1,0.36,1);',
      '}',
      '.compose-confirm-box h3 {',
      '  font-family: var(--serif); font-size: 1.25rem;',
      '  font-weight: 500; color: var(--fg); margin-bottom: 0.4rem;',
      '}',
      '.compose-confirm-box p {',
      '  font-size: 0.875rem; color: var(--muted);',
      '  line-height: 1.6; margin-bottom: 1.5rem;',
      '}',
      '.compose-confirm-actions {',
      '  display: flex; gap: 0.65rem; justify-content: flex-end;',
      '}',
      '.compose-confirm-keep {',
      '  padding: 0.5rem 1.1rem;',
      '  border: 1px solid var(--border); border-radius: 999px;',
      '  background: none; color: var(--fg);',
      '  font-family: var(--sans); font-size: 0.84rem;',
      '  cursor: pointer; transition: background 0.15s;',
      '}',
      '.compose-confirm-keep:hover { background: var(--surface); }',
      '.compose-confirm-discard {',
      '  padding: 0.5rem 1.1rem;',
      '  border: none; border-radius: 999px;',
      '  background: #c0392b; color: #fff;',
      '  font-family: var(--sans); font-size: 0.84rem; font-weight: 500;',
      '  cursor: pointer; transition: opacity 0.15s;',
      '}',
      '.compose-confirm-discard:hover { opacity: 0.85; }',

      // ── Mobile: full-screen sheet rising from bottom over navbar ──
      '@media (max-width: 680px) {',
      '  .compose-modal-backdrop {',
      '    padding: 0; align-items: flex-end;',
      '    animation: none;',
      '  }',
      '  .compose-modal {',
      '    max-width: 100%; width: 100%;',
      '    height: 100dvh; max-height: 100dvh;',
      '    border-radius: 0;',
      '    animation: cm-rise 0.38s cubic-bezier(0.22, 1, 0.36, 1);',
      '  }',
      '  @keyframes cm-rise {',
      '    from { transform: translateY(100%); opacity: 0.6; }',
      '    to   { transform: translateY(0);    opacity: 1;   }',
      '  }',
      '  .compose-confirm-overlay { border-radius: 0; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Inject modal DOM into <body> (called once by Nav.render) ──────────
  function inject(body) {
    _injectStyles();

    var backdrop = document.createElement('div');
    backdrop.id        = 'compose-modal-backdrop';
    backdrop.className = 'compose-modal-backdrop hidden';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', 'Write a post');

    // Confirm overlay is a child of .compose-modal so it layers on top of the form.
    backdrop.innerHTML =
      '<div class="compose-modal" id="compose-modal">' +

        // ── Discard confirm overlay (hidden by default) ──
        '<div class="compose-confirm-overlay hidden" id="compose-confirm-overlay">' +
          '<div class="compose-confirm-box">' +
            '<h3>Discard draft?</h3>' +
            '<p>Your writing will be lost if you leave now.</p>' +
            '<div class="compose-confirm-actions">' +
              '<button class="compose-confirm-keep" id="compose-confirm-keep" type="button">Keep writing</button>' +
              '<button class="compose-confirm-discard" id="compose-confirm-discard" type="button">Discard</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="compose-error hidden" id="compose-error"></div>' +
        '<div class="compose-modal-header">' +
          '<button class="compose-modal-close" id="compose-modal-close" aria-label="Cancel" type="button">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            'Cancel' +
          '</button>' +
          '<h2 class="compose-modal-title" id="compose-modal-title">Write a <em>Blog</em></h2>' +
          '<button class="compose-publish-btn" id="compose-publish-btn" type="button">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            'Publish' +
          '</button>' +
        '</div>' +
        '<div class="compose-form" id="compose-form">' +
          '<div class="compose-col-left">' +
            '<label class="compose-label" for="compose-title">Blog Title</label>' +
            '<input type="text" id="compose-title" class="compose-input" placeholder="Give your blog a title" maxlength="200" autocomplete="off">' +
            '<label class="compose-label" for="compose-content">Blog Content</label>' +
            '<textarea id="compose-content" class="compose-textarea" placeholder="Write your blog\u2026"></textarea>' +
          '</div>' +
          '<div class="compose-col-right">' +
            '<label class="compose-label">Image <span class="compose-label-note">(up to 10MB)</span></label>' +
            '<div id="compose-upload-zone" class="compose-upload-zone">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
              '<span>Click or drag to upload<br>a cover image</span>' +
            '</div>' +
            '<input type="file" id="compose-image-input" accept="image/*" style="display:none;">' +
            '<div id="compose-image-wrapper" class="compose-image-wrapper" style="display:none;">' +
              '<img id="compose-image-preview" class="compose-image-preview" alt="Cover preview">' +
              '<button type="button" id="compose-remove-img" class="compose-remove-img" aria-label="Remove image">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    body.appendChild(backdrop);

    // ── Clicking the dimmed backdrop area (outside the modal box) ─────────
    // e.target === backdrop means the click landed on the backdrop itself,
    // not on any child element (the modal box or its children).
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) _requestClose();
    });

    // ── Cancel button ─────────────────────────────────────────────────────
    document.getElementById('compose-modal-close').addEventListener('click', _requestClose);

    // ── Keyboard: Escape ──────────────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var overlay     = document.getElementById('compose-confirm-overlay');
      var confirmOpen = overlay && !overlay.classList.contains('hidden');
      if (confirmOpen) {
        _hideConfirm();       // Escape on confirm = "keep writing"
      } else if (_isOpen) {
        _requestClose();
      }
    });

    // ── Confirm overlay buttons ───────────────────────────────────────────
    document.getElementById('compose-confirm-keep').addEventListener('click', _hideConfirm);
    document.getElementById('compose-confirm-discard').addEventListener('click', function () {
      _hideConfirm();
      close();
    });

    _wireImageUpload();
    document.getElementById('compose-publish-btn').addEventListener('click', _handlePublish);
  }

  // ── Show confirm overlay if there is a draft worth losing ─────────────
  function _requestClose() {
    if (_isDirty()) {
      var overlay = document.getElementById('compose-confirm-overlay');
      if (overlay) overlay.classList.remove('hidden');
    } else {
      close();
    }
  }

  function _hideConfirm() {
    var overlay = document.getElementById('compose-confirm-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // ── Open the modal (create or edit mode) ─────────────────────────────
  function open(postData) {
    var backdrop = document.getElementById('compose-modal-backdrop');
    var titleEl  = document.getElementById('compose-modal-title');
    var pubBtn   = document.getElementById('compose-publish-btn');
    if (!backdrop) return;

    if (postData && postData.id) {
      _editingPostId = postData.id;
      if (titleEl) titleEl.innerHTML = 'Edit <em>Post</em>';
      if (pubBtn)  pubBtn.textContent = 'Update';

      var fTitle   = document.getElementById('compose-title');
      var fContent = document.getElementById('compose-content');
      var fPreview = document.getElementById('compose-image-preview');
      var fZone    = document.getElementById('compose-upload-zone');

      if (fTitle)   fTitle.value   = postData.title   || '';
      if (fContent) fContent.value = postData.content  || '';

      if (postData.image_url) {
        _uploadedImagePath = postData.image_url;
        var fWrapper = document.getElementById('compose-image-wrapper');
        if (fPreview) { fPreview.src = postData.image_url; }
        if (fZone)    fZone.style.display    = 'none';
        if (fWrapper) fWrapper.style.display = 'block';
      }
    } else {
      _editingPostId = null;
      if (titleEl) titleEl.innerHTML = 'Write a <em>Blog</em>';
      if (pubBtn)  pubBtn.textContent = 'Publish';
    }

    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    _isOpen = true;

    // Register browser-level guard — fires on refresh, tab close, or
    // any navigation that bypasses our JS (e.g. typing a URL directly).
    _registerBeforeUnload();

    var inputTitle = document.getElementById('compose-title');
    if (inputTitle) setTimeout(function () { inputTitle.focus(); }, 80);

    Auth.getSession().then(function (session) {
      _composeUser = session && session.user ? session.user : null;
    }).catch(function () {});
  }

  // ── Close and reset ──────────────────────────────────────────────────
  function close() {
    var backdrop = document.getElementById('compose-modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
    document.body.style.overflow = '';
    _isOpen = false;

    // Always tear down the beforeunload guard when the modal closes.
    _unregisterBeforeUnload();

    _reset();
  }

  function _reset() {
    var titleEl    = document.getElementById('compose-title');
    var contentEl  = document.getElementById('compose-content');
    var errorEl    = document.getElementById('compose-error');
    var zone       = document.getElementById('compose-upload-zone');
    var wrapper    = document.getElementById('compose-image-wrapper');
    var preview    = document.getElementById('compose-image-preview');
    var fileInput  = document.getElementById('compose-image-input');
    var pubBtn     = document.getElementById('compose-publish-btn');
    var modalTitle = document.getElementById('compose-modal-title');
    var overlay    = document.getElementById('compose-confirm-overlay');

    if (titleEl)    titleEl.value    = '';
    if (contentEl)  contentEl.value  = '';
    if (errorEl)    { errorEl.textContent = ''; errorEl.classList.add('hidden'); }
    if (zone)       zone.style.display    = '';
    if (wrapper)    wrapper.style.display = 'none';
    if (preview)    preview.src = '';
    if (fileInput)  fileInput.value = '';
    if (pubBtn)     { pubBtn.disabled = false; pubBtn.textContent = 'Publish'; }
    if (modalTitle) modalTitle.innerHTML = 'Write a <em>Blog</em>';
    if (overlay)    overlay.classList.add('hidden');  // always re-hide confirm on reset

    _uploadedImagePath = null;
    _editingPostId     = null;
  }

  function _wireImageUpload() {
    var zone      = document.getElementById('compose-upload-zone');
    var fileInput = document.getElementById('compose-image-input');
    var preview   = document.getElementById('compose-image-preview');
    var wrapper   = document.getElementById('compose-image-wrapper');

    if (!zone || !fileInput) return;

    zone.addEventListener('click', function () { fileInput.click(); });
    zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', function () { zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (e.dataTransfer.files.length) _handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function () {
      if (fileInput.files.length) _handleFile(fileInput.files[0]);
    });

    var removeBtn = document.getElementById('compose-remove-img');
    if (removeBtn) {
      removeBtn.addEventListener('click', function () {
        _uploadedImagePath = null;
        if (preview)   { preview.src = ''; }
        if (wrapper)   wrapper.style.display = 'none';
        if (zone)      zone.style.display = '';
        if (fileInput) fileInput.value = '';
      });
    }
  }

  async function _handleFile(file) {
    var zone      = document.getElementById('compose-upload-zone');
    var preview   = document.getElementById('compose-image-preview');
    var wrapper   = document.getElementById('compose-image-wrapper');

    if (!file.type.startsWith('image/')) { _showError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024)   { _showError('Image must be under 10 MB.');     return; }

    var reader = new FileReader();
    reader.onload = function (e) {
      if (preview)   { preview.src = e.target.result; }
      if (wrapper)   wrapper.style.display = 'block';
      if (zone)      zone.style.display = 'none';
    };
    reader.readAsDataURL(file);

    if (!_composeUser) {
      var session = await Auth.getSession();
      _composeUser = session && session.user ? session.user : null;
    }
    if (!_composeUser) { _showError('Not authenticated.'); return; }

    var ext  = file.name.split('.').pop();
    var path = 'covers/' + _composeUser.id + '/' + Date.now() + '.' + ext;
    var { error } = await supabase.storage.from('blog-images').upload(path, file, { cacheControl: '3600', upsert: true });

    if (error) {
      _showError('Image upload failed. Please try again.');
      if (wrapper)   wrapper.style.display = 'none';
      if (preview)   preview.src = '';
      if (zone)      zone.style.display = '';
      return;
    }

    var { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(path);
    _uploadedImagePath = urlData.publicUrl;
  }

  async function _handlePublish() {
    var titleEl   = document.getElementById('compose-title');
    var contentEl = document.getElementById('compose-content');
    var pubBtn    = document.getElementById('compose-publish-btn');

    var title   = titleEl   ? titleEl.value.trim()   : '';
    var content = contentEl ? contentEl.value.trim() : '';

    if (!title || !content) { _showError('Title and content are required.'); return; }

    if (!_composeUser) {
      var session = await Auth.getSession();
      _composeUser = session && session.user ? session.user : null;
    }
    if (!_composeUser) { _showError('You must be logged in to publish.'); return; }

    pubBtn.disabled    = true;
    pubBtn.textContent = _editingPostId ? 'Updating\u2026' : 'Publishing\u2026';

    var payload = {
      title:     title,
      content:   content,
      image_url: _uploadedImagePath || null,
      author_id: _composeUser.id
    };

    var result, postId;

    if (_editingPostId) {
      result = await supabase.from('posts').update(payload).eq('id', _editingPostId);
      postId = _editingPostId;
    } else {
      result = await supabase.from('posts').insert(payload).select('id').single();
      postId = result.data ? result.data.id : null;
    }

    if (result.error) {
      _showError('Something went wrong. Please try again.');
      pubBtn.disabled    = false;
      pubBtn.textContent = _editingPostId ? 'Update' : 'Publish';
      return;
    }

    // Successful publish — close cleanly without the beforeunload prompt.
    close();
    TobUtils.showToast(_editingPostId ? 'Post updated!' : 'Post published!');
    setTimeout(function () { window.location.href = '/blog?id=' + postId; }, 800);
  }

  function _showError(msg) {
    var el = document.getElementById('compose-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  return { inject: inject, open: open, close: close };
})();