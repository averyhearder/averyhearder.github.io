/* ==========================================================================
   A Day in Bloom · scenery painter
   Fills the empty layer groups in index.html with organic detail: willow
   branches, lakeshore pines, flower-farm rows, gravel and wildflowers.
   It only decorates; nothing here is interactive.

   The garden uses a "seeded" random generator, so it grows the same way on
   every visit. Change GARDEN_SEED to grow a different arrangement.
   ========================================================================== */
(function () {
  'use strict';

  const GARDEN_SEED = 527;
  const NS = 'http://www.w3.org/2000/svg';

  // ---- Little helpers ----------------------------------------------------
  function createRandom(seed) {
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const random = createRandom(GARDEN_SEED);
  const between = (min, max) => min + random() * (max - min);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const round = (n) => Math.round(n * 10) / 10;

  function draw(parent, tag, attrs) {
    const node = document.createElementNS(NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    parent.appendChild(node);
    return node;
  }

  function group(id) {
    return document.getElementById(id);
  }

  // ---- Palette -----------------------------------------------------------
  const GREENS = ['#7f9a64', '#8fa871', '#6f8a58', '#a3b882', '#86a06a', '#97ad78'];
  const DEEP_GREENS = ['#5c7651', '#66805a', '#55704c', '#617c55'];
  const GRASS = ['#9fb27f', '#b9bf8a', '#ab9f6a', '#8fa572', '#c6c592', '#7f9862'];
  const STEM = '#6f8a58';

  const ROW_COLOURS = [
    ['#eab0b4', '#e2949f', '#f1c7c4', '#d27f8f'],   // blush dahlias
    ['#f0d282', '#f4e0a6', '#e6c264', '#f8ebc4'],   // butter
    ['#fbf6ea', '#f0e8d6', '#ffffff', '#ead9b9'],   // cream
    ['#e6957f', '#eeac94', '#dc8174', '#f2c3aa'],   // soft coral zinnias
    ['#c2add2', '#ad98c2', '#d8c9e3', '#9c8bb4'],   // lavender
    ['#cd7d9c', '#c0688a', '#dd9db5', '#ebbccc']    // raspberry pink
  ];

  // ---- Shapes of the land ------------------------------------------------
  // Where the meadow meets the lake (y for any x)
  function shoreY(x) {
    return 516 - 52 * (x / 1600) + 5 * Math.sin(x / 110);
  }

  // The gravel path from the greenhouse door to the courtyard
  const PATH_TOP = 598;
  const PATH_BOTTOM = 742;
  function pathAt(y) {
    const t = Math.min(1, Math.max(0, (y - PATH_TOP) / (PATH_BOTTOM - PATH_TOP)));
    return {
      t: t,
      centre: 1300 - 430 * Math.pow(t, 1.4),
      halfWidth: 14 + 150 * Math.pow(t, 1.6)
    };
  }
  function isOnPath(x, y) {
    if (y < PATH_TOP - 2 || y > PATH_BOTTOM + 4) return false;
    const p = pathAt(y);
    return Math.abs(x - p.centre) < p.halfWidth + 6;
  }

  // ======================================================================
  //  FLOWERS & PLANTS (reused everywhere)
  // ======================================================================
  function stem(g, x, fromY, toY, s) {
    draw(g, 'path', {
      d: `M${round(x)} ${round(fromY)} Q${round(x + between(-3, 3) * s)} ${round((fromY + toY) / 2)} ${round(x)} ${round(toY)}`,
      fill: 'none', stroke: STEM, 'stroke-width': round(0.9 * s)
    });
  }

  // A pointed leaf with a pale midrib
  function leaf(g, x, y, length, angle, colour, withVein) {
    const w = length * 0.3;
    draw(g, 'path', {
      d: `M0 0 C${round(length * 0.3)} ${round(-w)} ${round(length * 0.75)} ${round(-w * 0.8)} ${round(length)} 0 C${round(length * 0.75)} ${round(w * 0.8)} ${round(length * 0.3)} ${round(w)} 0 0 Z`,
      fill: colour,
      transform: `translate(${round(x)} ${round(y)}) rotate(${round(angle)})`
    });
    if (withVein) {
      draw(g, 'path', {
        d: `M${round(length * 0.08)} 0 L${round(length * 0.85)} 0`,
        stroke: '#d6e0bf', 'stroke-opacity': 0.55, 'stroke-width': round(length * 0.04),
        transform: `translate(${round(x)} ${round(y)}) rotate(${round(angle)})`
      });
    }
  }

  function grassBlade(g, x, y, height, s, colour) {
    const bend = between(-0.45, 0.45) * height;
    draw(g, 'path', {
      d: `M${round(x)} ${round(y)} Q${round(x + bend * 0.3)} ${round(y - height * 0.6)} ${round(x + bend)} ${round(y - height)}`,
      fill: 'none', stroke: colour || pick(GRASS), 'stroke-width': round(between(0.8, 1.6) * s), 'stroke-linecap': 'round'
    });
  }

  const BLOOMS = {
    daisy(g, x, y, s, base) {
      stem(g, x, base, y, s);
      draw(g, 'use', { href: '#bloom-daisy', transform: `translate(${round(x)} ${round(y)}) scale(${round(s * between(0.7, 1.1) * 100) / 100})` });
    },
    cosmos(g, x, y, s, base) {
      stem(g, x, base, y, s);
      draw(g, 'use', {
        href: '#bloom-cosmos',
        transform: `translate(${round(x)} ${round(y)}) rotate(${round(between(0, 40))}) scale(${round(s * between(0.75, 1.15) * 100) / 100})`,
        style: `color:${pick(['#efbcc4', '#e39aa8', '#f4d3d5', '#e8aeb8', '#fbe9e7'])}`
      });
    },
    round(g, x, y, s, base) {
      stem(g, x, base, y, s);
      draw(g, 'use', {
        href: '#bloom-round',
        transform: `translate(${round(x)} ${round(y)}) scale(${round(s * between(0.7, 1) * 100) / 100})`,
        style: `color:${pick(['#f0d282', '#f2c3aa', '#efbcc4', '#f8ebc4', '#eab0b4'])}`
      });
    },
    // lupine / delphinium spires: the tall vertical accents
    spike(g, x, y, s, base) {
      const colour = pick(['#b9a2cf', '#a28fbe', '#e39aa8', '#98aacd', '#f1c7c4']);
      const tall = y - between(10, 26) * s;
      stem(g, x, base, tall + 4 * s, s);
      for (let k = 0; k < 12; k++) {
        draw(g, 'circle', {
          cx: round(x + between(-0.8, 0.8) * s), cy: round(tall + 30 * s - k * 3 * s),
          r: round(Math.max(0.6, (2.7 - k * 0.17)) * s), fill: colour
        });
      }
    },
    // foxglove: nodding bells down one side of a tall stem
    foxglove(g, x, y, s, base) {
      const top = y - between(14, 28) * s;
      stem(g, x, base, top, s);
      const colour = pick(['#e6a7c0', '#d993b0', '#f2d2dc', '#fbf3ea']);
      for (let k = 0; k < 7; k++) {
        const by = top + 4 * s + k * 4.2 * s;
        draw(g, 'ellipse', {
          cx: round(x + 2.2 * s), cy: round(by), rx: round((1.5 + k * 0.12) * s), ry: round((2.4 + k * 0.12) * s),
          fill: colour, stroke: '#a85f7c', 'stroke-opacity': 0.35, 'stroke-width': round(0.35 * s),
          transform: `rotate(-20 ${round(x + 2.2 * s)} ${round(by)})`
        });
      }
    },
    // Queen Anne's lace: airy white umbrellas
    umbel(g, x, y, s, base) {
      const top = y - between(4, 16) * s;
      stem(g, x, base, top, s * 0.8);
      for (let k = 0; k < 14; k++) {
        const a = between(-Math.PI, 0);
        const r = between(0, 6) * s;
        draw(g, 'circle', { cx: round(x + Math.cos(a) * r), cy: round(top + Math.sin(a) * r * 0.45), r: round(0.9 * s), fill: '#fffcf3' });
      }
    },
    // amaranthus: drooping rosy tassels
    amaranth(g, x, y, s, base) {
      stem(g, x, base, y, s);
      const dir = random() < 0.5 ? -1 : 1;
      const colour = pick(['#9c4c62', '#b4667a', '#c1808a', '#a85a6f']);
      for (let k = 0; k < 2; k++) {
        const off = k * 3 * s;
        draw(g, 'path', {
          d: `M${round(x + off)} ${round(y)} C${round(x + off + dir * 5 * s)} ${round(y - 6 * s)} ${round(x + off + dir * 12 * s)} ${round(y + 4 * s)} ${round(x + off + dir * 9 * s)} ${round(y + (20 + k * 6) * s)}`,
          fill: 'none', stroke: colour,
          'stroke-width': round((3.2 - k) * s), 'stroke-linecap': 'round',
          'stroke-dasharray': `${round(2.2 * s)} ${round(0.9 * s)}`
        });
      }
    },
    // tiny meadow wildflowers
    wild(g, x, y, s) {
      const colour = pick(['#fffbf1', '#f0d282', '#c2add2', '#efbcc4']);
      for (let k = 0; k < 5; k++) {
        draw(g, 'circle', { cx: round(x + between(-5, 5) * s), cy: round(y + between(-4, 4) * s), r: round(between(0.8, 1.5) * s), fill: colour });
      }
    }
  };

  // A full, layered clump: shadow, dark underleaves, pointed leaves, grasses, blooms
  function drawClump(parent, x, y, s, kinds) {
    const g = draw(parent, 'g', {});
    draw(g, 'ellipse', { cx: round(x), cy: round(y), rx: round(28 * s), ry: round(4.5 * s), fill: '#33402a', opacity: 0.2 });
    for (let i = 0; i < 4; i++) {
      draw(g, 'ellipse', {
        cx: round(x + between(-18, 18) * s), cy: round(y - between(3, 10) * s),
        rx: round(between(10, 16) * s), ry: round(between(6, 10) * s), fill: pick(DEEP_GREENS)
      });
    }
    const leaves = 6 + Math.floor(random() * 6);
    for (let i = 0; i < leaves; i++) {
      const side = random() < 0.5 ? -1 : 1;
      const angle = side < 0 ? between(190, 250) : between(-70, -10);
      leaf(g, x + between(-14, 14) * s, y - between(2, 12) * s, between(12, 22) * s, angle, pick(GREENS), s > 0.8);
    }
    for (let i = 0; i < 5; i++) {
      grassBlade(g, x + between(-22, 22) * s, y - 4 * s, between(24, 58) * s, s);
    }
    const blooms = 4 + Math.floor(random() * 6);
    for (let i = 0; i < blooms; i++) {
      const kind = pick(kinds);
      BLOOMS[kind](g, x + between(-24, 24) * s, y - between(14, 60) * s, s, y - 6 * s);
    }
    return g;
  }

  // A soft, rounded broadleaf tree
  function drawSoftTree(parent, cx, baseY, width, height) {
    const g = draw(parent, 'g', {});
    draw(g, 'rect', { x: cx - 3, y: baseY - height * 0.35, width: 6, height: height * 0.35, fill: '#6f6456' });
    const blobs = [];
    for (let i = 0; i < 22; i++) {
      blobs.push({
        x: cx + between(-0.42, 0.42) * width,
        y: baseY - height * 0.3 - between(0, 0.6) * height,
        r: between(0.12, 0.25) * width
      });
    }
    blobs.sort((a, b) => b.y - a.y);   // lower blobs first, lighter tops last
    const tones = ['#6c8661', '#7d9770', '#8ea77d', '#a3b78e'];
    blobs.forEach((b) => {
      const lift = (baseY - b.y) / height;   // 0 = low, 1 = high
      draw(g, 'circle', {
        cx: round(b.x), cy: round(b.y), r: round(b.r),
        fill: tones[Math.min(tones.length - 1, Math.floor(lift * tones.length + between(-0.6, 0.6)))] || tones[0]
      });
    });
    return g;
  }

  // Muskoka shoreline: pines with layered tiers, plus rounded trees
  function treelinePath(from, to, base, minH, maxH, depth = 30) {
    let d = `M${from} ${base + depth} L${from} ${base}`;
    let x = from;
    while (x < to) {
      const w = between(8, 20);
      const h = between(minH, maxH);
      if (random() < 0.7) {
        d += ` L${round(x + w * 0.1)} ${round(base - h * 0.3)} L${round(x + w * 0.32)} ${round(base - h * 0.56)}` +
             ` L${round(x + w * 0.26)} ${round(base - h * 0.56)} L${round(x + w * 0.5)} ${round(base - h)}` +
             ` L${round(x + w * 0.74)} ${round(base - h * 0.56)} L${round(x + w * 0.68)} ${round(base - h * 0.56)}` +
             ` L${round(x + w * 0.9)} ${round(base - h * 0.3)}`;
      } else {
        d += ` Q${round(x + w * 0.5)} ${round(base - h * 1.3)} ${round(x + w)} ${round(base - h * 0.3)}`;
      }
      x += w * between(0.55, 0.9);
    }
    return d + ` L${to} ${base} L${to} ${base + depth} Z`;
  }

  // A hand-thrown terracotta pot: gently bulging sides, thick lip,
  // a weathered mineral bloom, a saucer, and plants spilling over
  function drawPot(parent, x, base, s) {
    const w = 30 * s;
    const h = 30 * s;
    const top = base - h;
    draw(parent, 'ellipse', { cx: x, cy: round(base + 1 * s), rx: round(w * 0.8), ry: round(3.4 * s), fill: 'url(#soft-shadow)' });
    // saucer
    draw(parent, 'path', {
      d: `M${round(x - w * 0.5)} ${round(base - 2 * s)} L${round(x + w * 0.5)} ${round(base - 2 * s)} L${round(x + w * 0.44)} ${round(base + 1.2 * s)} L${round(x - w * 0.44)} ${round(base + 1.2 * s)} Z`,
      fill: '#b77654'
    });
    const body = `M${round(x - w * 0.5)} ${round(top)} C${round(x - w * 0.52)} ${round(top + h * 0.45)} ${round(x - w * 0.44)} ${round(base - h * 0.15)} ${round(x - w * 0.37)} ${round(base - 2 * s)}` +
                 ` L${round(x + w * 0.37)} ${round(base - 2 * s)} C${round(x + w * 0.44)} ${round(base - h * 0.15)} ${round(x + w * 0.52)} ${round(top + h * 0.45)} ${round(x + w * 0.5)} ${round(top)} Z`;
    draw(parent, 'path', { d: body, fill: 'url(#terracotta)' });
    draw(parent, 'path', { d: body, fill: 'url(#pot-shade)' });
    // weathering: chalky mineral bloom and a hint of moss
    for (let i = 0; i < 3; i++) {
      draw(parent, 'ellipse', {
        cx: round(x + between(-0.3, 0.3) * w), cy: round(top + between(0.3, 0.8) * h),
        rx: round(between(3, 7) * s), ry: round(between(1.5, 3.5) * s), fill: '#f1e6d6', opacity: round(between(0.18, 0.32))
      });
    }
    draw(parent, 'ellipse', { cx: round(x - w * 0.2), cy: round(base - 4 * s), rx: round(6 * s), ry: round(1.6 * s), fill: '#6f8a58', opacity: 0.22 });
    draw(parent, 'path', { d: `M${round(x - w * 0.3)} ${round(top + 4 * s)} Q${round(x - w * 0.34)} ${round(top + h * 0.5)} ${round(x - w * 0.28)} ${round(base - 5 * s)}`, fill: 'none', stroke: '#f6d2b6', 'stroke-opacity': 0.45, 'stroke-width': round(1.4 * s), 'stroke-linecap': 'round' });
    // thick lip with light top edge and shadow beneath
    draw(parent, 'rect', { x: round(x - w * 0.57), y: round(top - 6 * s), width: round(w * 1.14), height: round(7.5 * s), rx: round(1.8 * s), fill: 'url(#terracotta-rim)' });
    draw(parent, 'path', { d: `M${round(x - w * 0.55)} ${round(top - 5.2 * s)} H${round(x + w * 0.55)}`, stroke: '#f2c3a2', 'stroke-width': round(0.9 * s), 'stroke-opacity': 0.8 });
    draw(parent, 'path', { d: `M${round(x - w * 0.5)} ${round(top + 1.8 * s)} H${round(x + w * 0.5)}`, stroke: '#6e3a24', 'stroke-width': round(1.2 * s), 'stroke-opacity': 0.35 });
    // trailing greenery over the rim
    for (let i = 0; i < 5; i++) {
      const side = i % 2 ? 1 : -1;
      const startX = x + side * between(0.3, 0.58) * w;
      const length = between(14, 30) * s;
      draw(parent, 'path', {
        d: `M${round(startX)} ${round(top - 4 * s)} q${round(side * 7 * s)} ${round(4 * s)} ${round(side * 3 * s)} ${round(length)}`,
        fill: 'none', stroke: pick(GREENS), 'stroke-width': round(2.4 * s), 'stroke-linecap': 'round', 'stroke-dasharray': `${round(2.4 * s)} ${round(1.2 * s)}`
      });
      leaf(parent, startX + side * 4 * s, top - 4 * s + length, 6 * s, 90 + side * 30, pick(GREENS), false);
    }
    drawClump(parent, x, top - 2 * s, s * 0.9, ['daisy', 'cosmos', 'round', 'round', 'wild', 'umbel']);
  }

  // ======================================================================
  //  PAINT THE GARDEN, BACK TO FRONT
  // ======================================================================

  // ---- Distance: shoreline trees, reflections, island ---------------------
  function paintDistance() {
    const far = group('far-treeline');
    draw(far, 'path', { d: treelinePath(0, 1600, 436, 10, 24), fill: '#9db2a9', opacity: 0.92 });
    const nearD = treelinePath(0, 1600, 448, 14, 40);
    draw(far, 'path', { d: nearD, fill: '#7c9585' });

    draw(group('lake-reflections'), 'path', { d: nearD, fill: '#5f7d6d', transform: 'translate(0 894) scale(1 -1)' });

    const island = group('lake-island');
    draw(island, 'path', { d: treelinePath(600, 700, 470, 12, 30, 2), fill: '#647f6b' });
    draw(island, 'ellipse', { cx: 650, cy: 471, rx: 58, ry: 4, fill: '#b1a597' });
    draw(island, 'ellipse', { cx: 650, cy: 476, rx: 60, ry: 3, fill: '#ffffff', opacity: 0.25 });

    const trees = group('background-trees');
    drawSoftTree(trees, 1420, 472, 190, 190);
    drawSoftTree(trees, 1560, 470, 170, 230);
    drawSoftTree(trees, 1260, 474, 120, 110);

    const shimmer = group('lake-shimmer');
    for (let i = 0; i < 52; i++) {
      const y = between(452, 512);
      const x = between(420, 1200);
      if (y > shoreY(x) - 3) continue;
      const len = between(8, 50);
      draw(shimmer, 'path', { d: `M${round(x)} ${round(y)} h${round(len)}`, 'stroke-width': round(between(0.8, 1.6)), opacity: round(between(0.3, 0.75)) });
    }
  }

  // ---- Midground: meadow, path, flower-farm rows, willow -------------------
  function paintMidground() {
    // meadow
    let d = `M0 ${round(shoreY(0))}`;
    for (let x = 40; x <= 1600; x += 40) d += ` L${x} ${round(shoreY(x))}`;
    draw(group('meadow'), 'path', { d: d + ' L1600 1000 L0 1000 Z', fill: 'url(#meadow-grad)' });

    // granite rocks and soft shrubs along the water's edge
    const shore = group('shoreline');
    for (let i = 0; i < 9; i++) {
      const x = between(580, 1180);
      const y = shoreY(x);
      const rx = between(6, 16);
      draw(shore, 'ellipse', { cx: round(x), cy: round(y), rx: round(rx), ry: round(rx * 0.38), fill: pick(['#b3a89c', '#a2968a', '#c2b8ac']) });
      draw(shore, 'ellipse', { cx: round(x - rx * 0.2), cy: round(y - rx * 0.15), rx: round(rx * 0.5), ry: round(rx * 0.12), fill: '#ffffff', opacity: 0.3 });
    }
    for (let x = 0; x < 1600; x += between(12, 24)) {
      if (x > 600 && x < 1150 && random() < 0.65) continue;
      draw(shore, 'ellipse', {
        cx: round(x), cy: round(shoreY(x) - between(0, 4)),
        rx: round(between(10, 24)), ry: round(between(6, 12)), fill: pick(DEEP_GREENS), opacity: 0.95
      });
    }

    // a layered hedgerow behind the field: dark base, lighter sunlit tops
    const hedge = group('hedgerow');
    for (let x = 560; x < 1240; x += between(14, 22)) {
      const y = shoreY(x) + 8;
      draw(hedge, 'ellipse', { cx: round(x), cy: round(y), rx: round(between(12, 20)), ry: round(between(8, 13)), fill: pick(DEEP_GREENS) });
      draw(hedge, 'ellipse', { cx: round(x + between(-4, 4)), cy: round(y - between(5, 8)), rx: round(between(6, 11)), ry: round(between(4, 7)), fill: pick(['#8ea77d', '#9db488', '#a8bd8f']) });
    }

    // rustic post-and-rail fence behind the field
    const fence = group('field-fence');
    draw(fence, 'path', { d: 'M580 506 L1190 502 M580 515 L1190 511', stroke: '#968773', 'stroke-width': 1.6, fill: 'none' });
    for (let x = 580; x <= 1190; x += 55) {
      draw(fence, 'rect', { x: x - 1.5, y: 498, width: 3.2, height: 26, fill: '#8a7b68' });
    }

    // gravel path
    const path = group('garden-path');
    const left = [];
    const right = [];
    for (let y = PATH_TOP; y <= PATH_BOTTOM; y += 6) {
      const p = pathAt(y);
      left.push(`${round(p.centre - p.halfWidth + between(-1.5, 1.5))} ${y}`);
      right.unshift(`${round(p.centre + p.halfWidth + between(-1.5, 1.5))} ${y}`);
    }
    draw(path, 'path', { d: `M${left.join(' L')} L${right.join(' L')} Z`, fill: '#d8caaf' });
    for (let i = 0; i < 420; i++) {
      const y = PATH_TOP + (PATH_BOTTOM - PATH_TOP) * Math.sqrt(random());
      const p = pathAt(y);
      draw(path, 'circle', {
        cx: round(p.centre + between(-0.95, 0.95) * p.halfWidth), cy: round(y),
        r: round(0.5 + p.t * between(0.6, 1.8)), fill: pick(['#b5a385', '#ebe2cf', '#9d8d74', '#c8b99e'])
      });
    }

    // flower-farm rows, receding into the distance
    const rows = [526, 540, 556, 574, 594, 616, 642, 670, 700];
    rows.forEach((y, i) => {
      const s = 0.35 + i * 0.13;
      const target = group(y < 600 ? 'field-rows-back' : 'field-rows-front');
      const colours = ROW_COLOURS[i % ROW_COLOURS.length];
      const startX = y < 600 ? 560 : 0;
      const foliageStep = Math.max(6, 10 * s);
      const flowerStep = Math.max(4, 7 * s);

      // a dark band under each row gives it a crisp, planted edge
      for (let x = startX; x < 1600; x += 40) {
        if (isOnPath(x + 20, y)) continue;
        draw(target, 'ellipse', { cx: x + 20, cy: round(y + 3 * s), rx: 26, ry: round(4 * s), fill: '#55704c', opacity: 0.55 });
      }
      for (let x = startX; x < 1600; x += foliageStep * between(0.8, 1.2)) {
        if (isOnPath(x, y)) continue;
        draw(target, 'ellipse', {
          cx: round(x), cy: round(y + between(-1, 1) * s),
          rx: round(between(6, 10) * s), ry: round(between(4, 7) * s), fill: pick(GREENS)
        });
      }
      for (let x = startX; x < 1600; x += flowerStep * between(0.7, 1.3)) {
        if (isOnPath(x, y)) continue;
        const fy = y - between(2, 10) * s;
        const r = between(2.2, 3.6) * s;
        draw(target, 'circle', { cx: round(x + between(-2, 2)), cy: round(fy), r: round(r), fill: pick(colours) });
        if (s > 0.7) {
          draw(target, 'circle', { cx: round(x), cy: round(fy + r * 0.15), r: round(r * 0.35), fill: '#5a3a2a', opacity: 0.18 });
        }
      }
    });

    // little pots by the greenhouse door
    const doorPots = group('greenhouse-pots');
    drawPot(doorPots, 1262, 604, 0.55);
    drawPot(doorPots, 1340, 606, 0.45);

    // the willow: soft canopy shadows, then hundreds of weeping strands,
    // split across two layers that sway at slightly different speeds
    const canopy = group('willow-canopy');
    [[315, 290, 250, 170], [190, 400, 160, 170], [450, 400, 150, 170], [320, 470, 220, 140]].forEach((e) => {
      draw(canopy, 'ellipse', { cx: e[0], cy: e[1], rx: e[2], ry: e[3], fill: 'url(#canopy-shade)' });
    });

    const back = group('willow-strands-back');
    const front = group('willow-strands-front');
    [back, front].forEach((g) => {
      g.setAttribute('fill', 'none');
      g.setAttribute('stroke-linecap', 'round');
    });
    const tones = ['#667f52', '#768f5e', '#86a06a', '#98b077', '#acc186', '#c3d199'];
    const count = 440;
    for (let i = 0; i < count; i++) {
      const x0 = between(90, 540);
      const spread = (x0 - 315) / 225;                        // -1 left … 1 right
      const y0 = 140 + spread * spread * 150 + between(-10, 50);
      const dir = spread + between(-0.4, 0.4) >= 0 ? 1 : -1;
      // each branch arches outward a little, then weeps straight down
      const tipX = x0 + dir * between(12, 40) * (0.4 + Math.abs(spread));
      const tipY = y0 - between(4, 18);
      const fallX = tipX + dir * between(4, 14);
      const yEnd = Math.min(tipY + between(140, 400) * (1 - Math.abs(spread) * 0.3), 655);
      const len = yEnd - tipY;
      const sway = between(-10, 10);
      const sunSide = spread > 0.2 ? 1 : 0;                    // lighter toward the sun
      const toneIndex = Math.max(0, Math.min(tones.length - 1, Math.floor((i / count) * 4 + sunSide + between(-0.5, 1))));
      const leafy = random() < 0.7;
      draw(i < count / 2 ? back : front, 'path', {
        d: `M${round(x0)} ${round(y0)} Q${round(tipX)} ${round(tipY)} ${round(fallX)} ${round(tipY + 20)}` +
           ` C${round(fallX + sway * 0.3)} ${round(tipY + len * 0.45)} ${round(fallX + sway)} ${round(tipY + len * 0.75)} ${round(fallX + sway * 0.6)} ${round(yEnd)}`,
        stroke: tones[toneIndex],
        'stroke-width': round(leafy ? between(2, 4.5) : between(0.8, 1.6)),
        'stroke-dasharray': leafy ? `${round(between(2, 5))} ${round(between(1, 2.5))}` : 'none',
        opacity: round(between(0.6, 0.97))
      });
    }

    // lush borders along both sides of the path
    const borders = group('path-borders');
    for (let y = PATH_TOP + 8; y < PATH_BOTTOM - 10; y += between(10, 16)) {
      const p = pathAt(y);
      const s = 0.35 + p.t * 0.75;
      drawClump(borders, p.centre - p.halfWidth - 10 * s, y, s, ['daisy', 'cosmos', 'spike', 'wild', 'amaranth', 'umbel']);
      drawClump(borders, p.centre + p.halfWidth + 10 * s, y, s, ['daisy', 'round', 'foxglove', 'wild', 'cosmos']);
    }
  }

  // ---- Courtyard gravel + flower borders around it -------------------------
  function paintCourtyard() {
    const gravel = group('gravel');
    for (let i = 0; i < 1300; i++) {
      const y = 738 + 262 * Math.pow(random(), 0.8);
      const s = 0.6 + ((y - 738) / 262) * 1.8;
      draw(gravel, 'circle', {
        cx: round(between(0, 1600)), cy: round(y), r: round(between(0.6, 1.5) * s),
        fill: pick(['#b5a385', '#ebe2cf', '#9d8d74', '#c8b99e', '#f3ecdd', '#8f806a'])
      });
    }

    const borders = group('courtyard-borders');
    const mix = ['daisy', 'daisy', 'cosmos', 'amaranth', 'spike', 'round', 'wild', 'foxglove', 'umbel'];
    for (let x = -10; x < 400; x += between(28, 40)) drawClump(borders, x, between(728, 740), between(1, 1.35), mix);
    for (let x = 1230; x < 1620; x += between(28, 40)) drawClump(borders, x, between(722, 734), between(1, 1.35), mix);

    // little wildflowers that have seeded themselves in the gravel
    const tufts = group('gravel-tufts');
    [[90, 960], [365, 905], [660, 935], [960, 960], [1255, 905], [1450, 975], [520, 985], [1110, 915]].forEach((spot) => {
      drawClump(tufts, spot[0], spot[1], between(0.55, 0.8), ['daisy', 'wild', 'wild', 'umbel']);
    });

    drawPot(group('pot-cluster'), 40, 214, 1.3);
    drawPot(group('pot-cluster'), 140, 216, 1.0);
    drawPot(group('pot-cluster'), 92, 210, 2.0);
  }

  // ---- Foreground: tall grasses, wildflowers and soft blurred blooms ------
  function paintForeground() {
    const g = group('foreground-grass');
    for (let x = -10; x < 1610; x += between(5, 10)) {
      grassBlade(g, x, between(1000, 1010), between(18, 60), 1.5);
    }
    drawClump(g, 30, 1004, 1.7, ['daisy', 'cosmos', 'wild', 'spike']);
    drawClump(g, 360, 1010, 1.2, ['daisy', 'wild', 'umbel']);
    drawClump(g, 1180, 1010, 1.2, ['cosmos', 'wild']);
    drawClump(g, 1590, 1006, 1.5, ['daisy', 'cosmos', 'amaranth']);

    // out-of-focus blooms right at the lens: adds photographic depth
    const bokeh = group('foreground-bokeh');
    [[-20, 960, 5, '#efbcc4'], [40, 1010, 3.6, '#fbe9e7'], [1625, 930, 5.5, '#e39aa8'], [1565, 1000, 3.2, '#f4d3d5']].forEach((b) => {
      draw(bokeh, 'use', { href: '#bloom-cosmos', transform: `translate(${b[0]} ${b[1]}) scale(${b[2]})`, style: `color:${b[3]}` });
    });
    for (let i = 0; i < 6; i++) {
      grassBlade(bokeh, between(-20, 60), 1010, between(120, 200), 4, '#7f9862');
      grassBlade(bokeh, between(1550, 1620), 1010, between(120, 200), 4, '#8fa572');
    }
  }

  // ---- Phones: the courtyard carries on beneath the garden ------------------------------------
  // The same gravel, grasses and little seeded wildflowers, continuing below the scene's bottom
  // edge into the strip behind the instruction band (painted last, so the garden itself is unchanged)
  function paintSoil() {
    const gravel = group('soil-gravel');
    const grass = group('soil-grass');
    if (!gravel || !grass) return;
    for (let i = 0; i < 900; i++) {
      draw(gravel, 'circle', {
        cx: round(between(0, 1600)), cy: round(between(1002, 1260)), r: round(between(0.6, 1.5) * 2.3),
        fill: pick(['#b5a385', '#ebe2cf', '#9d8d74', '#c8b99e', '#f3ecdd', '#8f806a'])
      });
    }
    for (let x = -10; x < 1610; x += between(10, 22)) grassBlade(grass, x, between(1060, 1260), between(14, 38), 1.3);
    [[70, 1050], [300, 1085], [560, 1045], [820, 1100], [1060, 1055], [1300, 1090], [1520, 1048]].forEach((spot) => {
      drawClump(grass, spot[0], spot[1], between(0.5, 0.75), ['daisy', 'wild', 'wild', 'umbel', 'cosmos']);
    });
  }

  paintDistance();
  paintMidground();
  paintCourtyard();
  paintForeground();
  paintSoil();
})();
