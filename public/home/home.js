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

        // Clear any previous message + resend link from a prior attempt
        errorEl.classList.add('hidden');
        errorEl.innerHTML = '';
        errorEl.style.color = '';
        errorEl.style.background = '';

        var { error } = await Auth.logIn(email, password);
        if (error) {
          // Supabase returns "Invalid login credentials" for BOTH wrong password
          // AND an account that exists but hasn't confirmed its email yet.
          // We can't distinguish the two cases from the error alone, so we
          // show a helpful message and offer a resend link for the confirmation
          // email — if the account doesn't exist or is already confirmed,
          // the resend call is a silent no-op on Supabase's side.
          var msg = error.message || '';
          var likelySentEmail =
            msg === 'Email not confirmed' ||
            msg === 'Invalid login credentials';

          if (likelySentEmail) {
            errorEl.innerHTML =
              'Email not confirmed yet. ' +
              '<a href="#" id="resend-link" style="color:inherit;text-decoration:underline;cursor:pointer;">' +
              'Resend verification email</a>';
          } else {
            errorEl.textContent = msg || 'Login failed. Please try again.';
          }
          errorEl.classList.remove('hidden');

          // Wire up the resend link if we rendered one
          var resendLink = document.getElementById('resend-link');
          if (resendLink) {
            resendLink.addEventListener('click', async function (ev) {
              ev.preventDefault();
              resendLink.textContent    = 'Sending\u2026';
              resendLink.style.pointerEvents = 'none';

              var { error: resendErr } = await Auth.resendVerification(email);

              if (resendErr) {
                errorEl.textContent = resendErr.message || 'Could not resend. Try again later.';
              } else {
                errorEl.textContent        = 'Verification email sent — check your inbox.';
                errorEl.style.color        = '#1a7a4c';
                errorEl.style.background   = 'rgba(0,103,79,0.08)';
                setTimeout(function () {
                  errorEl.style.color      = '';
                  errorEl.style.background = '';
                  errorEl.classList.add('hidden');
                }, 5000);
              }
            }, { once: true });
          }

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
          // Two possible states that look identical from the client:
          //   A) Brand new account — Supabase sent a confirmation email.
          //   B) Email already registered — Supabase silently did nothing
          //      (by design, to prevent email enumeration). No email was sent.
          //
          // We can't tell them apart, so we give the user a path for both:
          // check their inbox (case A), or go straight to login if they
          // already confirmed previously (case B).
          errorEl.innerHTML =
            'Check your inbox for a confirmation link. ' +
            'Already confirmed? ' +
            '<a href="#" id="go-to-login" style="color:inherit;text-decoration:underline;cursor:pointer;">' +
            'Log in instead</a>.';
          errorEl.style.color      = '#1a7a4c';
          errorEl.style.background = 'rgba(0,103,79,0.08)';
          errorEl.classList.remove('hidden');

          // Pre-fill the login email field and flip to the login form
          var goToLogin = document.getElementById('go-to-login');
          if (goToLogin) {
            goToLogin.addEventListener('click', function (ev) {
              ev.preventDefault();
              document.getElementById('login-email').value =
                document.getElementById('signup-email').value;
              errorEl.innerHTML    = '';
              errorEl.style.color  = '';
              errorEl.style.background = '';
              errorEl.classList.add('hidden');
              document.getElementById('signup-form').style.display = 'none';
              document.getElementById('login-form').style.display  = 'block';
            }, { once: true });
          }
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
