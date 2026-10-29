/* ==========================================================================
   A Day in Bloom · little garden moments
   Fills the corners of the main garden with potted flowers, buckets of cut
   stems, stacked pots by the greenhouse, scattered petals, a bit of gardening
   clutter and lush, mixed flowers along the front edges.

   It borrows the greenhouse's flower drawings (window.Florist, from
   js/greenhouse-flowers.js), drawn at room size and scaled down to fit the
   garden. Everything sits on layers that ignore clicks, so the beds, seed
   packets, bench, sketchbook, greenhouse, mailbox and watering can all stay
   easy to reach. Seeded, so the garden looks the same every visit.
   ========================================================================== */
(function () {
  'use strict';

  const F = window.Florist;
  if (!F) return;
  F.reseed(9133);
  const { random, between, pick, r1, COLOURS, leaf, stem, snapdragon, ivy, filler, HEADS, bouquet, bucket, terracottaPot } = F;

  // draw something at room size around (0, 0) = where it meets the ground,
  // then move it into the garden at (x, y) and shrink it by k
  const at = (x, y, k, html) => `<g transform="translate(${x} ${y}) scale(${k})">${html}</g>`;

  // ---- Pieces (room-sized, origin on the ground) --------------------------------
  // a terracotta pot with an arrangement and optional greenery trailing over the rim
  function potted(w, h, bw, bh, recipe, trail) {
    const b = bouquet(0, -h - 4, bw, bh, recipe);
    let trails = '';
    for (let i = 0; i < (trail || 0); i++) {
      const side = i % 2 ? 1 : -1;
      trails += ivy(side * w * between(0.3, 0.5), -h - 4, between(30, 60), side * between(6, 16));
    }
    return b.back + terracottaPot(0, 0, w, h) + b.front + trails;
  }

  // a galvanized bucket of cut flowers
  function bucketOf(w, h, bw, bh, recipe) {
    const b = bouquet(0, -h + 6, bw, bh, recipe);
    return b.back + bucket(0, -h, w, h) + b.front;
  }

  // empty pots nested in a stack, with one turned upside down beside them
  function potStack(count) {
    let s = '';
    for (let i = 0; i < count; i++) s += terracottaPot(0, -i * 9, 40, 30);
    s += `<g transform="translate(46 0) scale(1 -1) translate(0 30)">${terracottaPot(0, 0, 36, 26).replace(/<ellipse[^>]*soft-shadow[^>]*\/>/, '')}</g>`;
    return s;
  }

  // a little pot tipped on its side, with a spill of soil
  function tippedPot() {
    return '<ellipse cx="4" cy="2" rx="34" ry="5" fill="url(#soft-shadow)"/>' +
      '<path d="M-26 0 Q-6 -6 18 -2 Q30 2 24 4 Q0 6 -26 4 Z" fill="#6e5440" opacity=".8"/>' +
      `<g transform="translate(2 -14) rotate(-84)">${terracottaPot(0, 14, 30, 24).replace(/<ellipse[^>]*soft-shadow[^>]*\/>/, '')}</g>`;
  }

  // a garden clump: leafy base, stems at many heights, spires and mixed blooms
  function clump(w, h, recipe) {
    const kinds = [];
    Object.keys(recipe.mix).forEach((kind) => { for (let i = 0; i < recipe.mix[kind]; i++) kinds.push(kind); });
    const scale = recipe.scale || 1;
    let s = '';
    for (let i = 0; i < 3; i++) {
      s += `<ellipse cx="${r1(between(-0.3, 0.3) * w)}" cy="${r1(-between(0.04, 0.14) * h)}" rx="${r1(w * between(0.25, 0.36))}" ry="${r1(h * between(0.08, 0.14))}" fill="${pick(['#5f7a4a', '#6f8a58'])}" opacity=".7"/>`;
    }
    for (let i = 0; i < (recipe.spires || 0); i++) {
      const x = between(-0.4, 0.4) * w;
      s += snapdragon(x, 0, h * between(0.75, 1.05), pick(recipe.spireColours || COLOURS.snapdragon), x * 0.08 + between(-8, 8));
    }
    const heads = [];
    const count = recipe.count || Math.round(w / 14);
    for (let i = 0; i < count; i++) {
      const x = between(-0.5, 0.5) * w;
      const y = -h * between(0.3, 0.92);
      s += stem(x * 0.55, 0, x, y, 2);
      if (random() < 0.5) s += leaf(x * 0.7, y * 0.45, between(16, 26), x < 0 ? between(190, 230) : between(-50, -10));
      heads.push({ kind: pick(kinds), x, y });
    }
    for (let i = 0; i < w / 8; i++) {
      const x = between(-0.5, 0.5) * w;
      s += leaf(x, -between(0, 0.22) * h, between(20, 38), x < 0 ? between(185, 240) : between(-60, -5));
    }
    heads.sort((a, b) => a.y - b.y);
    s += heads.map((hd) => HEADS[hd.kind](hd.x, hd.y, scale)).join('');
    for (let i = 0; i < (recipe.filler || 0); i++) s += filler(between(-0.4, 0.4) * w, -h * between(0.3, 0.7), 16, 6);
    for (let i = 0; i < (recipe.trail || 0); i++) {
      const side = i % 2 ? 1 : -1;
      s += ivy(side * w * between(0.2, 0.45), -h * 0.12, between(40, 70), side * between(10, 24));
    }
    return s;
  }

  // a ball of garden twine, a hand fork and a seed tray: the small clutter of a working garden
  const twine = '<ellipse cx="0" cy="2" rx="16" ry="3" fill="url(#soft-shadow)"/><circle cy="-12" r="13" fill="#d9c49c"/>' +
    '<path d="M-12 -16 Q0 -4 12 -14 M-11 -8 Q0 2 11 -6 M-6 -24 Q4 -14 10 -22 M-13 -12 Q-2 -24 6 -25" fill="none" stroke="#b49c72" stroke-width="1.6"/>' +
    '<path d="M10 -6 Q24 2 36 0" fill="none" stroke="#c9b48a" stroke-width="1.6"/>';
  const handFork = '<path d="M-30 0 L4 -6" stroke="#8c6a4a" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M4 -6 L30 -10 M6 -3 L32 -4 M5 -9 L29 -16" stroke="#a9b1b3" stroke-width="2.6" stroke-linecap="round"/>';
  function seedTray() {
    let s = '<ellipse cx="0" cy="2" rx="48" ry="5" fill="url(#soft-shadow)"/><path d="M-42 -14 L42 -14 L38 0 L-38 0 Z" fill="#a9825d"/>' +
      '<path d="M-42 -14 L42 -14" stroke="#c9a57a" stroke-width="2"/>';
    for (let x = -32; x <= 32; x += 9) {
      s += `<path d="M${x} -14 v-7" stroke="#6f8a58" stroke-width="1.4"/>` +
        `<ellipse cx="${x - 3}" cy="-22" rx="3.6" ry="1.8" fill="#8fb069" transform="rotate(-20 ${x - 3} -22)"/>` +
        `<ellipse cx="${x + 3}" cy="-23" rx="3.6" ry="1.8" fill="#9fbd78" transform="rotate(20 ${x + 3} -23)"/>`;
    }
    return s;
  }

  function fill(id, html) {
    const g = document.getElementById(id);
    if (g) g.innerHTML = html;
  }

  // ---- By the greenhouse: stacked pots and a couple of small potted blooms -------------
  fill('gx-greenhouse',
    at(1530, 597, 0.3, potStack(3)) +
    at(1505, 599, 0.28, potted(34, 26, 60, 60, { mix: { daisy: 2, zinnia: 1 }, scale: 0.8 })) +
    at(1196, 604, 0.28, tippedPot()) +
    at(1172, 605, 0.3, potted(36, 28, 64, 70, { mix: { zinnia: 2, cosmos: 2 }, scale: 0.8 }))
  );

  // ---- Courtyard: pots by the bench, buckets of cut stems, petals and clutter -----------
  let court = '';
  // a cluster of terracotta pots beside the bench
  court += at(1262, 786, 0.38, potted(52, 42, 90, 150, { mix: { cosmos: 2, daisy: 1 }, spires: 3, filler: 2 }));
  court += at(1298, 794, 0.42, potted(64, 50, 120, 120, { mix: { ranunculus: 3, dahlia: 2, zinnia: 1 }, filler: 2 }, 3));
  court += at(1326, 800, 0.32, potted(42, 32, 70, 70, { mix: { daisy: 3, poppy: 1 }, scale: 0.85 }, 2));
  court += at(1340, 806, 0.36, twine);
  court += at(1218, 800, 0.36, handFork);

  // buckets of cut flowers by the willow, and slim ones tucked between the beds
  court += at(330, 750, 0.34, bucketOf(70, 72, 120, 150, { mix: { cosmos: 3, zinnia: 2, daisy: 1 }, filler: 2, amaranth: 1 }));
  court += at(362, 756, 0.36, bucketOf(70, 72, 110, 170, { mix: { ranunculus: 3, poppy: 1 }, spires: 4, filler: 2 }));
  court += at(660, 736, 0.28, bucketOf(64, 70, 80, 180, { mix: { cosmos: 2 }, spires: 4, spireColours: [COLOURS.snapdragon[0], COLOURS.snapdragon[2]], filler: 2 }));
  court += at(960, 736, 0.28, bucketOf(64, 70, 100, 150, { mix: { dahlia: 3, zinnia: 2 }, amaranth: 2, filler: 2 }));

  // potted blooms by the mailbox and the seed basket
  court += at(34, 866, 0.42, bucketOf(80, 80, 130, 190, { mix: { cosmos: 3, daisy: 2 }, spires: 3, spireColours: [COLOURS.snapdragon[3], COLOURS.snapdragon[0]], filler: 3 }));
  court += at(126, 860, 0.38, potted(56, 44, 100, 100, { mix: { zinnia: 3, ranunculus: 2 }, filler: 2 }, 3));
  court += at(162, 952, 0.4, potted(50, 40, 90, 90, { mix: { ranunculus: 2, daisy: 2 }, scale: 0.9 }, 2));
  court += at(330, 958, 0.36, tippedPot());

  // potted poppies and a seed tray by the watering can
  court += at(1238, 930, 0.4, potted(52, 40, 96, 100, { mix: { poppy: 3, daisy: 1 } }, 2));
  court += at(1208, 944, 0.36, seedTray());

  // petals scattered across the gravel
  for (let i = 0; i < 70; i++) {
    const x = between(20, 1580);
    const y = between(760, 995);
    const s = 0.6 + (y - 760) / 235 * 0.8;
    court += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(3.2 * s)}" ry="${r1(2 * s)}" fill="${pick(['#efbcc4', '#e39aa8', '#f6c3a0', '#fffaf0', '#f4c0c3', '#d9567d', '#f3d686'])}" transform="rotate(${r1(between(0, 180))} ${r1(x)} ${r1(y)})" opacity=".85"/>`;
  }
  fill('gx-courtyard', court);

  // ---- Front edges: lush, mixed flowers framing the garden --------------------------
  let edges = '';
  edges += at(18, 1012, 0.7, clump(210, 290, { mix: { cosmos: 3, poppy: 2, dahlia: 1 }, spires: 4, filler: 3, trail: 2, count: 18 }));
  edges += at(110, 1018, 0.6, clump(170, 200, { mix: { zinnia: 3, daisy: 2, ranunculus: 2 }, spires: 1, filler: 2, count: 14 }));
  edges += at(1592, 1014, 0.7, clump(190, 290, { mix: { dahlia: 2, ranunculus: 2, cosmos: 2 }, spires: 4, spireColours: [COLOURS.snapdragon[1], COLOURS.snapdragon[3], COLOURS.snapdragon[2]], filler: 3, count: 16 }));
  edges += at(1530, 1020, 0.5, clump(140, 150, { mix: { poppy: 2, daisy: 2, zinnia: 1 }, trail: 2 }));
  // lower blooms along the bottom, kept short so the beds and watering can stay clear
  edges += at(300, 1014, 0.4, clump(160, 110, { mix: { daisy: 3, poppy: 2 }, trail: 2 }));
  edges += at(462, 1016, 0.38, clump(150, 100, { mix: { cosmos: 2, zinnia: 2, daisy: 1 } }));
  edges += at(1150, 1016, 0.38, clump(150, 100, { mix: { ranunculus: 2, daisy: 2, poppy: 1 }, trail: 1 }));
  edges += at(1440, 1018, 0.36, clump(130, 90, { mix: { zinnia: 2, daisy: 2 } }));
  fill('gx-edges', edges);
})();
