/* ==========================================================================
   A Day in Bloom · the growing game

   The full game, step by step:
     1. choose  – pick a seed packet from the basket          ✓ built
     2. plant   – drag (or tap) it into the matching bed       ✓ built
     3. water   – drag (or tap) the watering can to a sprout   ✓ built
     4. sun     – drag (or tap) the sun over a watered bed     ✓ built
     5. bloom   – the sprout grows into its flower             ✓ built
     6. explore – click the bloom to open its project          ✓ built
   (The flower drawings live in js/flowers.js.)

   Progress is saved in the browser (localStorage), so it's still there
   after visiting the notebook, a project page, or coming back later.
   ========================================================================== */
(function () {
  'use strict';

  // ---- The three project flowers ------------------------------------------
  const FLOWERS = {
    snapdragon: { name: 'Snapdragon', number: '01', title: 'LumiEdge', project: 'projects/snapdragon.html' },
    // title = short label for the garden sign; longTitle = full name where there's room
    ranunculus: { name: 'Ranunculus', number: '02', title: 'Modunest', longTitle: 'The Future of Workplace Design', project: 'projects/ranunculus.html' },
    cosmos:     { name: 'Cosmos',     number: '03', title: 'Lucy’s Cottage', project: 'projects/cosmos.html' }
  };
  const FLOWER_KEYS = Object.keys(FLOWERS);

  // Growth stages a bed moves through (written to the bed as data-state)
  const STAGES = ['empty', 'sprout', 'watered', 'bud', 'bloom'];

  // Instruction bar wording
  const STEPS = ['choose', 'plant', 'water', 'sun', 'bloom', 'explore'];
  const MESSAGES = {
    choose: 'Every great idea starts with a seed. Choose a flower to begin.',
    chooseMore: 'Lovely! Choose another seed to plant ✿',
    plant: (f) => `${f.name} seeds chosen ✿ Drag the packet to its glowing bed, or tap the bed to plant.`,
    water: 'Your seeds are planted! Give them a little water ♡',
    canHeld: 'Watering can in hand ✿ Drag it over a sprout, or tap a glowing bed.',
    sun: 'Looking lovely! Now let’s give your flowers some sunshine ☀',
    sunHeld: 'The sun is in your hands ☀ Drag it across the sky to a watered bed, or tap a glowing bed.',
    blooming: 'Every design begins as an idea, shaped through experimentation, thoughtful decisions and care.',
    allBloomed: 'Everything is in bloom! Click a flower to explore the project ✿'
  };

  const SAVE_KEY = 'aDayInBloom.garden.v1';

  // ---- What the garden remembers -------------------------------------------
  const state = {
    selected: null,       // which seed is in hand
    canHeld: false,       // watering can picked up (tap mode)
    sunHeld: false,       // sun picked up (tap mode)
    busy: false,          // the can is pouring or the sun is shining
    beds: load()
  };

  function load() {
    const fresh = { snapdragon: 'empty', ranunculus: 'empty', cosmos: 'empty' };
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && saved.beds) {
        FLOWER_KEYS.forEach((f) => {
          if (STAGES.includes(saved.beds[f])) fresh[f] = saved.beds[f];
        });
      }
    } catch (error) { /* private browsing or storage blocked: start fresh */ }
    return fresh;
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ beds: state.beds })); } catch (error) { /* ignore */ }
  }

  const isPlanted = (flower) => state.beds[flower] !== 'empty';
  const needsWater = (flower) => state.beds[flower] === 'sprout';
  const isWatered = (flower) => STAGES.indexOf(state.beds[flower]) >= STAGES.indexOf('watered');
  const isReadyForSun = (flower) => state.beds[flower] === 'watered';
  const isBloomed = (flower) => state.beds[flower] === 'bloom';

  // ---- Page elements ----------------------------------------------------------
  const packets = document.querySelectorAll('.seed-packet');
  const beds = document.querySelectorAll('.garden-bed');
  const can = document.getElementById('watering-can');
  const sun = document.getElementById('sun');
  const instructionText = document.getElementById('instruction-text');
  const stepDots = document.querySelectorAll('.growth-steps li');
  const resetButton = document.getElementById('garden-reset');

  const bedFor = (flower) => document.querySelector(`.garden-bed[data-flower="${flower}"]`);
  const packetFor = (flower) => document.querySelector(`.seed-packet[data-flower="${flower}"]`);

  // each bed gets a layer of damp soil that appears once it's watered
  beds.forEach((bed) => {
    const wet = document.createElement('span');
    wet.className = 'bed-soil-wet';
    wet.setAttribute('aria-hidden', 'true');
    bed.insertBefore(wet, bed.querySelector('.bed-plant'));
    bed.dataset.tag = bed.querySelector('.prop-tag').textContent;   // remember the original hover label
  });

  function note(text) {
    if (window.GardenUI) window.GardenUI.showNote(text);
  }

  // soft sound effects (js/sound.js); silent unless the visitor has turned sound on
  const sfx = (name) => (window.GardenSound ? window.GardenSound.play(name) : false);

  // ---- Instruction bar + glowing hints ----------------------------------------
  function setStep(step, text) {
    const index = STEPS.indexOf(step);
    stepDots.forEach((dot, i) => {
      dot.classList.toggle('is-done', i < index);
      dot.classList.toggle('is-current', i === index);
    });
    instructionText.textContent = text;
  }

  function refresh() {
    const anyPlanted = FLOWER_KEYS.some(isPlanted);
    const anyThirsty = FLOWER_KEYS.some(needsWater);
    const allWatered = FLOWER_KEYS.every(isWatered);
    const anyWatered = FLOWER_KEYS.some(isWatered);
    const anyReady = FLOWER_KEYS.some(isReadyForSun);
    const anyBloomed = FLOWER_KEYS.some(isBloomed);
    const allBloomed = FLOWER_KEYS.every(isBloomed);

    if (state.selected) setStep('plant', MESSAGES.plant(FLOWERS[state.selected]));
    else if (state.canHeld) setStep('water', MESSAGES.canHeld);
    else if (state.sunHeld) setStep('sun', MESSAGES.sunHeld);
    else if (allBloomed) setStep('explore', MESSAGES.allBloomed);
    else if (anyBloomed) setStep('bloom', MESSAGES.blooming);
    else if (allWatered || (anyReady && !anyThirsty)) setStep('sun', MESSAGES.sun);
    else if (anyThirsty) setStep('water', MESSAGES.water);
    else if (anyWatered) setStep('choose', MESSAGES.chooseMore);
    else setStep('choose', MESSAGES.choose);

    resetButton.hidden = !anyPlanted;

    beds.forEach((bed) => {
      const flower = bed.dataset.flower;
      const thirsty = state.canHeld && needsWater(flower);
      const sunReady = state.sunHeld && isReadyForSun(flower);
      bed.classList.toggle('is-target', state.selected === flower);
      bed.classList.toggle('is-thirsty', thirsty);
      bed.classList.toggle('is-sun-ready', sunReady);
      bed.querySelector('.bed-hint').textContent = thirsty ? 'water me ♡' : sunReady ? 'sunshine here ☀' : 'plant me here';
    });
    packets.forEach((packet) => packet.setAttribute('aria-pressed', String(packet.dataset.flower === state.selected)));
    can.setAttribute('aria-pressed', String(state.canHeld));
    can.classList.toggle('is-held', state.canHeld);
    sun.setAttribute('aria-pressed', String(state.sunHeld));
    sun.classList.toggle('is-held', state.sunHeld);
    scheduleGuide();   // the phone arrow points to whatever is needed next
  }

  // ---- Choosing a seed / picking up the can ------------------------------------
  function selectSeed(flower) {
    if (flower && isPlanted(flower)) flower = null;
    if (flower && flower !== state.selected) sfx('seed');
    state.selected = flower;
    if (flower) { state.canHeld = false; state.sunHeld = false; }
    refresh();
  }

  function holdCan(held) {
    state.canHeld = held;
    if (held) { state.selected = null; state.sunHeld = false; }
    refresh();
  }

  function holdSun(held) {
    state.sunHeld = held;
    if (held) { state.selected = null; state.canHeld = false; }
    refresh();
  }

  // ---- Drawing a bed to match the saved state ----------------------------------
  const SPROUT_SVG =
    '<svg class="sprout" viewBox="0 0 40 50" aria-hidden="true">' +
      '<ellipse cx="20" cy="47.5" rx="10" ry="2.4" fill="#3b2a1f" opacity=".55"/>' +
      '<ellipse cx="20" cy="46.6" rx="6" ry="1.2" fill="#7a5f4b" opacity=".7"/>' +
      '<g class="sprout__plant">' +
        '<path d="M20 47 C20 40 19 34 20 26" stroke="#5f7a4a" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 31 C14 31 8 27 7 20 C14 19 19 24 20 31 Z" fill="#8fb069"/>' +
        '<path d="M19 30.4 C15 28.6 11 25.4 9 21.6" stroke="#c9dca9" stroke-width=".6" fill="none"/>' +
        '<path d="M20 27 C26 26 32 21 33 14 C26 14 21 19 20 27 Z" fill="#a3c27c"/>' +
        '<path d="M21 26.2 C25 24 29 20 31 15.6" stroke="#d5e5b8" stroke-width=".6" fill="none"/>' +
        '<path d="M20 26 C19.4 23 20 21 22.4 19.4 C22.6 22 21.8 24.4 20 26 Z" fill="#b8d48f"/>' +
      '</g>' +
    '</svg>';

  // after watering: a taller, perkier sprout with new true leaves
  const SPROUT_WATERED_SVG =
    '<svg class="sprout sprout--watered" viewBox="0 0 40 60" aria-hidden="true">' +
      '<ellipse cx="20" cy="57.5" rx="10.5" ry="2.5" fill="#2a1d14" opacity=".6"/>' +
      '<ellipse cx="20" cy="56.6" rx="6" ry="1.2" fill="#5b4332" opacity=".8"/>' +
      '<g class="sprout__plant">' +
        '<path d="M20 57 C20 48 19 39 20 24" stroke="#5a7745" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 41 C14 40 8 35 7 28 C14 27 19 33 20 41 Z" fill="#86ab61"/>' +
        '<path d="M19 40.4 C15 38.6 11 35.4 9 29.6" stroke="#c9dca9" stroke-width=".6" fill="none"/>' +
        '<path d="M20 38 C26 37 32 32 33 25 C26 25 21 30 20 38 Z" fill="#9cc075"/>' +
        '<path d="M21 37.2 C25 35 29 31 31 26.6" stroke="#d5e5b8" stroke-width=".6" fill="none"/>' +
        '<g class="sprout__new">' +
          '<path d="M20 29 C15 27 11.5 22 11.5 15.5 C17 17.5 20 22.5 20 29 Z" fill="#79a257"/>' +
          '<path d="M19.4 28 C16.6 25.4 14.4 21.6 13.2 17.4" stroke="#c9dca9" stroke-width=".5" fill="none"/>' +
          '<path d="M20 27 C25 24 28.5 19 28.5 12.5 C23 14.5 20 19.5 20 27 Z" fill="#92ba6b"/>' +
          '<path d="M20.6 26 C23.4 23 26 19 27.2 14.6" stroke="#d5e5b8" stroke-width=".5" fill="none"/>' +
          '<path d="M20 24.5 C19.2 20.5 20 17.5 22.8 15.4 C23.2 18.6 22.2 21.8 20 24.5 Z" fill="#b2d38a"/>' +
        '</g>' +
      '</g>' +
    '</svg>';

  const BURST_HTML =
    '<span class="plant-burst" aria-hidden="true">' +
      '<i class="seed-drop"></i><i class="seed-drop"></i><i class="seed-drop"></i>' +
      '<i class="soil-bit"></i><i class="soil-bit"></i><i class="soil-bit"></i>' +
      '<i class="soil-bit"></i><i class="soil-bit"></i><i class="soil-bit"></i>' +
    '</span>';

  // kind: 'water' (cool blue twinkles) or 'sun' (warm golden ones)
  function sparklesHTML(kind) {
    let html = `<span class="${kind === 'sun' ? 'sun-sparkles' : 'water-sparkles'}" aria-hidden="true">`;
    for (let i = 0; i < 9; i++) {
      const left = 18 + Math.random() * 64;
      const bottom = 2 + Math.random() * 26;
      const height = kind === 'sun' ? 2 + Math.random() * 60 : bottom;
      html += `<i style="left:${left.toFixed(1)}%; bottom:${height.toFixed(1)}%; animation-delay:${(i * 0.13).toFixed(2)}s"></i>`;
    }
    return html + '</span>';
  }

  // the little wooden stake that appears beside a bloom
  function signHTML(info) {
    return '<span class="bloom-sign" aria-hidden="true"><span class="bloom-sign__board">' +
      `<b>Project ${info.number}</b><i>${info.title ? info.title + ' →' : 'view project →'}</i></span></span>`;
  }

  // effect: false (just draw), 'plant', 'water' or 'bloom' (play that animation)
  function renderBed(flower, effect) {
    const bed = bedFor(flower);
    const plant = bed.querySelector('.bed-plant');
    const packet = packetFor(flower);
    const stage = state.beds[flower];
    const info = FLOWERS[flower];
    const tag = bed.querySelector('.prop-tag');
    const oldSign = bed.querySelector('.bloom-sign');

    bed.dataset.state = stage;
    plant.dataset.stage = stage;
    if (oldSign) oldSign.remove();
    bed.classList.toggle('is-bloomed', stage === 'bloom');
    tag.textContent = stage === 'bloom'
      ? `Open ${info.title ? info.title + ' · Project ' + info.number : 'Project ' + info.number + ' · ' + info.name} ✿`
      : bed.dataset.tag;

    if (stage === 'empty') {
      plant.innerHTML = '';
      bed.classList.remove('is-planted', 'is-planting', 'is-watered', 'is-perking', 'is-thirsty', 'is-blooming', 'is-sun-ready');
      bed.setAttribute('aria-label', `${info.name} planting bed, Project ${info.number} (empty)`);
      packet.classList.remove('is-planted');
      packet.removeAttribute('aria-disabled');
      packet.setAttribute('aria-label', `${info.name} seed packet`);
      return;
    }

    const watered = isWatered(flower);
    const bloomed = stage === 'bloom';
    let art = SPROUT_SVG;
    if (bloomed && window.BloomArt) art = window.BloomArt[flower];
    else if (watered) art = SPROUT_WATERED_SVG;
    plant.innerHTML =
      (effect === 'plant' ? BURST_HTML : '') +
      (effect === 'water' ? sparklesHTML('water') : '') +
      (effect === 'bloom' ? sparklesHTML('sun') : '') +
      art;
    bed.classList.add('is-planted');
    bed.classList.toggle('is-watered', watered);
    if (bloomed) bed.insertAdjacentHTML('beforeend', signHTML(info));

    let status = 'planted: needs a little water';
    if (bloomed) status = `in bloom: open ${info.longTitle || info.title || 'Project ' + info.number}`;
    else if (watered) status = 'planted and watered: ready for sunshine';
    bed.setAttribute('aria-label', `${info.name} bed, Project ${info.number} (${status})`);
    packet.classList.add('is-planted');
    packet.setAttribute('aria-disabled', 'true');
    packet.setAttribute('aria-label', `${info.name} seed packet (already planted)`);

    if (effect) {
      const className = { plant: 'is-planting', water: 'is-perking', bloom: 'is-blooming' }[effect];
      bed.classList.add(className);
      window.setTimeout(() => {
        bed.classList.remove(className);
        plant.querySelectorAll('.plant-burst, .water-sparkles, .sun-sparkles').forEach((el) => el.remove());
      }, effect === 'bloom' ? 3200 : 2400);
    }
  }

  // ---- Step 2: planting --------------------------------------------------------
  function plant(flower) {
    if (isPlanted(flower)) return;
    state.beds[flower] = 'sprout';
    save();
    sfx('plant');
    selectSeed(null);
    renderBed(flower, 'plant');
    if (FLOWER_KEYS.every(isPlanted)) note('All three seeds are planted ✿ Time for a little water.');
    else note(`Planted! A little ${FLOWERS[flower].name} sprout is on its way ✿`);
  }

  function tryPlant(bed) {
    const flower = bed.dataset.flower;
    const info = FLOWERS[flower];
    if (needsWater(flower)) {
      note(`The ${info.name} is planted ✿ Pick up the watering can to give it a drink.`);
    } else if (isReadyForSun(flower)) {
      note(`The ${info.name} is ready for sunshine ☀ Pick up the sun and bring it over.`);
    } else if (isPlanted(flower)) {
      note(`The ${info.name} is in bloom ✿`);
    } else if (!state.selected) {
      note(`This is the ${info.name} bed. Choose the ${info.name} seed packet from the basket to plant it.`);
    } else if (state.selected === flower) {
      plant(flower);
    } else {
      note(`This is the ${info.name} bed. The ${FLOWERS[state.selected].name} seeds belong in the glowing bed.`);
    }
  }

  // ---- Generous drop areas -------------------------------------------------------
  // Each bed counts from well above its rim (where the flower grows) to just below its base.
  function bedAt(x, y) {
    let best = null;
    let bestDistance = Infinity;
    beds.forEach((bed) => {
      const r = bed.getBoundingClientRect();
      const inside = x > r.left - r.width * 0.1 && x < r.right + r.width * 0.1 &&
                     y > r.top - r.height * 0.85 && y < r.bottom + r.height * 0.15;
      if (!inside) return;
      const distance = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
      if (distance < bestDistance) { best = bed; bestDistance = distance; }
    });
    return best;
  }

  function markHover(over) {
    beds.forEach((bed) => bed.classList.toggle('is-drop-hover', bed === over));
  }

  // ---- Edge scrolling: on narrow screens the garden glides sideways when
  //      you drag a packet or the can near the left or right edge ----------------
  const viewport = document.getElementById('garden-viewport');
  const edge = { x: null, frame: 0, onScroll: null };

  function followEdge(x, onScroll) {
    edge.x = x;
    edge.onScroll = onScroll;
    if (!edge.frame) edge.frame = requestAnimationFrame(edgeStep);
  }

  function edgeStep() {
    edge.frame = 0;
    if (edge.x === null) return;
    const zone = 56;
    let speed = 0;
    if (edge.x < zone) speed = -Math.ceil((zone - edge.x) / 4);
    else if (edge.x > window.innerWidth - zone) speed = Math.ceil((edge.x - (window.innerWidth - zone)) / 4);
    if (speed) {
      const before = viewport.scrollLeft;
      viewport.scrollLeft += speed;
      if (viewport.scrollLeft !== before && edge.onScroll) edge.onScroll();
    }
    edge.frame = requestAnimationFrame(edgeStep);
  }

  function stopEdge() {
    edge.x = null;
    cancelAnimationFrame(edge.frame);
    edge.frame = 0;
  }

  // ---- Dragging a seed packet (mouse, pen or finger) -----------------------------
  let drag = null;
  let suppressClick = false;

  function startDrag(packet, event) {
    const rect = packet.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'seed-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = rect.width * 1.15 + 'px';
    ghost.appendChild(packet.querySelector('svg').cloneNode(true));
    document.body.appendChild(ghost);
    drag.ghost = ghost;
    drag.half = { x: rect.width * 0.575, y: rect.height * 0.45 };
    packet.classList.add('is-dragging');
    document.body.classList.add('is-dragging-seed');
    selectSeed(drag.flower);
    moveGhost(event.clientX, event.clientY);
  }

  function moveGhost(x, y) {
    drag.ghost.style.transform = `translate(${x - drag.half.x}px, ${y - drag.half.y}px) rotate(-6deg)`;
    markHover(bedAt(x, y));
  }

  function endDrag() {
    stopEdge();
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    drag.packet.classList.remove('is-dragging');
    document.body.classList.remove('is-dragging-seed');
    markHover(null);
    drag = null;
  }

  packets.forEach((packet) => {
    const flower = packet.dataset.flower;
    packet.setAttribute('draggable', 'false');

    packet.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || isPlanted(flower) || state.busy) return;
      drag = { packet, flower, x: event.clientX, y: event.clientY, id: event.pointerId, moved: false, ghost: null };
      try { packet.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
    });

    packet.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
        drag.moved = true;
        startDrag(packet, event);
      }
      const x = event.clientX;
      const y = event.clientY;
      moveGhost(x, y);
      followEdge(x, () => { if (drag && drag.ghost) moveGhost(x, y); });
      event.preventDefault();
    });

    packet.addEventListener('pointerup', (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const wasDragged = drag.moved;
      endDrag();
      if (!wasDragged) return;                           // a plain tap: the click handler takes over
      suppressClick = true;
      window.setTimeout(() => { suppressClick = false; }, 0);
      const bed = bedAt(event.clientX, event.clientY);
      if (bed) tryPlant(bed);
      else note('Drop the packet onto its glowing bed to plant it ✿');
    });

    packet.addEventListener('pointercancel', endDrag);

    // Tap / click / keyboard: choose (or put back) this seed
    packet.addEventListener('click', (event) => {
      event.stopPropagation();
      if (suppressClick || state.busy) return;
      if (isPlanted(flower)) {
        note(`The ${FLOWERS[flower].name} is already planted and growing ✿`);
        return;
      }
      selectSeed(state.selected === flower ? null : flower);
    });
  });

  // ---- Step 3: watering ------------------------------------------------------------
  const TIP = { x: 0.0625, y: 0.275 };        // the spout's tip, as a fraction of the can's drawing
  const POUR_ANGLE = -28;                       // degrees the can tilts to pour
  let canDrag = null;
  let canSuppressClick = false;

  // The can's resting spot, measured without any lift, tilt or hover effect
  function canHome() {
    const transform = can.style.transform;
    const transition = can.style.transition;
    can.style.transition = 'none';
    can.style.transform = 'none';
    const rect = can.getBoundingClientRect();
    can.style.transform = transform;
    can.style.transition = transition;
    return rect;
  }

  function canTransform(dx, dy, angle) {
    can.style.transform = `translate(${dx}px, ${dy}px) rotate(${angle}deg)`;
  }

  // Where the can must go so its spout pours just above the sprout
  function pourPlacement(bed, home) {
    const r = bed.getBoundingClientRect();
    const soilY = r.top + r.height * 0.22;
    const pour = { x: r.left + r.width * 0.53, y: soilY - r.height * 0.62 };
    const angle = POUR_ANGLE * Math.PI / 180;
    const tip = { x: (TIP.x - 0.5) * home.width, y: (TIP.y - 0.5) * home.height };
    const turned = {
      x: tip.x * Math.cos(angle) - tip.y * Math.sin(angle),
      y: tip.x * Math.sin(angle) + tip.y * Math.cos(angle)
    };
    return {
      dx: pour.x - turned.x - (home.left + home.width / 2),
      dy: pour.y - turned.y - (home.top + home.height / 2),
      pour: pour,
      soilY: soilY
    };
  }

  function pourWater(pour, soilY) {
    const stream = document.createElement('div');
    stream.className = 'water-pour';
    stream.setAttribute('aria-hidden', 'true');
    stream.style.left = pour.x + 'px';
    stream.style.top = pour.y + 'px';
    stream.style.setProperty('--fall', Math.max(20, soilY - pour.y) + 'px');
    let drops = '';
    for (let i = 0; i < 14; i++) {
      drops += `<i class="water-drop" style="--dx:${(Math.random() * 10 - 5).toFixed(1)}px; animation-delay:${(i * 0.09).toFixed(2)}s"></i>`;
    }
    stream.innerHTML = drops + '<i class="water-splash"></i><i class="water-splash water-splash--late"></i>';
    document.body.appendChild(stream);
    window.setTimeout(() => stream.remove(), 2200);
  }

  function returnCan() {
    can.classList.remove('is-carried');
    can.style.transition = 'transform .7s cubic-bezier(.22, .61, .36, 1)';
    canTransform(0, 0, 0);
    window.setTimeout(() => {
      can.style.transform = '';
      can.style.transition = '';
      can.classList.remove('is-pouring');
    }, 750);
  }

  function water(bed, home) {
    const flower = bed.dataset.flower;
    const place = pourPlacement(bed, home);
    state.busy = true;
    state.canHeld = false;
    refresh();
    markHover(null);
    can.classList.remove('is-carried');
    can.classList.add('is-pouring');

    // 1. glide over the bed, already tipping forward
    can.style.transition = 'transform .55s cubic-bezier(.22, .61, .36, 1)';
    canTransform(place.dx, place.dy, -12);

    // 2. tilt and pour
    window.setTimeout(() => {
      can.style.transition = 'transform .35s ease-out';
      canTransform(place.dx, place.dy, POUR_ANGLE);
      pourWater(place.pour, place.soilY);
      sfx('water');
    }, 560);

    // 3. the soil darkens, sparkles appear and the sprout perks up
    window.setTimeout(() => {
      state.beds[flower] = 'watered';
      save();
      renderBed(flower, 'water');
    }, 1500);

    // 4. back to its spot
    window.setTimeout(() => {
      returnCan();
      state.busy = false;
      refresh();
      if (FLOWER_KEYS.every(isWatered)) note('Every flower has had a drink ✿ Next comes a little sunshine.');
      else note(`Ahh, a nice drink for the ${FLOWERS[flower].name} ✿`);
    }, 2350);
  }

  function tryWater(bed) {
    const flower = bed.dataset.flower;
    const info = FLOWERS[flower];
    if (!isPlanted(flower)) {
      note(`The ${info.name} bed is still empty. Plant its seed first, then give it some water ✿`);
    } else if (!needsWater(flower)) {
      note(`The ${info.name} has already had a drink ✿`);
    } else {
      water(bed, canHome());
      return true;
    }
    return false;
  }

  // Before the can can be used, there has to be something to water
  function canUsable() {
    if (!FLOWER_KEYS.some(isPlanted)) {
      note('Plant a seed first, then come back with the watering can ♡');
      return false;
    }
    if (!FLOWER_KEYS.some(needsWater)) {
      note(FLOWER_KEYS.every(isWatered) ? 'Every flower has been watered ✿' : 'Everything planted has been watered ✿ Plant another seed to water it.');
      return false;
    }
    return true;
  }

  can.setAttribute('draggable', 'false');

  can.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || state.busy || !FLOWER_KEYS.some(needsWater)) return;
    canDrag = {
      x: event.clientX, y: event.clientY, id: event.pointerId, moved: false,
      scroll: viewport.scrollLeft
    };
    try { can.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
  });

  // keep the can under the pointer, even while the garden scrolls sideways
  function moveCan(x, y) {
    const dx = x - canDrag.x + (viewport.scrollLeft - canDrag.scroll);
    const dy = y - canDrag.y;
    const over = bedAt(x, y);
    const ready = over && needsWater(over.dataset.flower);
    markHover(ready ? over : null);
    canTransform(dx, dy, ready ? -16 : -6);             // tips forward over a thirsty sprout
  }

  can.addEventListener('pointermove', (event) => {
    if (!canDrag || event.pointerId !== canDrag.id) return;
    const x = event.clientX;
    const y = event.clientY;
    if (!canDrag.moved) {
      if (Math.hypot(x - canDrag.x, y - canDrag.y) < 8) return;
      canDrag.moved = true;
      holdCan(true);
      can.classList.add('is-carried');
      document.body.classList.add('is-dragging-seed');
    }
    moveCan(x, y);
    followEdge(x, () => { if (canDrag) moveCan(x, y); });
    event.preventDefault();
  });

  can.addEventListener('pointerup', (event) => {
    if (!canDrag || event.pointerId !== canDrag.id) return;
    const moved = canDrag.moved;
    canDrag = null;
    stopEdge();
    document.body.classList.remove('is-dragging-seed');
    if (!moved) return;                                  // a plain tap: the click handler takes over
    canSuppressClick = true;
    window.setTimeout(() => { canSuppressClick = false; }, 0);
    const bed = bedAt(event.clientX, event.clientY);
    if (bed && needsWater(bed.dataset.flower)) {
      water(bed, canHome());
    } else {
      if (bed) tryWater(bed);
      else note('Bring the watering can over a sprout to water it ✿');
      markHover(null);
      holdCan(false);
      returnCan();
    }
  });

  can.addEventListener('pointercancel', () => {
    if (!canDrag) return;
    canDrag = null;
    stopEdge();
    document.body.classList.remove('is-dragging-seed');
    markHover(null);
    holdCan(false);
    returnCan();
  });

  // Tap / click / keyboard: pick up (or put down) the can
  can.addEventListener('click', (event) => {
    event.stopPropagation();
    if (canSuppressClick || state.busy) return;
    if (state.canHeld) { holdCan(false); return; }
    if (canUsable()) holdCan(true);
  });

  // ---- Step 4: sunshine → bloom ------------------------------------------------------
  let sunDrag = null;
  let sunSuppressClick = false;

  // The sun's resting spot in the sky, measured without any lift or glow
  function sunHome() {
    const transform = sun.style.transform;
    const transition = sun.style.transition;
    sun.style.transition = 'none';
    sun.style.transform = 'none';
    const rect = sun.getBoundingClientRect();
    sun.style.transform = transform;
    sun.style.transition = transition;
    return rect;
  }

  function sunTransform(dx, dy, scale) {
    sun.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
  }

  // The sun shines down on whichever bed is beneath it, so any height in the
  // sky works: each bed's column stretches all the way up from its base.
  function bedBelowSun(x, y) {
    let best = null;
    let bestDistance = Infinity;
    beds.forEach((bed) => {
      const r = bed.getBoundingClientRect();
      const pad = r.width * 0.1;
      if (x < r.left - pad || x > r.right + pad || y > r.bottom) return;
      const distance = Math.abs(x - (r.left + r.width / 2));
      if (distance < bestDistance) { best = bed; bestDistance = distance; }
    });
    return best;
  }

  function markSunHover(over) {
    beds.forEach((bed) => bed.classList.toggle('is-sun-hover', bed === over));
  }

  // a soft beam of light from the sun down to the bed
  function castSunbeam(from, bedRect) {
    const beam = document.createElement('div');
    beam.className = 'sunbeam';
    beam.setAttribute('aria-hidden', 'true');
    const left = bedRect.left + bedRect.width * 0.04;
    const width = bedRect.width * 0.92;
    const top = from.y;
    const height = Math.max(40, bedRect.top + bedRect.height * 0.3 - from.y);
    const apex = ((from.x - left) / width) * 100;
    beam.style.left = left + 'px';
    beam.style.top = top + 'px';
    beam.style.width = width + 'px';
    beam.style.height = height + 'px';
    beam.innerHTML = `<span class="sunbeam__light" style="clip-path: polygon(${(apex - 5).toFixed(1)}% 0, ${(apex + 5).toFixed(1)}% 0, 100% 100%, 0 100%)"></span>`;
    document.body.appendChild(beam);
    window.setTimeout(() => beam.remove(), 3000);
  }

  function returnSun() {
    sun.classList.remove('is-carried');
    sun.style.transition = 'transform .9s cubic-bezier(.22, .61, .36, 1)';
    sunTransform(0, 0, 1);
    window.setTimeout(() => {
      sun.style.transform = '';
      sun.style.transition = '';
      sun.classList.remove('is-shining');
    }, 950);
  }

  function shine(bed) {
    const flower = bed.dataset.flower;
    const home = sunHome();
    const r = bed.getBoundingClientRect();
    const spot = { x: r.left + r.width / 2, y: Math.max(70, r.top - r.height * 2.3) };
    state.busy = true;
    state.sunHeld = false;
    refresh();
    markSunHover(null);
    sun.classList.remove('is-carried');
    sun.classList.add('is-shining');

    // 1. the sun glides over the bed
    sun.style.transition = 'transform .7s cubic-bezier(.22, .61, .36, 1)';
    sunTransform(spot.x - (home.left + home.width / 2), spot.y - (home.top + home.height / 2), 1.25);

    // 2. warm light pours down, with golden sparkles
    window.setTimeout(() => {
      bed.classList.add('is-sunlit');
      castSunbeam(spot, r);
      bed.querySelector('.bed-plant').insertAdjacentHTML('afterbegin', sparklesHTML('sun'));
      sfx('sun');
    }, 700);

    // 3. the sprout stretches up towards the light…
    window.setTimeout(() => bed.classList.add('is-stretching'), 1250);

    // 4. …and opens into its flower, with a project sign
    window.setTimeout(() => {
      state.beds[flower] = 'bloom';
      save();
      bed.classList.remove('is-stretching');
      renderBed(flower, 'bloom');
      sfx('bloom');
    }, 1900);

    // 5. the sun drifts back home
    window.setTimeout(() => {
      bed.classList.remove('is-sunlit');
      returnSun();
      state.busy = false;
      refresh();
      if (FLOWER_KEYS.every(isBloomed)) note('Everything is in bloom ✿ Click any flower to explore its project.');
      else note(`The ${FLOWERS[flower].name} is in bloom ✿ Click it to open ${FLOWERS[flower].longTitle || FLOWERS[flower].title || 'Project ' + FLOWERS[flower].number}.`);
    }, 3400);
  }

  function trySun(bed) {
    const flower = bed.dataset.flower;
    const info = FLOWERS[flower];
    if (!isPlanted(flower)) note(`${info.name} · plant its seed first ♡`);
    else if (needsWater(flower)) note(`${info.name} · it needs a little water first ♡`);
    else if (isBloomed(flower)) note(`${info.name} · it’s already soaking up the sun ☀`);
    else { shine(bed); return true; }
    return false;
  }

  // Before the sun can be used, there has to be a watered sprout
  function sunUsable() {
    if (FLOWER_KEYS.some(isReadyForSun)) return true;
    if (!FLOWER_KEYS.some(isPlanted)) note('Plant a seed first ♡ Sunshine comes after a little water.');
    else if (FLOWER_KEYS.every(isBloomed)) note('Everything is already soaking up the sun ☀');
    else if (FLOWER_KEYS.some(needsWater)) note('Your sprouts need a little water first ♡');
    else note('Plant another seed to keep your garden growing ✿');
    return false;
  }

  sun.setAttribute('draggable', 'false');

  sun.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || state.busy || !FLOWER_KEYS.some(isReadyForSun)) return;
    sunDrag = { x: event.clientX, y: event.clientY, id: event.pointerId, moved: false, scroll: viewport.scrollLeft };
    try { sun.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ }
  });

  // keep the sun under the pointer, even while the garden scrolls sideways
  function moveSun(x, y) {
    const dx = x - sunDrag.x + (viewport.scrollLeft - sunDrag.scroll);
    const dy = y - sunDrag.y;
    const over = bedBelowSun(x, y);
    const ready = over && isReadyForSun(over.dataset.flower);
    markSunHover(ready ? over : null);
    sunTransform(dx, dy, ready ? 1.22 : 1.12);
  }

  sun.addEventListener('pointermove', (event) => {
    if (!sunDrag || event.pointerId !== sunDrag.id) return;
    const x = event.clientX;
    const y = event.clientY;
    if (!sunDrag.moved) {
      if (Math.hypot(x - sunDrag.x, y - sunDrag.y) < 8) return;
      sunDrag.moved = true;
      holdSun(true);
      sun.classList.add('is-carried');
      document.body.classList.add('is-dragging-seed');
    }
    moveSun(x, y);
    followEdge(x, () => { if (sunDrag) moveSun(x, y); });
    event.preventDefault();
  });

  sun.addEventListener('pointerup', (event) => {
    if (!sunDrag || event.pointerId !== sunDrag.id) return;
    const moved = sunDrag.moved;
    sunDrag = null;
    stopEdge();
    document.body.classList.remove('is-dragging-seed');
    if (!moved) return;                                  // a plain tap: the click handler takes over
    sunSuppressClick = true;
    window.setTimeout(() => { sunSuppressClick = false; }, 0);
    const bed = bedBelowSun(event.clientX, event.clientY);
    if (bed && isReadyForSun(bed.dataset.flower)) {
      shine(bed);
    } else {
      if (bed) trySun(bed);
      else note('Carry the sun over a watered bed to share some sunshine ☀');
      markSunHover(null);
      holdSun(false);
      returnSun();
    }
  });

  sun.addEventListener('pointercancel', () => {
    if (!sunDrag) return;
    sunDrag = null;
    stopEdge();
    document.body.classList.remove('is-dragging-seed');
    markSunHover(null);
    holdSun(false);
    returnSun();
  });

  // Tap / click / keyboard: pick up (or put back) the sun
  sun.addEventListener('click', (event) => {
    event.stopPropagation();
    if (sunSuppressClick || state.busy) return;
    if (state.sunHeld) { holdSun(false); return; }
    if (sunUsable()) holdSun(true);
  });

  // ---- Beds: plant, water, shine, or open the project ------------------------------
  beds.forEach((bed) => {
    bed.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.busy) return;
      const flower = bed.dataset.flower;
      if (state.sunHeld) trySun(bed);
      else if (state.canHeld) tryWater(bed);
      else if (state.selected) tryPlant(bed);
      else if (isBloomed(flower)) {
        // a soft page turn, given a moment to be heard before the project opens
        const project = FLOWERS[flower].project;
        if (sfx('page')) window.setTimeout(() => { window.location.href = project; }, 320);
        else window.location.href = project;
      }
      else tryPlant(bed);
    });
  });

  // Clicking anywhere else in the garden, or pressing Escape, puts things down
  function putEverythingDown() {
    if (state.selected) selectSeed(null);
    if (state.canHeld) holdCan(false);
    if (state.sunHeld) holdSun(false);
  }
  document.getElementById('garden-scene').addEventListener('click', () => {
    if (!state.busy) putEverythingDown();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !state.busy) putEverythingDown();
  });

  // "Start over": tap once to ask, tap again to replant the garden (on phones it's a small ↺;
  // its words stay for screen readers)
  const START_OVER = '↺ <span class="instruction-bar__reset-label">start over</span>';
  // (clears planting, watering, sunshine and blooms)
  resetButton.addEventListener('click', () => {
    if (state.busy) return;
    if (!resetButton.classList.contains('is-confirming')) {
      resetButton.classList.add('is-confirming');
      resetButton.textContent = 'tap again to replant';
      window.setTimeout(() => {
        resetButton.classList.remove('is-confirming');
        resetButton.innerHTML = START_OVER;
      }, 4000);
      return;
    }
    FLOWER_KEYS.forEach((f) => { state.beds[f] = 'empty'; renderBed(f, false); });
    save();
    resetButton.classList.remove('is-confirming');
    resetButton.innerHTML = START_OVER;
    state.selected = null;
    state.canHeld = false;
    state.sunHeld = false;
    refresh();
    note('The beds are fresh and ready for planting ✿');
  });

  // ---- Phone guidance: a little arrow toward the next thing you need -------------------------
  // On phones the garden is wider than the screen, so when the next thing to tap is off to one
  // side, a small handwritten arrow at that edge points the way. It follows the garden as you
  // swipe, fades once the thing is in view, and never takes a tap. (Phones only.)
  const instructionBar = document.getElementById('instruction-bar');
  const controls = document.querySelector('.garden-controls');
  const phone = window.matchMedia('(max-width: 560px)');
  const AWAY = ['is-welcome', 'has-panel', 'in-greenhouse', 'at-lake', 'at-willow'];
  const guide = document.createElement('p');
  guide.className = 'garden-guide hand';
  guide.setAttribute('aria-hidden', 'true');   // the instruction bar already says what to do
  document.body.appendChild(guide);
  let guideFrame = 0;
  let guideShown = '';

  // what the visitor needs next (any of these will do), and how to say it
  function nextNeed() {
    if (state.busy) return null;
    const near = 'your flowers are over here ♡';
    if (state.selected) return [[bedFor(state.selected)], near];
    if (state.canHeld) return [FLOWER_KEYS.filter(needsWater).map(bedFor), near];
    if (state.sunHeld) return [FLOWER_KEYS.filter(isReadyForSun).map(bedFor), near];
    if (FLOWER_KEYS.some(needsWater)) return [[can], 'watering can this way ♡'];
    if (FLOWER_KEYS.some(isReadyForSun)) return [[sun], 'find the sunshine ☀'];
    const unplanted = FLOWER_KEYS.filter((f) => !isPlanted(f));
    if (unplanted.length) return [unplanted.map(packetFor), 'find your seeds ♡'];
    return null;   // everything is in bloom
  }

  function updateGuide() {
    guideFrame = 0;
    const busyElsewhere = !phone.matches || AWAY.some((c) => document.body.classList.contains(c)) ||
      document.querySelector('dialog[open]') || can.classList.contains('is-carried') || sun.classList.contains('is-carried');
    const need = busyElsewhere ? null : nextNeed();
    let target = null;
    if (need) {
      const W = viewport.clientWidth;
      const boxes = need[0].filter(Boolean).map((el) => el.getBoundingClientRect());
      const inView = boxes.some((r) => r.left + r.width / 2 > 0 && r.left + r.width / 2 < W);
      if (!inView) {
        // the nearest of them, measured from the middle of the screen
        target = boxes.reduce((best, r) => (!best || Math.abs(r.left + r.width / 2 - W / 2) < Math.abs(best.left + best.width / 2 - W / 2) ? r : best), null);
      }
    }
    if (!target) {
      guide.classList.remove('is-shown');
      return;
    }
    const toLeft = target.left + target.width / 2 < 0;
    const key = need[1] + (toLeft ? '<' : '>');
    if (key !== guideShown) {   // only rewritten when it changes, so its little nudge carries on smoothly
      guideShown = key;
      guide.innerHTML = toLeft
        ? `<span class="garden-guide__arrow">←</span> ${need[1]}`
        : `${need[1]} <span class="garden-guide__arrow">→</span>`;
      guide.classList.toggle('garden-guide--left', toLeft);
      guide.classList.toggle('garden-guide--right', !toLeft);
    }
    // just above the thing it points to, kept clear of the header and the instruction band
    const ceiling = controls ? controls.getBoundingClientRect().bottom + 10 : 80;
    const floor = instructionBar.getBoundingClientRect().top - guide.offsetHeight - 10;
    guide.style.top = Math.round(Math.max(ceiling, Math.min(floor, target.top - guide.offsetHeight - 16))) + 'px';
    guide.classList.add('is-shown');
  }
  function scheduleGuide() {
    if (!guideFrame) guideFrame = window.requestAnimationFrame(updateGuide);
  }
  viewport.addEventListener('scroll', scheduleGuide, { passive: true });
  window.addEventListener('resize', scheduleGuide);
  document.addEventListener('pointerdown', scheduleGuide, { passive: true });
  document.addEventListener('pointerup', scheduleGuide, { passive: true });
  // the garden opening or closing (rooms, panels) and any card opening or closing
  const watchGuide = new MutationObserver(scheduleGuide);
  watchGuide.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('dialog').forEach((d) => watchGuide.observe(d, { attributes: true, attributeFilter: ['open'] }));

  // ---- Restore saved progress -------------------------------------------------
  FLOWER_KEYS.forEach((f) => renderBed(f, false));
  refresh();

  // Later stages of the game will use these
  function setBedStage(flower, stage) {
    if (!STAGES.includes(stage)) return;
    state.beds[flower] = stage;
    save();
    renderBed(flower, false);
    refresh();
  }

  window.GardenGame = { FLOWERS, STAGES, STEPS, state, selectSeed, setBedStage, setStep };

  // ---- Welcome back ----------------------------------------------------------------
  // Coming back from a project page (js/project-bloom.js leaves a note), the flowers that have already
  // grown give one gentle nod as the garden comes into view. Nothing else changes: no message, and
  // their progress stays exactly as it was. (Reduced motion: no nod.)
  const gardenShowing = () => document.body.classList.contains('is-garden') &&
    !['has-panel', 'in-greenhouse', 'at-lake', 'at-willow'].some((name) => document.body.classList.contains(name));
  function welcomeBack() {
    let returning = false;
    try { returning = sessionStorage.getItem('aDayInBloom.fromProject') === '1'; sessionStorage.removeItem('aDayInBloom.fromProject'); } catch (error) { /* storage blocked */ }
    if (!returning || !document.querySelector('.garden-bed.is-bloomed')) return;
    const nod = () => {
      document.querySelectorAll('.garden-bed.is-bloomed').forEach((bed, i) => {
        window.setTimeout(() => {
          bed.classList.add('is-nodding');
          window.setTimeout(() => bed.classList.remove('is-nodding'), 1900);
        }, 500 + i * 220);   // one after another, like a little wave
      });
    };
    if (gardenShowing()) { nod(); return; }
    // back on a panel (e.g. Work): the nod waits until the garden itself is in view
    const wait = new MutationObserver(() => { if (gardenShowing()) { wait.disconnect(); nod(); } });
    wait.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
  welcomeBack();
  // the browser's Back button can bring the page back from memory, without loading it again
  window.addEventListener('pageshow', (event) => { if (event.persisted) welcomeBack(); });
})();
