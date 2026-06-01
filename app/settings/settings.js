// ─────────────────────────────────────────────
// pages/settings.js  —  Continuous Scroll Layout
//
// Structure:
//   Header card  (avatar · name · username · email)
//   ── PROFILE ─────────────────────────────────
//     Name
//     Profile Avatar
//     Profile Banner
//     About Me
//   ── ACCOUNT ─────────────────────────────────
//     Username   ← moved here from Profile
//     Change Email
//     Change Password
//     Log Out
//   ── DANGER ZONE ─────────────────────────────
//     Delete Account
//
// Appearance section intentionally removed —
// theme control lives in the nav floating settings.
// ─────────────────────────────────────────────
(function () {
  'use strict';

  var currentUser    = null;
  var currentProfile = null;

  async function init() {
    var session = await Auth.requireAuth();
    if (!session) return;
    history.replaceState(null, '', '/settings');
    currentUser    = session.user;
    currentProfile = await UserProfile.get();
    Nav.render('');

    var mobileBack = document.getElementById('settings-back-btn');
    if (mobileBack) {
      mobileBack.addEventListener('click', function () {
        if (history.length > 1) { history.back(); }
        else { window.location.href = '/feed'; }
      });
    }

    setupSettingsModals();
    renderSettings();
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  function renderSettings() {
    var container  = document.getElementById('settings-content');
    if (!container) {
      // DOM mismatch — likely bfcache restored the wrong page. Force reload.
      window.location.reload();
      return;
    }
    var p          = currentProfile;
    var initial    = (p.username || '?').charAt(0).toUpperCase();
    var displayName = p.display_name || p.username || '';
    var userEmail  = currentUser.email || '';

    var avatarHtml = p.profile_image_url
      ? '<img src="' + TobUtils.escapeAttr(p.profile_image_url) + '" alt="Avatar" class="sh-avatar-img">'
      : '<div class="sh-avatar-placeholder">' + TobUtils.escapeHtml(initial) + '</div>';

    container.innerHTML =

      // ── Summary header card ──────────────────────────────────────────────
      '<div class="sh-header-card">' +
        '<div class="sh-header-left">' +
          '<div class="sh-avatar">' + avatarHtml + '</div>' +
          '<div class="sh-header-info">' +
            '<p class="sh-display-name">' + TobUtils.escapeHtml(displayName) + '</p>' +
            '<p class="sh-username">@' + TobUtils.escapeHtml(p.username || '') + '</p>' +
            '<p class="sh-email">' + TobUtils.escapeHtml(userEmail) + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="sh-header-right">' +
          '<button class="sh-logout-btn" id="sh-logout-btn" title="Log out" aria-label="Log out">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="19" height="19" fill="currentColor">' +
              '<path d="m8 12c3.309 0 6-2.691 6-6s-2.691-6-6-6-6 2.691-6 6 2.691 6 6 6zm0-9c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3zm2 12.5c0 .829-.672 1.5-1.5 1.5-3.032 0-5.5 2.467-5.5 5.5 0 .829-.672 1.5-1.5 1.5s-1.5-.671-1.5-1.5c0-4.687 3.813-8.5 8.5-8.5.828 0 1.5.671 1.5 1.5zm8 7c0 .829-.672 1.5-1.5 1.5h-1c-1.93 0-3.5-1.57-3.5-3.5v-6c0-1.93 1.57-3.5 3.5-3.5h1c.828 0 1.5.671 1.5 1.5s-.672 1.5-1.5 1.5h-1c-.275 0-.5.224-.5.5v6c0 .276.225.5.5.5h1c.828 0 1.5.671 1.5 1.5zm5.479-3.816-2.738 2.414c-.677.597-1.741.116-1.741-.786v-1.312h-1.5c-.828 0-1.5-.671-1.5-1.5s.672-1.5 1.5-1.5h1.5v-1.194c0-.902 1.064-1.383 1.741-.786l2.738 2.414c.695.601.695 1.649 0 2.25z"/>' +
            '</svg>' +
          '</button>' +
        '</div>' +
      '</div>' +

      // ════════════════════════════════════════════════════════════════
      //  PROFILE GROUP
      // ════════════════════════════════════════════════════════════════
      '<div class="settings-group">' +
        '<p class="settings-group-label">Profile</p>' +

        // ── Name ─────────────────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">Profile Name</p>' +
          '<div class="settings-field">' +
            '<input type="text" id="display-name-input" value="' +
              TobUtils.escapeAttr(p.display_name || '') +
              '" maxlength="60" placeholder="Your display name">' +
          '</div>' +
          '<div class="settings-action">' +
            '<button class="btn btn-accent" id="save-display-name-btn">Save</button>' +
          '</div>' +
        '</div>' +

        // ── Profile Avatar ───────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">Profile Avatar</p>' +
          '<div class="profile-image-section">' +
            '<div class="current-profile-image">' +
              (p.profile_image_url
                ? '<img src="' + TobUtils.escapeAttr(p.profile_image_url) + '" alt="Avatar">'
                : '<div class="profile-avatar-placeholder">' + TobUtils.escapeHtml(initial) + '</div>') +
            '</div>' +
            '<div class="profile-image-controls">' +
              '<input type="file" id="profile-image-input" accept="image/*" style="display:none;">' +
              '<button class="btn btn-outline" id="upload-profile-image-btn">Upload Image</button>' +
              (p.profile_image_url
                ? '<button class="btn-icon-ghost" id="remove-profile-image-btn" title="Remove avatar">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>' +
                  '</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +

        // ── Profile Banner ───────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">Profile Banner</p>' +
          '<div class="cover-image-section">' +
            '<div class="current-cover-image">' +
              (p.cover_image_url
                ? '<img src="' + TobUtils.escapeAttr(p.cover_image_url) + '" alt="Cover">'
                : '<div class="cover-placeholder"></div>') +
            '</div>' +
            '<div class="cover-image-controls">' +
              '<input type="file" id="cover-image-input" accept="image/*" style="display:none;">' +
              '<button class="btn btn-outline" id="upload-cover-image-btn">Upload Image</button>' +
              (p.cover_image_url
                ? '<button class="btn-icon-ghost cover-remove-btn" id="remove-cover-image-btn" title="Remove banner">' +
                    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>' +
                  '</button>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +

        // ── About Me ─────────────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">About Me</p>' +
          '<div class="settings-field" style="margin-top:0.65rem;">' +
            '<textarea id="bio-input" maxlength="500" placeholder="Tell people a bit about yourself...">' +
              TobUtils.escapeHtml(p.bio || '') +
            '</textarea>' +
          '</div>' +
          '<div class="settings-action">' +
            '<button class="btn btn-accent" id="save-bio-btn">Save Bio</button>' +
          '</div>' +
        '</div>' +

      '</div>' + // end Profile group

      // ════════════════════════════════════════════════════════════════
      //  ACCOUNT GROUP
      // ════════════════════════════════════════════════════════════════
      '<div class="settings-group">' +
        '<p class="settings-group-label">Account</p>' +

        // ── Username ─────────────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">Username</p>' +
          '<p class="settings-description">Letters, numbers, and underscores only. 3–20 characters.</p>' +
          '<div class="settings-field">' +
            '<input type="text" id="username-input" value="' +
              TobUtils.escapeAttr(p.username || '') +
              '" minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" placeholder="username">' +
          '</div>' +
          '<div class="settings-action">' +
            '<button class="btn btn-accent" id="update-username-btn">Save Username</button>' +
          '</div>' +
        '</div>' +

        // ── Change Email ──────────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">Change Email</p>' +
          '<p class="settings-description">A confirmation link will be sent to the new address. ' +
            'Current: <strong>' + TobUtils.escapeHtml(userEmail) + '</strong></p>' +
          '<div class="settings-action">' +
            '<button class="btn btn-outline" id="update-email-btn">Change Email</button>' +
          '</div>' +
        '</div>' +

        // ── Change Password ───────────────────────────────────────────
        '<div class="settings-section--card">' +
          '<p class="settings-section-title">Change Password</p>' +
          '<p class="settings-description">Requires your current password first. New passwords must be at least 8 characters.</p>' +
          '<div class="settings-action">' +
            '<button class="btn btn-outline" id="update-password-btn">Change Password</button>' +
          '</div>' +
        '</div>' +

      '</div>' + // end Account group

      // ════════════════════════════════════════════════════════════════
      //  DANGER ZONE
      // ════════════════════════════════════════════════════════════════
      '<div class="settings-danger-wrap">' +
        '<p class="settings-danger-label">Danger Zone</p>' +
        '<div class="settings-danger-card">' +
          '<p class="settings-section-title settings-section-title--danger">Delete Account</p>' +
          '<p class="settings-description">' +
            'Permanently removes your account, posts, comments, and all profile data. This cannot be undone.' +
          '</p>' +
          '<button class="btn-danger-outline" id="delete-account-btn">Delete my account</button>' +
        '</div>' +
      '</div>';

    wireListeners();
  }

  // ─── Wire ─────────────────────────────────────────────────────────────────
  function wireListeners() {
    // Avatar
    var profileInput = document.getElementById('profile-image-input');
    var uploadAvatar = document.getElementById('upload-profile-image-btn');
    var removeAvatar = document.getElementById('remove-profile-image-btn');
    if (uploadAvatar) uploadAvatar.addEventListener('click', function () { profileInput.click(); });
    if (profileInput) profileInput.addEventListener('change', function (e) { doUpload(e, 'profile'); });
    if (removeAvatar) removeAvatar.addEventListener('click', function () { doRemove('profile'); });

    // Cover
    var coverInput  = document.getElementById('cover-image-input');
    var uploadCover = document.getElementById('upload-cover-image-btn');
    var removeCover = document.getElementById('remove-cover-image-btn');
    if (uploadCover) uploadCover.addEventListener('click', function () { coverInput.click(); });
    if (coverInput)  coverInput.addEventListener('change', function (e) { doUpload(e, 'cover'); });
    if (removeCover) removeCover.addEventListener('click', function () { doRemove('cover'); });

    // Display name
    var saveDisplayNameBtn = document.getElementById('save-display-name-btn');
    if (saveDisplayNameBtn) saveDisplayNameBtn.addEventListener('click', doSaveDisplayName);

    // Bio
    var saveBioBtn = document.getElementById('save-bio-btn');
    if (saveBioBtn) saveBioBtn.addEventListener('click', doSaveBio);

    var bioInput = document.getElementById('bio-input');
    if (bioInput) {
      bioInput.addEventListener('input', function () {
        var pos = bioInput.selectionStart;
        var sanitized = bioInput.value.replace(/\n{3,}/g, '\n\n');
        if (sanitized !== bioInput.value) {
          bioInput.value = sanitized;
          bioInput.setSelectionRange(pos, pos);
        }
      });
    }

    // Username
    var updateUsernameBtn = document.getElementById('update-username-btn');
    if (updateUsernameBtn) updateUsernameBtn.addEventListener('click', doUpdateUsername);

    // Email
    var updateEmailBtn = document.getElementById('update-email-btn');
    if (updateEmailBtn) updateEmailBtn.addEventListener('click', function () { openSettingsModal('settings-email-modal', 'modal-current-password-email'); });

    // Password
    var updatePasswordBtn = document.getElementById('update-password-btn');
    if (updatePasswordBtn) updatePasswordBtn.addEventListener('click', function () { openSettingsModal('settings-password-modal', 'modal-current-password-change'); });

    // Log Out (header card icon)
    var shLogoutBtn = document.getElementById('sh-logout-btn');
    if (shLogoutBtn) shLogoutBtn.addEventListener('click', function () { openSettingsModal('settings-logout-modal'); });

    // Delete account
    var deleteAccountBtn = document.getElementById('delete-account-btn');
    if (deleteAccountBtn) deleteAccountBtn.addEventListener('click', function () { openSettingsModal('settings-delete-password-modal', 'modal-delete-password'); });
  }

  function setupSettingsModals() {
    var modalIds = [
      'settings-logout-modal',
      'settings-email-modal',
      'settings-password-modal',
      'settings-delete-password-modal',
      'settings-delete-username-modal',
    ];

    modalIds.forEach(function (id) {
      var modal = document.getElementById(id);
      if (!modal || modal.dataset.wired === 'true') return;
      modal.dataset.wired = 'true';
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeSettingsModal(id);
      });
    });

    wireClick('logout-cancel-btn', function () { closeSettingsModal('settings-logout-modal'); });
    wireClick('logout-confirm-btn', async function () {
      var btn = document.getElementById('logout-confirm-btn');
      setButtonBusy(btn, true, 'Logging out...');
      await Auth.logOut();
    });

    wireClick('email-cancel-btn', function () { closeSettingsModal('settings-email-modal'); });
    wireSubmit('settings-email-form', doUpdateEmail);

    wireClick('password-cancel-btn', function () { closeSettingsModal('settings-password-modal'); });
    wireSubmit('settings-password-form', doUpdatePassword);

    wireClick('delete-password-cancel-btn', function () { closeSettingsModal('settings-delete-password-modal'); });
    wireSubmit('settings-delete-password-form', doConfirmDeletePassword);

    wireClick('delete-username-cancel-btn', function () { closeSettingsModal('settings-delete-username-modal'); });
    wireSubmit('settings-delete-username-form', doDeleteAccount);

    if (!document.body.dataset.settingsModalEscapeWired) {
      document.body.dataset.settingsModalEscapeWired = 'true';
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var openModal = document.querySelector('.settings-modal-backdrop:not(.hidden)');
        if (openModal) closeSettingsModal(openModal.id);
      });
    }
  }

  function wireClick(id, handler) {
    var el = document.getElementById(id);
    if (!el || el.dataset.wired === 'true') return;
    el.dataset.wired = 'true';
    el.addEventListener('click', handler);
  }

  function wireSubmit(id, handler) {
    var form = document.getElementById(id);
    if (!form || form.dataset.wired === 'true') return;
    form.dataset.wired = 'true';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      handler();
    });
  }

  function isMobileView() {
    return window.innerWidth <= 768;
  }

  function openSettingsModal(id, focusId) {
    var modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (isMobileView()) {
      var inner = modal.querySelector('.settings-modal');
      if (inner) {
        inner.classList.remove('is-falling');
        void inner.offsetWidth; // force reflow so animation restarts cleanly
        inner.classList.add('is-rising');
        inner.addEventListener('animationend', function () {
          inner.classList.remove('is-rising');
        }, { once: true });
      }
    }

    if (focusId) {
      setTimeout(function () {
        var focusEl = document.getElementById(focusId);
        if (focusEl) focusEl.focus();
      }, 60);
    }
  }

  function closeSettingsModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;

    if (isMobileView()) {
      var inner = modal.querySelector('.settings-modal');
      if (inner) {
        inner.classList.remove('is-rising');
        void inner.offsetWidth; // force reflow
        inner.classList.add('is-falling');
        inner.addEventListener('animationend', function () {
          inner.classList.remove('is-falling');
          modal.classList.add('hidden');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
          resetModalInputs(modal);
        }, { once: true });
        return;
      }
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    resetModalInputs(modal);
  }

  function resetModalInputs(modal) {
    modal.querySelectorAll('input').forEach(function (input) {
      input.value = '';
    });
  }

  function setButtonBusy(btn, busy, text) {
    if (!btn) return;
    if (busy) {
      btn.dataset.originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = text;
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || text;
      delete btn.dataset.originalText;
    }
  }

  async function verifyCurrentPassword(password) {
    if (!currentUser || !currentUser.email) {
      return { error: 'Could not verify this account email.' };
    }
    if (!password) {
      return { error: 'Enter your current password.' };
    }

    var result = await Auth.logIn(currentUser.email, password);
    if (result.error) {
      return { error: 'Current password is incorrect.' };
    }
    return { ok: true };
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function doUpload(event, type) {
    var file = event.target.files[0];
    if (!file) return;
    TobUtils.showToast('Uploading\u2026');
    var result = await ProfileStore.uploadImage(currentUser.id, file, type);
    if (result.error) { TobUtils.showToast(result.error); return; }
    TobUtils.showToast(type === 'profile' ? 'Avatar updated!' : 'Banner updated!');
    await UserProfile.refresh();
    currentProfile = await UserProfile.get();
    renderSettings();
  }

  async function doRemove(type) {
    if (!confirm('Remove this ' + type + ' image?')) return;
    var result = await ProfileStore.removeImage(currentUser.id, type);
    if (result.error) { TobUtils.showToast(result.error); return; }
    TobUtils.showToast('Image removed.');
    await UserProfile.refresh();
    currentProfile = await UserProfile.get();
    renderSettings();
  }

  async function doSaveDisplayName() {
    var input = document.getElementById('display-name-input');
    var btn   = document.getElementById('save-display-name-btn');
    var val   = input ? input.value.trim() : '';
    if (val === (currentProfile.display_name || '')) { TobUtils.showToast('No changes made.'); return; }
    btn.disabled = true; btn.textContent = 'Saving\u2026';
    var { error } = await supabase
      .from('profiles')
      .update({ display_name: val || null })
      .eq('id', currentUser.id);
    btn.disabled = false; btn.textContent = 'Save';
    if (error) { TobUtils.showToast(error.message || 'Could not save name.'); return; }
    TobUtils.showToast('Name updated!');
    await UserProfile.refresh();
    currentProfile = await UserProfile.get();
    renderSettings();
  }

  async function doSaveBio() {
    var input = document.getElementById('bio-input');
    var btn   = document.getElementById('save-bio-btn');
    if (!input || !btn) return;
    btn.disabled = true; btn.textContent = 'Saving\u2026';
    var bioValue = input.value.replace(/\n{3,}/g, '\n\n').trim();
    var result = await ProfileStore.saveBio(currentUser.id, bioValue);
    btn.disabled = false; btn.textContent = 'Save Bio';
    if (result.error) { TobUtils.showToast(result.error); return; }
    UserProfile.invalidate();
    currentProfile = await UserProfile.get();
    TobUtils.showToast('Bio saved!');
  }

  async function doUpdateUsername() {
    var input       = document.getElementById('username-input');
    var newUsername = input ? input.value.trim() : '';
    if (newUsername === currentProfile.username) { TobUtils.showToast('No changes made.'); return; }
    var result = await ProfileStore.updateUsername(currentUser.id, newUsername);
    if (result.error) { TobUtils.showToast(result.error); return; }
    TobUtils.showToast('Username updated!');
    await UserProfile.refresh();
    currentProfile = await UserProfile.get();
    renderSettings();
  }

  async function doUpdateEmail() {
    var passwordInput = document.getElementById('modal-current-password-email');
    var input = document.getElementById('modal-new-email');
    var btn   = document.getElementById('email-submit-btn');
    var email = Auth.normalizeEmail(input ? input.value : '');
    if (!email) { TobUtils.showToast('Enter a new email address.'); return; }
    if (email === Auth.normalizeEmail(currentUser.email || '')) { TobUtils.showToast('Enter a different email address.'); return; }
    setButtonBusy(btn, true, 'Checking...');
    var verified = await verifyCurrentPassword(passwordInput ? passwordInput.value : '');
    if (verified.error) {
      setButtonBusy(btn, false, 'Send confirmation');
      TobUtils.showToast(verified.error);
      return;
    }
    btn.textContent = 'Sending...';
    var { error } = await supabase.auth.updateUser({ email: email });
    setButtonBusy(btn, false, 'Send confirmation');
    if (error) { TobUtils.showToast(error.message); return; }
    TobUtils.showToast('Confirmation sent to ' + email);
    closeSettingsModal('settings-email-modal');
  }

  async function doUpdatePassword() {
    var currentPw = document.getElementById('modal-current-password-change');
    var newPw     = document.getElementById('modal-new-password');
    var confirmPw = document.getElementById('modal-confirm-password');
    var btn       = document.getElementById('password-submit-btn');
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw.value.length < 8) { TobUtils.showToast('Password must be at least 8 characters.'); return; }
    if (newPw.value !== confirmPw.value) { TobUtils.showToast('Passwords do not match.'); return; }
    setButtonBusy(btn, true, 'Checking...');
    var verified = await verifyCurrentPassword(currentPw.value);
    if (verified.error) {
      setButtonBusy(btn, false, 'Update password');
      TobUtils.showToast(verified.error);
      return;
    }
    btn.textContent = 'Updating...';
    var { error } = await supabase.auth.updateUser({ password: newPw.value });
    setButtonBusy(btn, false, 'Update password');
    if (error) { TobUtils.showToast(error.message); return; }
    TobUtils.showToast('Password updated!');
    closeSettingsModal('settings-password-modal');
  }

  async function doConfirmDeletePassword() {
    var input = document.getElementById('modal-delete-password');
    var btn = document.getElementById('delete-password-submit-btn');
    setButtonBusy(btn, true, 'Checking...');
    var verified = await verifyCurrentPassword(input ? input.value : '');
    setButtonBusy(btn, false, 'Continue');
    if (verified.error) {
      TobUtils.showToast(verified.error);
      return;
    }
    closeSettingsModal('settings-delete-password-modal');
    openSettingsModal('settings-delete-username-modal', 'modal-delete-username');
  }

  async function doDeleteAccount() {
    var input = document.getElementById('modal-delete-username');
    var btn = document.getElementById('delete-username-submit-btn');
    var expected = currentProfile.username || '';
    var typed = input ? input.value.trim() : '';
    if (typed !== expected) {
      TobUtils.showToast('Type your username exactly to delete your account.');
      return;
    }

    setButtonBusy(btn, true, 'Deleting...');
    var { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });
    if (error) {
      setButtonBusy(btn, false, 'Delete account');
      TobUtils.showToast(error.message || 'Could not delete account.');
      return;
    }
    await supabase.auth.signOut();
    window.location.href = '/home';
  }

  // ── Opt settings page out of bfcache entirely.
  //    An unload listener is enough to make Chrome/Firefox
  //    skip bfcache for this page, preventing the feed DOM
  //    from being restored here on back-navigation.
  window.addEventListener('unload', function () {});

  window.addEventListener('supabaseReady', init, { once: true });
})();
