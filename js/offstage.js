/* ==========================================================================
   A Day in Bloom · little movements rest while they're out of sight
   On a phone the garden and the greenhouse are wider than the screen, so
   about half of their small looping movements (the pets, wings, ripples,
   sparkles, fairy lights, dust motes) are off to one side at any moment,
   still costing the phone work on every frame. Each one now pauses while
   it's off screen and carries on as it comes back into view, so nothing
   visible changes. (In the greenhouse that is about 40% less work for the
   phone on each frame; in the garden about 15%.)

   Only movements that loop in one place are paused. Anything that travels
   across the scene (bees, butterflies, hummingbirds, birds, the swan and
   ducks, dragonflies, clouds) keeps going, so it still wanders into view,
   and every one-off animation (growing, watering, sunshine, visits, stepping
   into a room) always plays in full. Styles: .is-offstage in css/garden.css.
   ========================================================================== */
(function () {
  'use strict';

  if (!('IntersectionObserver' in window) || !document.getAnimations) return;

  // the journeys (these move things into view, so they never rest)
  const TRAVELS = /^(bee-loop|flit-|hummingbird-|sky-glide|bird-visit|robin-forage|clouds-across|cloud-sway|lk-ducks-swim|lk-swan-glide|lk-loon|lk-flit-)/;
  const watched = new WeakSet();
  // While a room or a panel covers the garden, the garden is already resting as a whole (js/main.js),
  // so its movements are left alone then, rather than all being paused and unpaused again just as a
  // room opens or closes.
  const garden = document.getElementById('garden-scene');
  const covered = () => ['in-greenhouse', 'at-lake', 'at-willow', 'has-panel'].some((name) => document.body.classList.contains(name));
  const watch = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (garden && covered() && garden.contains(entry.target)) return;
    entry.target.classList.toggle('is-offstage', !entry.isIntersecting);
  }), { rootMargin: '10%' });   // (resumed a little before it scrolls into view)

  // looks for looping movements not yet watched (new ones appear as rooms are painted and opened)
  function scan() {
    document.getAnimations().forEach((animation) => {
      const target = animation.effect && animation.effect.target;
      if (!target || watched.has(target) || !animation.animationName || TRAVELS.test(animation.animationName)) return;
      if (animation.effect.getTiming().iterations !== Infinity) return;
      watched.add(target);
      watch.observe(target);
    });
  }

  // looked for once the page has loaded, and again only when the visitor steps into the garden or a
  // room (where new movements begin), not on every little change of the page's state
  const PLACES = ['is-garden', 'in-greenhouse', 'at-lake', 'at-willow'];
  const where = () => PLACES.filter((name) => document.body.classList.contains(name)).join(' ');
  let place = where();
  let pending = 0;
  new MutationObserver(() => {
    const now = where();
    if (now === place) return;
    place = now;
    window.clearTimeout(pending);
    pending = window.setTimeout(scan, 1200);   // (once the room has opened)
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (document.readyState === 'complete') scan(); else window.addEventListener('load', scan);
})();
