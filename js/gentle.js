/* ==========================================================================
   A Day in Bloom · a gentler garden for devices that are struggling
   If a device can't keep the garden moving smoothly, the purely ambient
   background motion rests: the drifting clouds, the swaying willow, plants
   and greenhouse flowers, the lake's shimmer and ripples, the dust motes
   and fairy lights, the willow nook's strands and dappled light. Everything
   holds still exactly where it is. The artwork, the layout, the animals,
   every interactive feature (seeds, watering, sunshine, blooming, the
   rooms, the swing, wishes, bouquets) and every hover or tap response stay
   just as they are. (On a struggling phone this roughly doubles how
   smoothly the greenhouse runs, and gives the garden about a third more.)

   It decides by watching how smoothly frames actually arrive in the garden
   once things have settled, never by the kind of device: fast phones and
   computers never see it. It switches on for the rest of the visit only after
   two slow stretches in a row. An iPhone in Low Power Mode, which slows the
   screen down on purpose, will usually get it too.

   To choose for yourself, open the page once with ?gentle=on or ?gentle=off
   (remembered in this browser); ?gentle=auto goes back to deciding by itself.
   Styles: "A gentler garden" in css/garden.css.
   ========================================================================== */
(function () {
  'use strict';

  const root = document.documentElement;
  const KEY = 'aDayInBloom.gentle';
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const set = (on) => root.classList.toggle('is-gentle', on);

  // a choice made in the address, kept for next time
  const asked = new URLSearchParams(location.search).get('gentle');
  try {
    if (asked === 'on' || asked === 'off') localStorage.setItem(KEY, asked);
    else if (asked === 'auto') localStorage.removeItem(KEY);
  } catch (error) { /* storage blocked: the choice lasts for this page only */ }
  let chosen = asked === 'on' || asked === 'off' ? asked : null;
  try { if (!chosen) chosen = localStorage.getItem(KEY); } catch (error) { /* ignore */ }
  if (chosen === 'on') { set(true); return; }
  if (chosen === 'off') return;

  // already found to be struggling earlier in this visit
  try { if (sessionStorage.getItem(KEY) === 'on') { set(true); return; } } catch (error) { /* ignore */ }
  if (calm.matches || !window.requestAnimationFrame) return;   // (reduced motion already rests everything)

  // ---- Watching how smoothly the garden runs -------------------------------------------------
  // Three-second stretches, only while the garden or a room is simply on screen: not while the page is
  // loading, a room is opening, something is being dragged, or the page is in the background.
  const body = document.body;
  const SLOW = 30;          // ms: a typical frame slower than this is under about 33 frames a second
  const STRETCH = 3000;
  let slowRuns = 0;
  let frames = [];
  let last = 0;
  let started = 0;
  let settleUntil = 0;

  const settled = () => body.classList.contains('is-garden') && !body.classList.contains('ib-running') &&
    !body.classList.contains('is-dragging-seed') && !document.hidden && !document.querySelector('dialog[open]');

  function tick(now) {
    if (root.classList.contains('is-gentle')) return;
    if (!settled() || now < settleUntil) { frames = []; last = 0; started = now; window.requestAnimationFrame(tick); return; }
    if (last) frames.push(now - last);
    last = now;
    if (now - started >= STRETCH && frames.length > 10) {
      const sorted = frames.slice().sort((a, b) => a - b);
      const typical = sorted[Math.floor(sorted.length / 2)];
      slowRuns = typical > SLOW ? slowRuns + 1 : 0;
      frames = [];
      started = now;
      if (slowRuns >= 2) {
        set(true);
        try { sessionStorage.setItem(KEY, 'on'); } catch (error) { /* ignore */ }
        return;
      }
    }
    window.requestAnimationFrame(tick);
  }

  // give each scene a few seconds to settle after loading or stepping somewhere new
  const rest = () => { settleUntil = performance.now() + 4000; frames = []; last = 0; };
  new MutationObserver(rest).observe(body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', rest);
  const begin = () => { rest(); window.requestAnimationFrame(tick); };
  if (document.readyState === 'complete') begin(); else window.addEventListener('load', begin);
})();
