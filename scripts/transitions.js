// ─────────────────────────────────────────────
// Page Transitions + Top Progress Bar
// Include this script in every HTML page.
// ─────────────────────────────────────────────
(function () {
  'use strict';

  // ── Inject transition + progress bar CSS ──
  const transitionStyles = document.createElement('style');
  transitionStyles.textContent = `
    /* Entry: page fades and lifts in */
    @keyframes tob-fade-in {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0);    }
    }

    /* Exit: page fades and pushes up */
    @keyframes tob-fade-out {
      from { opacity: 1; transform: translateY(0);    }
      to   { opacity: 0; transform: translateY(-8px); }
    }

    /* Animate page content only — fixed navbar excluded */
    main, .app-page {
      animation: tob-fade-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
    }

    body.tob-exiting main, body.tob-exiting .app-page {
      animation: tob-fade-out 0.2s ease forwards !important;
    }
    body.tob-exiting {
      pointer-events: none;
    }

    /* Top progress bar */
    #tob-bar {
      position: fixed;
      top: 0; left: 0;
      height: 3px;
      width: 0%;
      background: var(--accent, #111110);
      border-radius: 0 2px 2px 0;
      z-index: 99999;
      opacity: 0;
      transition: width 0.4s ease, opacity 0.25s ease;
      pointer-events: none;
    }
    #tob-bar.tob-bar--running {
      opacity: 1;
      width: 80%;
    }
    #tob-bar.tob-bar--done {
      width: 100% !important;
      transition: width 0.15s ease, opacity 0.35s ease 0.1s;
      opacity: 0;
    }
  `;
  document.head.appendChild(transitionStyles);

  // ── Progress bar element ──
  const progressBar = document.createElement('div');
  progressBar.id    = 'tob-bar';
  document.documentElement.appendChild(progressBar); // on <html> so it survives body repaints

  let barDismissTimer = null;

  function startProgressBar() {
    clearTimeout(barDismissTimer);
    progressBar.className = '';
    void progressBar.offsetWidth; // force reflow so transition re-triggers
    progressBar.classList.add('tob-bar--running');
  }

  function finishProgressBar() {
    progressBar.classList.add('tob-bar--done');
    barDismissTimer = setTimeout(() => {
      progressBar.className = '';
    }, 500);
  }

  // ── Run progress bar on the initial page load ──
  startProgressBar();
  if (document.readyState === 'complete') {
    finishProgressBar();
  } else {
    window.addEventListener('load', finishProgressBar);
  }

  // ── Intercept internal page navigations (clean URLs + legacy .html) ──
  document.addEventListener('click', (clickEvent) => {
    const clickedLink = clickEvent.target.closest('a[href]');
    if (!clickedLink) return;

    const linkHref = clickedLink.getAttribute('href');

    // Intercept root-relative internal links — skip anchors, externals, and new-tab
    const isInternalLink = linkHref && linkHref.startsWith('/') && !linkHref.startsWith('//');
    const isAnchorOnly   = linkHref && linkHref.startsWith('#');
    const isExternalLink = linkHref && (linkHref.startsWith('http') || linkHref.startsWith('//'));
    const opensNewTab    = clickedLink.target === '_blank';

    if (!isInternalLink || isAnchorOnly || isExternalLink || opensNewTab) return;

    clickEvent.preventDefault();

    // Kick off exit animation and progress bar
    document.body.classList.add('tob-exiting');
    startProgressBar();

    // Navigate after the exit animation completes (0.2s)
    setTimeout(() => {
      window.location.href = linkHref;
    }, 200);

  }, false);

})();
