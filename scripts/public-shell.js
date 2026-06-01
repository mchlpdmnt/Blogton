(function () {
  'use strict';

  var html = document.documentElement;

  /* ----------------------------------------------------------
     THEME HELPERS
     Reads OS preference, persists to localStorage.
     Controls [data-theme] on <html>.
  ---------------------------------------------------------- */
  function getPreferredTheme() {
    var stored = localStorage.getItem('tob-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('tob-theme', theme);
    syncSwitch();
  }

  setTheme(getPreferredTheme());

  /* ----------------------------------------------------------
     TOGGLE SWITCH (inside sidebar)
  ---------------------------------------------------------- */
  var themeSwitch = document.getElementById('theme-switch');

  function syncSwitch() {
    if (themeSwitch) {
      themeSwitch.checked = (html.getAttribute('data-theme') === 'dark');
    }
  }

  syncSwitch();
 
  if (themeSwitch) {
    themeSwitch.addEventListener('change', function () {
      setTheme(themeSwitch.checked ? 'dark' : 'light');
    });
  }

  /* ----------------------------------------------------------
     SIDEBAR DRAWER
  ---------------------------------------------------------- */
  var sidebarEl      = document.getElementById('sidebar');
  var sidebarOverlay = document.getElementById('sidebar-overlay');
  var sidebarOpenBtn = document.getElementById('sidebar-open');
  var sidebarCloseBtn = document.getElementById('sidebar-close');

  function openSidebar() {
    if (!sidebarEl) return;
    sidebarEl.classList.add('open');
    sidebarOverlay.classList.add('open');
  }

  function closeSidebar() {
    if (!sidebarEl) return;
    sidebarEl.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  }

  if (sidebarOpenBtn)   sidebarOpenBtn.addEventListener('click', openSidebar);
  if (sidebarCloseBtn)  sidebarCloseBtn.addEventListener('click', closeSidebar);
  if (sidebarOverlay)   sidebarOverlay.addEventListener('click', closeSidebar);

  var sidebarLoginBtn  = document.getElementById('sidebar-login-btn');
  var sidebarSignupBtn = document.getElementById('sidebar-signup-btn');

  if (sidebarLoginBtn) {
    sidebarLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeSidebar();
      openModal(false);
    });
  }

  if (sidebarSignupBtn) {
    sidebarSignupBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeSidebar();
      openModal(true);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebarEl && sidebarEl.classList.contains('open')) {
      closeSidebar();
    }
  });

  /* ----------------------------------------------------------
     MODAL HELPERS
  ---------------------------------------------------------- */
  var authModalHistoryOpen = false;
  var authModalClosing = false;

  function isMobileAuthModal() {
    return window.matchMedia('(max-width: 540px)').matches;
  }

  function openModal(showSignup) {
    var modal = document.getElementById('auth-modal');
    var lf    = document.getElementById('login-form');
    var sf    = document.getElementById('signup-form');
    if (!modal) return;
    if (showSignup) { lf.classList.add('hidden'); sf.classList.remove('hidden'); }
    else            { sf.classList.add('hidden'); lf.classList.remove('hidden'); }
    authModalClosing = false;
    modal.classList.remove('modal-closing');
    modal.classList.remove('hidden');

    if (isMobileAuthModal() && !authModalHistoryOpen) {
      history.pushState({ authModal: true }, '', window.location.href);
      authModalHistoryOpen = true;
    }
  }

  function hideModal(modal) {
    modal.classList.add('hidden');
    modal.classList.remove('modal-closing');
    authModalClosing = false;
  }

  function closeModal(skipHistoryBack) {
    var modal = document.getElementById('auth-modal');
    if (!modal) return;
    if (modal.classList.contains('hidden') || authModalClosing) return;

    if (isMobileAuthModal()) {
      authModalClosing = true;
      modal.classList.add('modal-closing');

      window.setTimeout(function () {
        hideModal(modal);
      }, 340);
    } else {
      hideModal(modal);
    }

    if (authModalHistoryOpen) {
      authModalHistoryOpen = false;
      if (!skipHistoryBack) history.back();
    }
  }

  var authModalCloseBtn = document.getElementById('auth-modal-close');
  if (authModalCloseBtn) authModalCloseBtn.addEventListener('click', closeModal);

  // Switch between login ↔ signup inside the modal
  // Uses style.display directly — avoids relying on .hidden CSS being defined for .auth-form
  var showSignupLink = document.getElementById('show-signup');
  var showLoginLink  = document.getElementById('show-login');

  if (showSignupLink) {
    showSignupLink.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('login-form').style.display  = 'none';
      document.getElementById('signup-form').style.display = 'block';
    });
  }

  if (showLoginLink) {
    showLoginLink.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('login-form').style.display  = 'block';
    });
  }

  var modalOverlay = document.querySelector('#auth-modal .modal-overlay');
  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

  document.addEventListener('keydown', function (e) {
    var modal = document.getElementById('auth-modal');
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) closeModal();
  });

  window.addEventListener('popstate', function () {
    var modal = document.getElementById('auth-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    authModalHistoryOpen = false;
    closeModal(true);
  });

  var getStartedBtn = document.getElementById('get-started-btn');
  var heroLoginBtn  = document.getElementById('hero-login-btn');
  var ctaSignupBtn  = document.getElementById('cta-signup-btn');

  if (getStartedBtn) getStartedBtn.addEventListener('click',  function (e) { e.preventDefault(); openModal(true); });
  if (heroLoginBtn)  heroLoginBtn.addEventListener('click',   function (e) { e.preventDefault(); openModal(false); });
  if (ctaSignupBtn)  ctaSignupBtn.addEventListener('click',   function (e) { e.preventDefault(); openModal(true);  });

  /* ----------------------------------------------------------
     PASSWORD VISIBILITY TOGGLE
  ---------------------------------------------------------- */
  function initPasswordToggle(inputId, toggleId) {
    var input  = document.getElementById(inputId);
    var toggle = document.getElementById(toggleId);
    if (!input || !toggle) return;
    toggle.addEventListener('click', function () {
      var showing = input.type === 'text';
      input.type  = showing ? 'password' : 'text';
      toggle.classList.toggle('is-visible', !showing);
      toggle.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
    });
  }

  initPasswordToggle('login-password',  'login-pw-toggle');
  initPasswordToggle('signup-password', 'signup-pw-toggle');

  /* ----------------------------------------------------------
     SUPABASE AUTH — Login & Signup form handlers
     Deferred until supabaseReady fires — Supabase client must
     be initialized before any Auth calls can be made.
  ---------------------------------------------------------- */
  window.addEventListener('supabaseReady', function () {
    history.replaceState(null, '', '/home');

    // Auto-redirect to feed if already logged in
    Auth.redirectIfLoggedIn();

    // ── Login form ──
    var loginFormEl = document.getElementById('login-form-element');
    if (loginFormEl) {
      loginFormEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email    = document.getElementById('login-email').value.trim();
        var password = document.getElementById('login-password').value;
        var errorEl  = document.getElementById('login-error');
        errorEl.classList.add('hidden');

        var { error } = await Auth.logIn(email, password);
        if (error) {
          errorEl.textContent = error.message || 'Login failed. Please try again.';
          errorEl.classList.remove('hidden');
          return;
        }
        window.location.href = '/feed';
      });
    }

    // ── Signup form ──
    var signupFormEl = document.getElementById('signup-form-element');
    if (signupFormEl) {
      signupFormEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        var username = document.getElementById('signup-username').value.trim();
        var email    = document.getElementById('signup-email').value.trim();
        var password = document.getElementById('signup-password').value;
        var errorEl  = document.getElementById('signup-error');
        errorEl.classList.add('hidden');

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          errorEl.textContent = 'Username can only contain letters, numbers, and underscores.';
          errorEl.classList.remove('hidden');
          return;
        }

        var available = await Auth.isUsernameAvailable(username);
        if (!available) {
          errorEl.textContent = 'That username is already taken. Try another.';
          errorEl.classList.remove('hidden');
          return;
        }

        var { data, error } = await Auth.signUp(email, password, username);
        if (error) {
          errorEl.textContent = error.message || 'Sign up failed. Please try again.';
          errorEl.classList.remove('hidden');
          return;
        }

        if (data.user && data.session) {
          window.location.href = '/feed';
        } else if (data.user && !data.session) {
          errorEl.textContent = 'Account created! Check your email to confirm, then log in.';
          errorEl.style.color = '#1a7a4c';
          errorEl.style.background = 'rgba(0,103,79,0.08)';
          errorEl.classList.remove('hidden');
          setTimeout(function () {
            errorEl.style.color = '';
            errorEl.style.background = '';
            errorEl.classList.add('hidden');
            openModal(false);
          }, 3000);
        }
      });
    }

    // ── Auth state listener — redirect on OAuth callback ──
    Auth.onAuthStateChange(function (event, session) {
      if (event === 'SIGNED_IN' && session) {
        window.location.href = '/feed';
      }
    });

    // ── Google OAuth buttons ──
    var loginGoogleBtn  = document.getElementById('login-google-btn');
    var signupGoogleBtn = document.getElementById('signup-google-btn');
    if (loginGoogleBtn)  loginGoogleBtn.addEventListener('click',  function () { Auth.signInWithGoogle(); });
    if (signupGoogleBtn) signupGoogleBtn.addEventListener('click', function () { Auth.signInWithGoogle(); });

  }, { once: true });

})();
