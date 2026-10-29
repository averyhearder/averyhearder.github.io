/* ==========================================================================
   A Day in Bloom · the living browser tab
   The tab's little icon and title follow where you are in the garden page:
   a pink sprout in the garden, a potted flower in the greenhouse, a water lily
   at the lake, a willow leaf at the Wishing Willow. It listens to the same
   #address the rest of the site uses (js/main.js), so it also follows the
   browser's Back and Forward buttons. The project pages set their own icon
   and title in their HTML. Icons: assets/favicons/ (and assets/favicon.svg).
   ========================================================================== */
(function () {
  'use strict';

  const BRAND = 'A Day in Bloom';
  // where you are → [tab title, icon]
  const PLACES = {
    home: [`${BRAND} — Avery Hearder`, 'garden'],
    garden: [`The Garden | ${BRAND}`, 'garden'],
    greenhouse: [`The Greenhouse | ${BRAND}`, 'greenhouse'],
    lake: [`The Lake | ${BRAND}`, 'lake'],
    willow: [`The Wishing Willow | ${BRAND}`, 'willow'],
    work: [`Work | ${BRAND}`, 'garden'],
    about: [`About | ${BRAND}`, 'garden'],
    skills: [`About | ${BRAND}`, 'garden'],
    'little-things': [`About | ${BRAND}`, 'garden'],
    hello: [`About | ${BRAND}`, 'garden'],
    contact: [`Contact | ${BRAND}`, 'garden']
  };

  let icon = document.querySelector('link[rel="icon"]');
  function update() {
    const [title, name] = PLACES[location.hash.replace('#', '')] || PLACES.home;
    document.title = title;
    const href = `assets/favicons/${name}.svg`;
    if (icon && icon.getAttribute('href') === href) return;
    // a fresh <link> each time, which every browser notices (some ignore a changed href)
    const next = document.createElement('link');
    next.rel = 'icon';
    next.type = 'image/svg+xml';
    next.href = href;
    if (icon) icon.replaceWith(next); else document.head.appendChild(next);
    icon = next;
  }
  window.addEventListener('hashchange', update);
  update();
})();
