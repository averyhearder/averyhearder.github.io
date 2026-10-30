/* ==========================================================================
   A Day in Bloom · little hints in the Wishing Willow and the greenhouse
   The same small handwritten arrows as the garden's ("watering can this way ♡"),
   pointing to the things you can do in each room: the swing and the writing
   desk under the willow; the music speaker and the bouquet bar in the
   greenhouse. Phones and tablets only (on a computer, hovering already
   labels everything), and nothing in the rooms themselves changes.

     · Each hint sits in open space beside its object; if the object is off to
       one side of the screen, the hint waits at that edge, pointing the way.
     · Tapping a hint does what it says (or, at the edge, glides over to it).
     · Once a feature has been used, its hint is gone for good (remembered in
       this browser). A tap anywhere else tucks them away until the next visit,
       and they tuck themselves away after a little while anyway.
   They never cover the menus, the room's buttons or each other.
   ========================================================================== */
(function () {
  'use strict';

  const touch = window.matchMedia('(hover: none) and (pointer: coarse)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const SAVE_KEY = 'aDayInBloom.hints.v1';
  const SHOW_AFTER = 900;    // ms after stepping in (the room has faded in by then)
  const TUCK_AFTER = 15000;  // ms they stay, if nothing else tucks them away

  // at: the point on the object the arrow aims for (fractions of its box);
  // side: where the hint sits, 'above' (pointing down) or 'left' (pointing right)
  const ROOMS = [
    {
      room: 'willow-room', viewport: 'willow-viewport', back: 'willow-back', open: 'at-willow',
      hints: [
        { key: 'willow-swing', target: 'wl-swing', label: 'give the swing a push ♡', at: [0.5, 0.93], side: 'above' },
        { key: 'willow-desk', target: 'wl-desk-btn', label: 'write a little wish ♡', at: [0.36, 0.06], side: 'above',
          used: () => !!document.querySelector('#wl-wishes .wl-hung') }
      ]
    },
    {
      room: 'greenhouse-room', viewport: 'gh-room-viewport', back: 'gh-room-back', open: 'in-greenhouse',
      hints: [
        { key: 'greenhouse-music', target: 'gh-speaker', label: 'listen to my music ♪', at: [0.5, 0], side: 'above' },
        { key: 'greenhouse-bouquet', target: 'gh-station', aim: '.gh-station__hit', label: 'make a little bouquet ✿', at: [0, 0.32], side: 'left' }
      ]
    }
  ];

  let retired = [];
  try { retired = JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (error) { /* storage blocked: they simply return each visit */ }
  if (!Array.isArray(retired)) retired = [];
  function retire(key) {
    if (retired.includes(key)) return;
    retired.push(key);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(retired)); } catch (error) { /* ignore */ }
  }

  const header = document.querySelectorAll('.brand, .garden-controls, .site-nav');
  let frame = 0;
  const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };

  ROOMS.forEach((r) => {
    r.el = document.getElementById(r.room);
    r.view = document.getElementById(r.viewport);
    r.backButton = document.getElementById(r.back);
    if (!r.el || !r.view) return;
    r.since = 0;        // when this visit began (0: not inside)
    r.tucked = false;   // tucked away for the rest of this visit
    r.hints = r.hints.filter((h) => (h.target = document.getElementById(h.target)));
    r.hints.forEach((h) => {
      h.el = document.createElement('p');
      h.el.className = 'room-hint hand';
      h.el.setAttribute('aria-hidden', 'true');   // the objects themselves are labelled for screen readers
      r.el.appendChild(h.el);
      h.way = '';
      // using the feature retires its hint for good
      h.target.addEventListener('click', () => { retire(h.key); schedule(); });
      // a tap on the hint: do what it says, or glide over to it when it's off to the side
      h.el.addEventListener('click', (event) => {
        event.stopPropagation();
        if (h.way === 'left' || h.way === 'right') {
          const box = h.target.getBoundingClientRect();
          r.view.scrollTo({ left: r.view.scrollLeft + box.left + box.width / 2 - r.view.clientWidth / 2, behavior: calm.matches ? 'auto' : 'smooth' });
        } else h.target.click();
      });
    });
    // a tap anywhere else in the room tucks them away until the next visit
    r.el.addEventListener('click', (event) => {
      if (r.hints.some((h) => h.target.contains(event.target))) return;
      r.tucked = true;
      schedule();
    });
    r.view.addEventListener('scroll', schedule, { passive: true });
    r.el.querySelectorAll('dialog').forEach((d) => new MutationObserver(schedule).observe(d, { attributes: true, attributeFilter: ['open'] }));
  });

  function update() {
    frame = 0;
    const now = Date.now();
    ROOMS.forEach((r) => {
      if (!r.el || !r.view) return;
      const inside = document.body.classList.contains(r.open) && r.el.classList.contains('is-open');
      if (inside && !r.since) {
        r.since = now;
        r.tucked = false;
        window.setTimeout(schedule, SHOW_AFTER);
        window.setTimeout(schedule, TUCK_AFTER);
      } else if (!inside) r.since = 0;
      const live = inside && touch.matches && !r.tucked && now - r.since >= SHOW_AFTER && now - r.since < TUCK_AFTER &&
        !document.querySelector('dialog[open]');
      // the open space they may use: below the menus, above the room's own buttons
      const W = window.innerWidth;
      let ceiling = 8;
      header.forEach((el) => { const b = el.getBoundingClientRect(); if (b.height && b.bottom < window.innerHeight / 2) ceiling = Math.max(ceiling, b.bottom + 8); });
      const floor = (r.backButton ? r.backButton.getBoundingClientRect().top : window.innerHeight) - 8;
      // everything else that can be tapped in the room, which a hint must never sit on
      const things = live ? [...r.view.querySelectorAll('button')].map((b) => [b, b.getBoundingClientRect()]) : [];
      const placed = [];
      r.hints.forEach((h) => {
        const show = live && !retired.includes(h.key) && !(h.used && h.used());
        if (!show) { h.el.classList.remove('is-shown'); return; }
        const box = (h.aim && h.target.querySelector(h.aim) || h.target).getBoundingClientRect();
        const ax = box.left + box.width * h.at[0];
        const ay = box.top + box.height * h.at[1];
        const way = ax < 4 ? 'left' : ax > W - 4 ? 'right' : h.side === 'left' ? 'pointing-right' : 'down';
        if (way !== h.way) {   // only rewritten when it changes, so the arrow's nudge carries on smoothly
          h.way = way;
          const arrow = { left: '←', right: '→', 'pointing-right': '→', down: '↓' }[way];
          h.el.innerHTML = way === 'left' ? `<span class="room-hint__arrow">${arrow}</span> ${h.label}` : `${h.label} <span class="room-hint__arrow">${arrow}</span>`;
          h.el.className = 'room-hint hand room-hint--' + (way === 'down' ? 'down' : way === 'left' ? 'left' : 'right') + (h.el.classList.contains('is-shown') ? ' is-shown' : '');
        }
        const w = h.el.offsetWidth;
        const ht = h.el.offsetHeight;
        let left;
        let top;
        if (way === 'left') { left = 8; top = ay - ht / 2; }
        else if (way === 'right') { left = W - 8 - w; top = ay - ht / 2; }
        else if (way === 'pointing-right') { left = ax - w - 10; top = ay - ht / 2; }
        else { left = ax - w / 2; top = ay - ht - 10; }
        left = Math.max(8, Math.min(W - 8 - w, left));
        top = Math.max(ceiling, Math.min(floor - ht, top));
        // never on top of another hint or anything else that can be tapped: if it would be, it moves
        // to the nearest clear spot just beside whatever is in the way (or stays put if there isn't one)
        const avoid = placed.concat(things.filter(([b]) => b !== h.target).map(([, box]) => box));
        const fits = ([x, y]) => y >= ceiling && y + ht <= floor && x >= 8 && x + w <= W - 8 &&
          !avoid.some((b) => x < b.right + 6 && x + w > b.left - 6 && y < b.bottom + 6 && y + ht > b.top - 6);
        if (!fits([left, top])) {
          const spots = [];
          const edge = way === 'left' || way === 'right';   // one waiting at the edge stays at the edge
          avoid.forEach((b) => spots.push([left, b.top - ht - 6], [left, b.bottom + 6]));
          if (!edge) avoid.forEach((b) => spots.push([b.right + 6, top], [b.left - w - 6, top]));
          const far = ([x, y]) => (x - left) ** 2 + (y - top) ** 2;
          const clear = spots.filter(fits).sort((a, b) => far(a) - far(b))[0];
          if (clear) [left, top] = clear;
        }
        placed.push({ left, top, right: left + w, bottom: top + ht });
        h.el.style.left = Math.round(left) + 'px';
        h.el.style.top = Math.round(top) + 'px';
        h.el.classList.add('is-shown');
      });
    });
  }

  // stepping in and out, the light changing, turning the phone
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  ROOMS.forEach((r) => { if (r.el) new MutationObserver(schedule).observe(r.el, { attributes: true, attributeFilter: ['class'] }); });
  window.addEventListener('resize', schedule);
  schedule();
})();
