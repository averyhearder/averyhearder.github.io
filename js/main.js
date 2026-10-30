/* ==========================================================================
   A Day in Bloom Â· site navigation
   The address bar decides what you see:
     #home     â†’ welcome screen
     #garden   â†’ the garden
     #work, #about, #contact â†’ the garden with that panel open
   (Gameplay will live in its own file, js/game.js, in a later stage.)
   ========================================================================== */
(function () {
  'use strict';

  const PANELS = ['work', 'about', 'contact'];
  // links straight to a notebook spread, e.g. index.html#little-things
  const JOURNAL_LINKS = ['skills', 'little-things', 'hello'];

  const body = document.body;
  const viewport = document.getElementById('garden-viewport');
  const scene = document.getElementById('garden-scene');
  const panelLayer = document.getElementById('panel-layer');
  const note = document.getElementById('garden-note');
  const swipeHint = document.getElementById('swipe-hint');
  const navLinks = document.querySelectorAll('[data-nav]');

  let hasVisitedGarden = false;
  let noteTimer;

  // ---- Welcome â†” garden ---------------------------------------------------
  function showWelcome() {
    body.classList.add('is-welcome');
    body.classList.remove('is-garden');
  }

  function showGarden() {
    body.classList.remove('is-welcome');
    body.classList.add('is-garden');
    if (!hasVisitedGarden) {
      hasVisitedGarden = true;
      window.setTimeout(() => {
        showNote('Welcome to the garden. Open the sketchbook on the bench to meet me, or the mailbox to say hello.');
        showSwipeHint();
      }, 1400);
    }
  }

  // On narrow screens the garden is wider than the window; start at the beds.
  // (A phone turned sideways is the other way round: the garden is taller than the window and
  // scrolls up to the sky, so it starts at the bottom, with the beds, seeds and can in view.
  // The same test as in css/landscape.css. If that leaves the sun only just clipped by the top of
  // the screen, the view sits a few pixels lower so the whole sun shows.)
  const sideways = window.matchMedia('(orientation: landscape) and (max-height: 500px) and (hover: none) and (pointer: coarse)');
  const sun = document.getElementById('sun');
  function restingTop() {
    const bottom = viewport.scrollHeight - viewport.clientHeight;
    const sunTop = sun.offsetTop;   // (its place in the garden, unaffected by the welcome screen's gentle zoom)
    const clipped = sunTop < bottom + 4 && sunTop + sun.offsetHeight > bottom;
    return clipped && bottom + 4 - sunTop <= 24 ? sunTop - 4 : bottom;
  }
  function centreOnBeds() {
    const bedsCentre = scene.offsetWidth * (810 / 1600);
    viewport.scrollLeft = Math.max(0, bedsCentre - viewport.clientWidth / 2);
    if (sideways.matches) viewport.scrollTop = restingTop();
  }

  function showSwipeHint() {
    if (scene.offsetWidth <= viewport.clientWidth + 10) return;
    swipeHint.classList.add('is-visible');
    viewport.addEventListener('scroll', () => swipeHint.classList.remove('is-visible'), { once: true });
    window.setTimeout(() => swipeHint.classList.remove('is-visible'), 6000);
  }

  // ---- Panels -------------------------------------------------------------
  // soft paper, book and mailbox sounds (js/sound.js); silent unless the visitor turned sound on
  const sfx = (name) => { if (name && window.GardenSound) window.GardenSound.play(name); };
  const OPEN_SOUNDS = { about: 'bookOpen', contact: 'mailbox' };
  const CLOSE_SOUNDS = { about: 'bookClose', contact: 'mailboxClose' };
  let openName = null;   // which panel is open right now, so each open/close sounds only once

  function openPanel(name) {
    const opening = openName !== name;
    // "About" always opens the notebook on its first spread
    if (name === 'about') showJournalTab('about', false);
    if (opening) sfx(OPEN_SOUNDS[name]);
    openName = name;
    panelLayer.classList.add('is-open');
    body.classList.add('has-panel');
    PANELS.forEach((other) => {
      const panel = document.getElementById('panel-' + other);
      const isTarget = other === name;
      panel.hidden = !isTarget;
      if (isTarget) {
        panel.scrollTop = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          panel.classList.add('is-active');
          panel.querySelector('.panel-title').focus({ preventScroll: true });
        }));
      } else {
        panel.classList.remove('is-active');
      }
    });
  }

  function closePanels() {
    if (openName) sfx(CLOSE_SOUNDS[openName]);
    openName = null;
    panelLayer.classList.remove('is-open');
    body.classList.remove('has-panel');
    PANELS.forEach((name) => {
      const panel = document.getElementById('panel-' + name);
      if (!panel.classList.contains('is-active')) return;
      panel.classList.remove('is-active');
      window.setTimeout(() => {
        if (!panel.classList.contains('is-active')) panel.hidden = true;
      }, 700);
    });
  }

  // ---- Little garden messages --------------------------------------------
  function showNote(text) {
    note.textContent = text;
    note.classList.add('is-visible');
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(() => note.classList.remove('is-visible'), 5200);
  }
  // on phones the message sits in the instruction band: a tap tucks it away early
  note.addEventListener('click', () => { window.clearTimeout(noteTimer); note.classList.remove('is-visible'); });

  // ---- Router: reacts whenever the #address changes ----------------------
  function route() {
    const page = location.hash.replace('#', '') || 'home';

    if (PANELS.includes(page)) {
      showGarden();
      openPanel(page);
    } else if (JOURNAL_LINKS.includes(page)) {
      // links straight to a notebook spread, e.g. index.html#hello
      // (opening the notebook already makes a sound, so the page itself turns quietly)
      const wasOpen = openName === 'about';
      showGarden();
      openPanel('about');
      showJournalTab(page, false, !wasOpen);
    } else if (['garden', 'greenhouse', 'lake', 'willow'].includes(page)) {   // the greenhouse, lake and willow open in their own scripts
      closePanels();
      showGarden();
    } else {
      closePanels();
      showWelcome();
    }

    navLinks.forEach((link) => {
      const section = JOURNAL_LINKS.includes(page) ? 'about' : ['greenhouse', 'lake', 'willow'].includes(page) ? 'garden' : page;
      const current = link.dataset.nav === section || (section !== 'garden' && link.dataset.nav === 'home' && !PANELS.includes(section));
      if (current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  // ---- Wire everything up -------------------------------------------------
  document.querySelectorAll('[data-open]').forEach((el) => {
    el.addEventListener('click', () => { location.hash = el.dataset.open; });
  });

  // (beds and seed packets are handled by js/game.js)
  document.querySelectorAll('[data-note]:not([data-flower])').forEach((el) => {
    el.addEventListener('click', () => showNote(el.dataset.note));
  });

  // ---- About notebook: three spreads (about · skills · hello) ------------
  const journal = document.getElementById('journal');
  const journalTabs = journal.querySelectorAll('[role="tab"]');

  // each page's outer bottom corner lifts very slightly when the pointer comes near (css/journal.css)
  journal.querySelectorAll('.journal-page--left, .journal-page--right').forEach((page) => {
    const corner = document.createElement('span');
    corner.className = 'journal-corner';
    corner.setAttribute('aria-hidden', 'true');
    page.appendChild(corner);
  });

  function showJournalTab(name, moveFocus, quiet) {
    // a page turns only when the open notebook actually moves to a different spread
    if (!quiet && openName === 'about' && journal.dataset.tab !== name) sfx('pageFlip');
    journal.dataset.tab = name;
    journalTabs.forEach((tab) => {
      const selected = tab.dataset.journalTab === name;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    journal.querySelectorAll('.journal-spread').forEach((spread) => {
      spread.classList.toggle('is-current', spread.id === 'jspread-' + name);
    });
    document.getElementById('panel-about').scrollTop = 0;
    if (moveFocus) journal.querySelector('#jspread-' + name + ' .journal-title').focus({ preventScroll: true });
  }

  // tabs, plus the "turn the page" links inside the notebook
  journal.querySelectorAll('[data-journal-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      showJournalTab(button.dataset.journalTab, !button.matches('[role="tab"]'));
    });
  });

  // arrow keys move between tabs
  journal.querySelector('.journal-tabs').addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const tabs = Array.from(journalTabs);
    const index = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    const next = tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    showJournalTab(next.dataset.journalTab, false);
    next.focus();
  });

  journal.querySelectorAll('.journal-title').forEach((title) => title.setAttribute('tabindex', '-1'));

  // ---- Photos: show a labelled placeholder until the photo file is added --
  document.querySelectorAll('.photo-slot img').forEach((img) => {
    const markMissing = () => img.closest('.photo-slot').classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) markMissing();
    else img.addEventListener('error', markMissing);
  });

  // Shared with js/game.js
  // (restingTop: where a phone turned sideways sits, at the bottom of the garden)
  window.GardenUI = { showNote: showNote, restingTop: restingTop };

  // ---- The garden rests while something covers it --------------------------
  // While a panel or the greenhouse is open, the garden's animations pause. Only the
  // elements that are actually moving are touched, so the browser doesn't have to
  // restyle the thousands of still flowers, leaves and pebbles around them.
  const resting = new Set();
  function restGarden() {
    const rest = ['has-panel', 'in-greenhouse', 'at-lake', 'at-willow'].some((name) => body.classList.contains(name));
    if (rest) {
      scene.getAnimations({ subtree: true }).forEach((animation) => {
        const target = animation.effect && animation.effect.target;
        // CSS animations only (the greenhouse zoom is a transition and must keep going)
        if (!animation.animationName || animation.playState !== 'running' || !target) return;
        if (animation.effect.pseudoElement || !(target instanceof Element)) {
          animation.pause();
          resting.add(animation);
        } else {
          target.style.animationPlayState = 'paused';
          resting.add(target);
        }
      });
    } else if (resting.size) {
      resting.forEach((item) => {
        if (item instanceof Element) item.style.removeProperty('animation-play-state');
        else item.play();
      });
      resting.clear();
    }
  }
  if (scene.getAnimations) {
    new MutationObserver(restGarden).observe(body, { attributes: true, attributeFilter: ['class'] });
  }

  document.querySelectorAll('[aria-disabled="true"]').forEach((el) => {
    el.addEventListener('click', (event) => event.preventDefault());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panelLayer.classList.contains('is-open')) {
      location.hash = 'garden';
    }
  });

  document.querySelectorAll('.panel-title').forEach((title) => title.setAttribute('tabindex', '-1'));

  window.addEventListener('hashchange', route);
  // Re-centre only when the width changes (phones resize height while scrolling)
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    centreOnBeds();
  });

  centreOnBeds();
  window.addEventListener('load', centreOnBeds);
  route();
})();
