(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    history.replaceState(null, '', '/privacy');
    var tocLinks = document.querySelectorAll('.toc-item a');
    var sections = document.querySelectorAll('.priv-section');
    var navH     = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;

    // ── Smooth scroll via body.scrollTop (body is the single scroll root) ──
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = link.getAttribute('href').replace('#', '');
        var target   = document.getElementById(targetId);
        if (!target) return;

        var offset = target.getBoundingClientRect().top + document.body.scrollTop - navH - 24;
        document.body.scrollTo({ top: offset, behavior: 'smooth' });

        history.pushState(null, '', '#' + targetId);
      });
    });

    // ── Active TOC highlight — observe against body scroll ──
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tocLinks.forEach(function (l) { l.classList.remove('active'); });
          var active = document.querySelector('.toc-item a[href="#' + entry.target.id + '"]');
          if (active) active.classList.add('active');
        }
      });
    }, {
      root       : document.body,   // body is the scroll root
      rootMargin : '-10% 0px -80% 0px'
    });

    sections.forEach(function (s) { observer.observe(s); });

    // ── Set first item active on load ──
    if (tocLinks.length) tocLinks[0].classList.add('active');
  });
})();
