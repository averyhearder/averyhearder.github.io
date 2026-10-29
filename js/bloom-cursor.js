/* ==========================================================================
   A Day in Bloom · the floral cursor
   On a desktop with a mouse, the pointer becomes a tiny pink cosmos with a
   slim sage leaf pointing up and to the left. The leaf's sharp tip is the
   exact click point, like the tip of a normal arrow cursor.
   The pointer itself is the browser's own cursor, given our drawing
   (assets/cursor/), so it moves exactly with the mouse, with no delay at all.
   Its looks are swapped by the stylesheet (css/bloom-cursor.css): the cosmos
   opens wider with a sage halo over anything you can click, and squeezes a
   little while you press or drag. This file only:
     · switches the floral cursor on for a real mouse (touch screens and pens
       keep their normal behaviour, and it steps aside the moment one is used)
     · lets two or three petals drift from the flower on a click
     · keeps the normal text cursor while text is being selected
   With reduced motion, no petals drift. If anything here doesn't run, the
   normal cursor simply remains.
   ========================================================================== */
(function () {
  'use strict';

  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  if (!mouse.matches || !('PointerEvent' in window)) return;

  // places to type, where the normal text cursor stays (and no petals drift)
  const TYPING = 'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="file"]):not([type="image"]), ' +
    'textarea, [contenteditable]:not([contenteditable="false"])';
  const HEAD = 15.2;   // the flower's centre, right of and below the leaf's tip (as drawn in assets/cursor/)

  // the three pictures are fetched straight away, so the first hover or press never flickers to the
  // usual cursor while one loads (they're found beside the stylesheet: ../assets/cursor/)
  const sheet = document.querySelector('link[href*="bloom-cursor.css"]');
  if (sheet) ['bloom', 'bloom-hover', 'bloom-press'].forEach((name) => { new Image().src = new URL(`../assets/cursor/${name}.svg`, sheet.href).href; });

  // the drifting petals live in their own little layer
  const drift = document.createElement('div');
  drift.className = 'bloom-cursor__drift';
  drift.setAttribute('aria-hidden', 'true');

  // ---- On for a mouse, off for touch or a pen ----------------------------------------------------
  // (once it's on, it doesn't need to watch the mouse move at all)
  let on = false;
  function enable() {
    if (on) return;
    on = true;
    document.removeEventListener('pointermove', noticeMouse);
    root.classList.add('has-bloom-cursor');
    home();
  }
  function disable() {
    if (!on) return;
    on = false;
    root.classList.remove('has-bloom-cursor', 'bloom-cursor--text');
    drift.remove();
    document.addEventListener('pointermove', noticeMouse, { passive: true });
  }
  function noticeMouse(event) { if (event.pointerType === 'mouse') enable(); }
  document.addEventListener('pointermove', noticeMouse, { passive: true });
  mouse.addEventListener('change', () => { if (!mouse.matches) disable(); });

  // ---- A click: two or three petals drift from the flower ---------------------------------------
  const COLOURS = ['#efbcc5', '#e3a1ae', '#f6d3d9'];
  let held = false;
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') { disable(); return; }   // a touch or a pen: back to normal at once
    enable();
    if (event.button !== 0) return;
    held = true;
    if (calm.matches || (event.target instanceof Element && event.target.closest(TYPING))) return;
    const x = event.clientX + HEAD;
    const y = event.clientY + HEAD;
    for (let n = 0, count = 2 + Math.round(Math.random()); n < count; n++) {
      const petal = document.createElement('i');
      // (up and away to the right, clear of the leaf)
      const angle = (-55 + (n - (count - 1) / 2) * 50 + (Math.random() * 30 - 15)) * Math.PI / 180;
      const reach = 24 + Math.random() * 14;
      petal.style.cssText = `left:${x}px; top:${y}px; background:${COLOURS[n % 3]}; ` +
        `--dx:${Math.round(Math.cos(angle) * reach)}px; --dy:${Math.round(Math.sin(angle) * reach + 14)}px; --spin:${Math.round(-200 + Math.random() * 400)}deg`;
      petal.addEventListener('animationend', () => petal.remove(), { once: true });
      drift.appendChild(petal);
    }
  }, { passive: true, capture: true });

  // ---- Pressing: the flower squeezes while the button is down (the stylesheet swaps the picture) ---
  // The pressed look is put on just the element under the pointer, so nothing else is restyled.
  let pressed = null;
  document.addEventListener('pointerdown', (event) => {
    if (!on || event.pointerType !== 'mouse' || event.button !== 0 || !(event.target instanceof Element)) return;
    pressed = event.target;
    pressed.classList.add('bloom-cursor--pressed');
  }, { passive: true, capture: true });
  const release = () => {
    held = false;
    if (pressed) { pressed.classList.remove('bloom-cursor--pressed'); pressed = null; }
    root.classList.remove('bloom-cursor--text');
  };
  document.addEventListener('pointerup', release, { passive: true, capture: true });
  document.addEventListener('pointercancel', release, { passive: true, capture: true });
  window.addEventListener('blur', release);

  // ---- Selecting text: the normal text cursor, for as long as the selection is being made ----------
  document.addEventListener('selectionchange', () => {
    if (!on || !held) return;
    const selection = document.getSelection();
    const selecting = !!selection && !selection.isCollapsed && !document.body.classList.contains('is-dragging-seed');
    if (selecting !== root.classList.contains('bloom-cursor--text')) root.classList.toggle('bloom-cursor--text', selecting);
  });

  // ---- Notes and cards that open over the page --------------------------------------------------
  // An open <dialog> sits above everything else, so while one is open the petals drift inside it.
  // (The cursor itself, being the browser's own, is always on top.)
  function home() {
    if (!on) return;
    const open = [...document.querySelectorAll('dialog[open]')].pop();
    const place = open || document.body;
    if (drift.parentNode !== place) place.appendChild(drift);
  }
  new MutationObserver(home).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
})();
