/* ==========================================================================
   A Day in Bloom · garden life
   - Sends two hummingbirds on occasional visits to the flowers
   - Clicking the feeder invites a hummingbird to hover and drink (and, while
     it drinks, makes it flutter up with a tiny chip)
   - Sends the chickadee to the birdbath now and then; clicking the birdbath
     invites it, or makes it splash and shake its feathers
   (Bees, butterflies, sparrows, boats, clouds, willow and breeze are pure CSS
   in garden.css.) Nothing flies around for visitors who prefer reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hummingbirds = [document.getElementById('hummingbird-1'), document.getElementById('hummingbird-2')];
  const feederBird = document.getElementById('hummingbird-feeder');
  const feeder = document.getElementById('feeder');
  const chickadee = document.getElementById('birdbath-bird');

  // Flowers the hummingbirds like to visit (garden units: where the beak arrives)
  const FLOWER_SPOTS = [
    { x: 1500, y: 735 },   // terracotta pots
    { x: 300, y: 684 },    // left border
    { x: 1150, y: 640 },   // path border
    { x: 1290, y: 690 }    // right border, by the bench
  ];
  // Where a hummingbird sits to drink from the feeder's left flower port
  const FEEDER_SPOT = { x: 179, y: 577 };

  // Bees and butterflies share one drawing each; paste in real copies so
  // every browser can flap their wings
  document.querySelectorAll('.critters svg > use').forEach((use) => {
    const art = document.getElementById(use.getAttribute('href').slice(1));
    const copy = art.cloneNode(true);
    copy.removeAttribute('id');
    use.replaceWith(copy);
  });

  function canAnimate() {
    const away = ['has-panel', 'in-greenhouse', 'at-lake', 'at-willow'].some((name) => document.body.classList.contains(name));
    return !reduceMotion.matches && !document.hidden && !away;
  }

  function place(bird, spot) {
    bird.style.setProperty('--x', spot.x);
    bird.style.setProperty('--y', spot.y);
  }

  function visit(element, className, duration) {
    element.classList.remove(className);
    void element.getBoundingClientRect();          // restart the CSS animation
    element.classList.add(className);
    element.dataset.busy = 'true';
    window.setTimeout(() => {
      element.classList.remove(className);
      delete element.dataset.busy;
    }, duration);
  }

  // ---- Wandering hummingbirds --------------------------------------------
  function scheduleHummingbird(bird, delay) {
    window.setTimeout(() => {
      if (canAnimate() && !bird.dataset.busy) {
        place(bird, FLOWER_SPOTS[Math.floor(Math.random() * FLOWER_SPOTS.length)]);
        visit(bird, 'is-visiting', 9200);
      }
      scheduleHummingbird(bird, 22000 + Math.random() * 20000);
    }, delay);
  }

  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };

  // ---- The feeder ---------------------------------------------------------
  // A click invites a hummingbird (with a tiny chip as it arrives); a click while it's drinking makes
  // it flutter up for a moment, chipping, then settle back to the feeder.
  function inviteToFeeder() {
    if (feederBird.dataset.busy) {
      sfx('hummingbird');
      if (!reduceMotion.matches) {
        feederBird.classList.remove('is-fluttering');
        void feederBird.getBoundingClientRect();
        feederBird.classList.add('is-fluttering');
        window.setTimeout(() => feederBird.classList.remove('is-fluttering'), 750);
      }
      return;
    }
    place(feederBird, FEEDER_SPOT);
    if (reduceMotion.matches) {
      visit(feederBird, 'is-resting', 5000);        // simply appears, no flying
      sfx('hummingbird');
    } else {
      visit(feederBird, 'is-feeding', 11200);
      window.setTimeout(() => sfx('hummingbird'), 1400);   // as it arrives at the feeder
    }
    if (window.GardenUI) window.GardenUI.showNote('A hummingbird stops by for a little sip of nectar ✿');
  }

  feeder.addEventListener('click', inviteToFeeder);

  // Every so often, a hummingbird visits the feeder on its own too
  function scheduleFeederVisit(delay) {
    window.setTimeout(() => {
      if (canAnimate() && !feederBird.dataset.busy) {
        place(feederBird, FEEDER_SPOT);
        visit(feederBird, 'is-feeding', 11200);
      }
      scheduleFeederVisit(45000 + Math.random() * 30000);
    }, delay);
  }

  // ---- Chickadee at the birdbath -----------------------------------------
  function scheduleChickadee(delay) {
    window.setTimeout(() => {
      if (canAnimate() && !chickadee.dataset.busy) visit(chickadee, 'is-visiting', 11200);
      scheduleChickadee(24000 + Math.random() * 20000);
    }, delay);
  }

  // A click on the birdbath: if the chickadee is there, it splashes and shakes its feathers with a
  // tiny water sound; if not, it drops in, and has its splash as soon as it lands.
  const birdbath = document.getElementById('birdbath');
  const bowl = document.getElementById('birdbath-bowl');   // the invisible button over the bowl
  let splashTimer = 0;
  // hovering (or focusing) the bowl lifts the birdbath, like the garden's other clickable things
  ['pointerenter', 'focus'].forEach((type) => bowl.addEventListener(type, () => birdbath.classList.add('is-hovered')));
  ['pointerleave', 'blur'].forEach((type) => bowl.addEventListener(type, () => birdbath.classList.remove('is-hovered')));
  function splash() {
    sfx('splash');
    if (reduceMotion.matches) return;   // just the sound: no droplets or shaking
    birdbath.classList.remove('is-splashing');
    void birdbath.getBoundingClientRect();
    birdbath.classList.add('is-splashing');
    window.clearTimeout(splashTimer);
    splashTimer = window.setTimeout(() => birdbath.classList.remove('is-splashing'), 850);
  }
  bowl.addEventListener('click', () => {
    if (birdbath.classList.contains('is-splashing')) return;
    if (chickadee.dataset.busy) { splash(); return; }
    if (reduceMotion.matches) {
      visit(chickadee, 'is-resting', 5000);
      splash();
    } else {
      visit(chickadee, 'is-visiting', 11200);
      window.setTimeout(splash, 1100);     // once it has landed on the rim
    }
    if (window.GardenUI) window.GardenUI.showNote('A chickadee drops in for a splash ✿');
  });

  scheduleHummingbird(hummingbirds[0], 7000);
  scheduleHummingbird(hummingbirds[1], 19000);
  scheduleFeederVisit(32000);
  scheduleChickadee(3500);
})();
