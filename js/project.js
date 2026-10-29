/* ==========================================================================
   A Day in Bloom · project field journal
   Highlights the section you are reading in the sticky section navigation.
   ========================================================================== */
(function () {
  'use strict';

  const links = document.querySelectorAll('.fj-sectionnav a[href^="#"]');
  const sections = document.querySelectorAll('.fj-section');
  if (!('IntersectionObserver' in window) || !sections.length) return;

  function markCurrent(id) {
    links.forEach((link) => {
      if (link.getAttribute('href') === '#' + id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) markCurrent(entry.target.id);
    });
  }, { rootMargin: '-35% 0px -55% 0px' });

  sections.forEach((section) => observer.observe(section));
})();
