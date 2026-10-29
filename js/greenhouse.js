/* ==========================================================================
   A Day in Bloom · the greenhouse
   Clicking the greenhouse steps inside: the garden gently zooms toward it and
   the illustrated room fades in. The room lives at #greenhouse, so the
   browser's back button, Escape and "back to the garden" all lead out.
   (The pets' little movements are CSS in garden.css; the room is styled in
   css/greenhouse.css.)
   ========================================================================== */

/* ✿ GROWING SOON ✿
   Each item becomes a little seedling pot on the "Growing Soon" shelf.
   To add a real project, change a line like this (link is optional):
     { title: 'Project name', note: 'A short note', link: 'projects/page.html' },
   The shelf shows three pots comfortably. */
const UPCOMING_PROJECTS = [
  { title: 'Next Bloom', note: 'Coming Soon' },
  { title: 'Taking Root', note: 'Coming Soon' },
  { title: 'New Idea', note: 'Coming Soon' }
];

(function () {
  'use strict';

  const body = document.body;
  const peek = document.getElementById('greenhouse-peek');
  const room = document.getElementById('greenhouse-room');
  const roomViewport = document.getElementById('gh-room-viewport');
  const back = document.getElementById('gh-room-back');
  const pots = document.getElementById('gh-pots');
  const sketchbook = document.getElementById('gh-sketchbook');
  const note = document.getElementById('gh-note');
  const gardenViewport = document.getElementById('garden-viewport');
  const instructionBar = document.getElementById('instruction-bar');

  let enteredFromGarden = false;
  let closeTimer;

  // ---- The cat and dog: copied from the greenhouse outside -----------------
  [['#greenhouse-interior .gh-cat', 'gh-room-cat'], ['#greenhouse-interior .gh-dog', 'gh-room-dog']].forEach(([from, to]) => {
    const copy = document.querySelector(from).cloneNode(true);
    copy.removeAttribute('transform');
    document.getElementById(to).appendChild(copy);
  });

  // ---- The "Growing Soon" shelf ----------------------------------------------
  const POT_SVG =
    '<svg class="gh-pot__art" viewBox="0 0 60 64" aria-hidden="true">' +
      '<path d="M30 34 C30 26 29 20 30 12" stroke="#6f8a58" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M30 24 C24 24 19 20 18 14 C24 13 29 17 30 24 Z" fill="#8fb069"/>' +
      '<path d="M30 19 C36 18 41 14 42 8 C36 8 31 12 30 19 Z" fill="#a3c27c"/>' +
      '<path d="M30 14 C29.4 11 30 8.6 32.6 6.8 C33 9.6 32.2 12 30 14 Z" fill="#b8d48f"/>' +
      '<path d="M14 36 L46 36 L42 61 L18 61 Z" fill="url(#terracotta)"/>' +
      '<path d="M14 36 L46 36 L42 61 L18 61 Z" fill="url(#pot-shade)"/>' +
      '<rect x="11.5" y="31" width="37" height="7" rx="1.8" fill="url(#terracotta-rim)"/>' +
    '</svg>';

  const escapeHTML = (text) => String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  pots.innerHTML = UPCOMING_PROJECTS.map((item) => {
    const inner = POT_SVG +
      '<span class="gh-pot__tag">' +
        `<span class="gh-pot__title hand">${escapeHTML(item.title)}</span>` +
        `<span class="gh-pot__note">${escapeHTML(item.note || '')}</span>` +
      '</span>';
    return item.link
      ? `<li><a class="gh-pot" href="${escapeHTML(item.link)}">${inner}</a></li>`
      : `<li><span class="gh-pot">${inner}</span></li>`;
  }).join('');

  // ---- Stepping in and out -----------------------------------------------------
  let settleTimer;

  function enter() {
    if (!room.hidden && room.classList.contains('is-open')) return;
    window.clearTimeout(closeTimer);
    if (window.GreenhouseArt) window.GreenhouseArt.paint();   // usually already painted while the visitor was in the garden
    room.hidden = false;
    // once the room has fully faded in, the browser can stop drawing the garden behind it
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => body.classList.add('gh-settled'), 1300);
    body.classList.add('in-greenhouse');
    gardenViewport.inert = true;
    instructionBar.inert = true;
    // start centred on the potting bench (matters on narrow screens)
    roomViewport.scrollLeft = (roomViewport.scrollWidth - roomViewport.clientWidth) * 0.5;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      room.classList.add('is-open');
      back.focus({ preventScroll: true });
    }));
  }

  function leave() {
    if (room.hidden) return;
    closeNote();
    window.clearTimeout(settleTimer);
    body.classList.remove('gh-settled');   // the garden comes back before the zoom out begins
    room.classList.remove('is-open');
    body.classList.remove('in-greenhouse');
    gardenViewport.inert = false;
    instructionBar.inert = false;
    closeTimer = window.setTimeout(() => { room.hidden = true; }, 600);
    if (location.hash === '#garden' || location.hash === '') peek.focus({ preventScroll: true });
  }

  // the address decides whether we're inside
  function sync() {
    if (location.hash === '#greenhouse') enter();
    else leave();
  }

  // soft sound effects (js/sound.js); silent unless the visitor has turned sound on
  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };

  peek.addEventListener('click', () => {
    sfx('door');
    enteredFromGarden = true;
    location.hash = 'greenhouse';
  });

  function goBack() {
    if (enteredFromGarden) { enteredFromGarden = false; history.back(); }
    else location.hash = 'garden';
  }

  back.addEventListener('click', goBack);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !room.hidden && !note.open) goBack();
  });

  window.addEventListener('hashchange', sync);
  sync();

  // ---- Getting the room ready in the background ------------------------------------
  // The room's flowers are painted once the page has loaded and the browser is idle
  // (or after a second and a half at most, since the garden rarely sits completely still),
  // so they never slow down the first look at the garden.
  const whenIdle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : window.setTimeout(fn, 1200));
  window.addEventListener('load', () => whenIdle(() => {
    if (window.GreenhouseArt) window.GreenhouseArt.paint();
  }));

  // ---- The sketchbook note --------------------------------------------------------
  function openNote() {
    if (typeof note.showModal === 'function') note.showModal();
    else note.setAttribute('open', '');
    note.querySelector('.music-card__close').focus({ preventScroll: true });
  }

  function closeNote() {
    if (!note.open) return;
    if (typeof note.close === 'function') note.close();
    else note.removeAttribute('open');
  }

  sketchbook.addEventListener('click', () => { sfx('sketchbook'); openNote(); });

  // ---- The little speaker on the stool ------------------------------------------------
  // The first click powers it on (a warm light and floating notes), then the playlist
  // card opens. Nothing plays by itself: visitors choose where to listen.
  const speaker = document.getElementById('gh-speaker');
  let powerTimer;
  speaker.addEventListener('click', () => {
    const openCard = () => {
      if (window.MusicCard && !room.hidden) window.MusicCard.open(speaker, 'from the little speaker');
    };
    if (speaker.classList.contains('is-on')) { openCard(); return; }
    speaker.classList.add('is-on');
    sfx('power');
    window.clearTimeout(powerTimer);
    powerTimer = window.setTimeout(openCard, 650);
  });
  note.querySelectorAll('[data-note-close]').forEach((button) => button.addEventListener('click', closeNote));
  note.addEventListener('close', () => { if (!room.hidden) sketchbook.focus({ preventScroll: true }); });
  note.addEventListener('click', (event) => { if (event.target === note) closeNote(); });
  note.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') event.stopPropagation();   // closes only the note
  });
})();
