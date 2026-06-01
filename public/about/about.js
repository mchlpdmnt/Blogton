// ── About Page — GSAP entrance + scroll reveal animations ──
(function () {
  'use strict';

  history.replaceState(null, '', '/about');

  gsap.registerPlugin(ScrollTrigger);

  const EXP  = 'power4.out';
  const EASE = 'power3.out';

  /* ── 1. Hero entrance ── */
  const tl = gsap.timeline({ defaults: { ease: EXP } });

  // Meta tags fade in
  tl.to('.ab-hero-meta', { opacity: 1, y: 0, duration: 0.7, delay: 0.1 });

  // Title lines slide up — each line's inner span
  // We wrap each line text in a span in JS for the clip reveal
  document.querySelectorAll('.ab-line').forEach((line, i) => {
    const span = document.createElement('span');
    span.innerHTML = line.innerHTML;
    line.innerHTML = '';
    line.appendChild(span);

    tl.to(span, {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: EXP,
    }, i === 0 ? '-=0.4' : '-=0.65');
  });

  // Sub + scroll hint
  tl.to('.ab-hero-sub', { opacity: 1, y: 0, duration: 0.8, ease: EASE }, '-=0.5');
  tl.to('.ab-hero-scroll-hint', { opacity: 1, duration: 0.6, ease: EASE }, '-=0.4');

  /* ── 2. Generic scroll reveal helper ── */
  function reveal(selector, vars = {}) {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    ScrollTrigger.create({
      trigger: els[0],
      start: 'top 82%',
      once: true,
      onEnter() {
        gsap.to(els, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: EXP,
          stagger: 0.1,
          ...vars,
        });
      }
    });
  }

  reveal('.ab-principles-header');

  // Principles: respect data-delay
  const principles = document.querySelectorAll('.ab-principle[data-reveal]');
  if (principles.length) {
    ScrollTrigger.create({
      trigger: '.ab-principles-grid',
      start: 'top 80%',
      once: true,
      onEnter() {
        principles.forEach(el => {
          const delay = parseInt(el.dataset.delay || '0', 10) / 1000;
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: EXP, delay });
        });
      }
    });
  }

  reveal('.ab-pullquote-inner');

  reveal('.ab-creator-label');

  const creatorName    = document.querySelector('.ab-creator-name-block[data-reveal]');
  const creatorContent = document.querySelector('.ab-creator-content[data-reveal]');
  if (creatorName) {
    ScrollTrigger.create({
      trigger: '.ab-creator-body',
      start: 'top 80%',
      once: true,
      onEnter() {
        gsap.to(creatorName,    { opacity: 1, y: 0, duration: 0.85, ease: EXP });
        gsap.to(creatorContent, { opacity: 1, y: 0, duration: 0.85, ease: EXP, delay: 0.12 });
      }
    });
  }

  /* ── 3. Magnetic buttons ── */
  document.querySelectorAll('.ab-creator-cta .btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width  / 2) * 0.25,
        y: (e.clientY - r.top  - r.height / 2) * 0.25,
        duration: 0.4, ease: 'power2.out', overwrite: 'auto'
      });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.38)', overwrite: 'auto' });
    });
    btn.addEventListener('mousedown', () => {
      gsap.to(btn, { scale: 0.96, duration: 0.1, overwrite: 'auto' });
    });
    btn.addEventListener('mouseup', () => {
      gsap.to(btn, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    });
  });

  /* ── 4. About CTA ── */
  const signupBtn = document.getElementById('about-signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = '/';
    });
  }

})();
