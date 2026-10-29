/* ==========================================================================
   A Day in Bloom · the garden signpost on phones and tablets
   On a touch screen the six boards are too small and close together to tap
   accurately, so the first tap on any board gently enlarges the whole
   signpost (the same illustration, just bigger: each board about 44px tall)
   in the clear space above the beds. A tap on a board then goes there.
   A tap anywhere else, a swipe of the garden, Escape or the browser's Back
   button simply closes it again (the tap that closes it does nothing else).
   Keyboard presses always follow the board straight away, and on computers
   (mouse or trackpad) nothing here runs: the signpost works as it always has.
   Styles: "The signpost on phones and tablets" in css/garden.css.
   ========================================================================== */
(function () {
  'use strict';

  const touch = window.matchMedia('(hover: none) and (pointer: coarse)');
  const post = document.querySelector('.garden-signpost');
  const viewport = document.getElementById('garden-viewport');
  const scene = document.getElementById('garden-scene');
  if (!post || !viewport || !scene) return;

  const TARGET = 44;   // the height each board's tap area grows to, in screen pixels
  let open = false;
  let pendingHash = null;   // where to go once the enlarged view has closed
  let fallback;

  // a leftover entry from a signpost opened before a reload: forget it
  if (history.state && history.state.signpost) history.replaceState(null, '');

  // how big, and where: centred in the space between the header and the instruction band
  function place() {
    post.style.removeProperty('--sp-k');
    const r = post.getBoundingClientRect();
    const v = viewport.getBoundingClientRect();
    let top = v.top;
    document.querySelectorAll('.site-nav, .garden-controls').forEach((el) => {
      const b = el.getBoundingClientRect();
      if (b.height) top = Math.max(top, b.bottom);
    });
    let bottom = Math.min(v.bottom, scene.getBoundingClientRect().bottom);
    const bar = document.querySelector('.instruction-bar');
    if (bar && getComputedStyle(bar).opacity !== '0') bottom = Math.min(bottom, bar.getBoundingClientRect().top);
    const pitch = r.height * 24 / 176;   // one board every 24 of the signpost's 176 units
    const k = Math.max(1.4, Math.min(TARGET / pitch, (v.width - 32) / r.width, (bottom - top - 16) / r.height));
    const x = v.left + v.width / 2 - r.width * k / 2 - r.left;
    const y = (top + bottom) / 2 - r.height * k / 2 - r.top;
    post.style.setProperty('--sp-x', Math.round(x) + 'px');
    post.style.setProperty('--sp-y', Math.round(y) + 'px');
    post.style.setProperty('--sp-k', k.toFixed(3));
  }

  function show() {
    place();
    open = true;
    post.classList.add('is-enlarged');
    document.body.classList.add('signpost-open');
    history.pushState({ signpost: true }, '');   // so the browser's Back button closes it
    if (window.GardenSound) window.GardenSound.play('seed');   // the same soft rustle as parting the willow
  }

  function hide() {
    if (!open) return;
    open = false;
    post.classList.remove('is-enlarged');
    document.body.classList.remove('signpost-open');
  }

  // close by stepping back off the entry added on opening (then, if a board or link was tapped, go there)
  function dismiss(hash) {
    if (!open) return;
    pendingHash = hash || null;
    if (history.state && history.state.signpost) {
      history.back();
      window.clearTimeout(fallback);
      fallback = window.setTimeout(settle, 450);   // should the browser not report the step back
    } else settle();
  }
  function settle() {
    window.clearTimeout(fallback);
    hide();
    if (pendingHash) {
      const hash = pendingHash;
      pendingHash = null;
      location.hash = hash;
    }
  }
  window.addEventListener('popstate', () => { if (open || pendingHash) settle(); });

  // a tap on a board: the first one enlarges the signpost, the next follows the board
  post.addEventListener('click', (event) => {
    const board = event.target.closest('.signpost-board');
    if (!board || !touch.matches || event.detail === 0) return;   // keyboard: straight there
    event.preventDefault();
    if (open) dismiss(board.getAttribute('href'));
    else show();
  });

  // while it's enlarged, a tap elsewhere in the garden only closes it (it doesn't plant, open or
  // pick anything up); links in the menu still lead where they go, and other buttons still work
  function outside(event) {
    if (!open || post.contains(event.target)) return;
    const inGarden = viewport.contains(event.target);
    if (event.type === 'click') {
      const link = event.target.closest('a[href^="#"]');
      if (inGarden || link) { event.preventDefault(); event.stopPropagation(); }
      dismiss(link && !inGarden ? link.getAttribute('href') : null);
    } else if (inGarden) {
      event.stopPropagation();   // pointerdown: no drag or watering starts
    }
  }
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('click', outside, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) { event.stopPropagation(); dismiss(); }
  }, true);

  // swiping along the garden, turning the phone or leaving the garden closes it too
  viewport.addEventListener('scroll', () => dismiss(), { passive: true });
  window.addEventListener('resize', () => dismiss());
  window.addEventListener('hashchange', () => { if (open && !pendingHash) hide(); });
})();
