/* ==========================================================================
   A Day in Bloom · the opening bloom
   "Enter the Garden" carries the visitor through an overgrown flower garden,
   in under three seconds:
     1. a tiny stem rises above the button, two leaves unfurl and a single
        pink cosmos opens, with a soft glow
     2. long vines grow in from every edge, and flowers crowd in after them in
        three layers (soft and small far away, dense clusters in the middle,
        huge blossoms and leaves up close) until they fill the whole screen,
        while the faded landing overlay quietly clears behind them
     3. the view pushes forward: each layer parts down the middle and grows
        past the edges (the nearest fastest), fading as it goes, opening a path
        into the garden. Once all six layers have drifted away, every temporary
        flower is removed.
   Each flower variety is drawn once (dahlia, ranunculus, zinnia, poppy,
   anemone, snapdragon, trailing amaranthus, leaves, plus the site's own
   #bloom-cosmos and #bloom-daisy) and reused at many sizes, colours and
   angles. Only whole clusters animate as they grow, and the push-through
   moves six layers, so it stays light. Styles: css/intro.css.
   On phones and tablets the growing clusters are painted onto six canvases
   (one per half-layer) instead of being ~110 separately animated images:
   each image needed its own graphics layer at the screen's full resolution,
   which used more memory than iOS Safari allows a page, so it reloaded.
   The canvases draw the same pictures with the same timing and easing.
   With reduced motion, the button simply opens the garden.
   ========================================================================== */
(function () {
  'use strict';

  const button = document.getElementById('enter-garden');
  const welcome = document.getElementById('welcome');
  if (!button || !welcome) return;

  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };
  const r1 = (n) => Math.round(n * 10) / 10;
  const r2 = (n) => Math.round(n * 100) / 100;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  // phones and tablets: clusters are painted on canvases (see above), at up to 2x resolution
  const LITE = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  // the timing curve of a CSS cubic-bezier(), for the canvas clusters
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    return (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const slope = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(slope) < 1e-6) break;
        t -= (((ax * t + bx) * t + cx) * t - x) / slope;
      }
      t = Math.min(1, Math.max(0, t));
      return ((ay * t + by) * t + cy) * t;
    };
  }
  const clusterEase = bezier(0.22, 1.18, 0.42, 1);   // the same curve as .ib-cl in css/intro.css

  // the moments of the transition, in milliseconds (counted from the first frame the flowers are drawn,
  // so the timings stay in step with the animations even on a slower phone)
  const CHIME = 380;     // the first cosmos opens
  const RISE = 480;      // the garden starts growing in from the edges (and its sound rises)
  const REVEAL = 1250;   // the landing overlay clears, hidden behind the flowers, before they part
  const PUSH = 1600;     // the view pushes forward through the flowers
  const DONE = 3300;     // only a safety net: the flowers are removed as soon as every layer has drifted away

  // ---- Colours -------------------------------------------------------------------
  const C = {
    blush: '#f4cfd4', dusty: '#d99aa6', burgundy: '#7d2840', raspberry: '#c2385f', butter: '#f2d27f',
    peach: '#f3b48f', coral: '#f19a7d', lavender: '#b9a2d6', cream: '#f6ecd8', white: '#fbf4e8', sage: '#9db078'
  };
  const LEAVES = ['#8fa871', '#a3bd88', '#6f8a58', '#b5c99a', '#7f9a64', '#9db584', '#5f7a4c'];
  const KINDS = {
    dahlia: [C.burgundy, C.raspberry, C.peach, C.blush, C.butter, C.dusty],
    ranunculus: [C.butter, C.peach, C.cream, C.blush, C.raspberry],
    zinnia: [C.raspberry, C.coral, C.butter, C.dusty, C.peach],
    poppy: [C.coral, C.blush, C.raspberry, C.peach],
    anemone: [C.cream, C.lavender, C.blush, C.white],
    cosmos: [C.blush, C.dusty, C.raspberry, C.white, C.burgundy],
    snapdragon: [C.dusty, C.blush, C.raspberry, C.lavender, C.butter],
    amaranth: [C.burgundy, C.raspberry, C.sage]
  };

  // ---- Each flower drawn once, about 10 units across its radius (filled with currentColor) ----
  function ring(n, len, width, offset, extra) {
    let out = '';
    for (let i = 0; i < n; i++) {
      out += `<path d="M0 0 C${r2(-width)} ${r2(-len * 0.3)} ${r2(-width * 0.7)} ${r2(-len * 0.85)} 0 ${r2(-len)} C${r2(width * 0.7)} ${r2(-len * 0.85)} ${r2(width)} ${r2(-len * 0.3)} 0 0Z" transform="rotate(${r1(i * 360 / n + offset)})"${extra || ''}/>`;
    }
    return out;
  }
  function dots(n, radius, r, fill) {
    let out = '';
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      out += `<circle cx="${r2(Math.cos(a) * radius)}" cy="${r2(Math.sin(a) * radius)}" r="${r}" fill="${fill}"/>`;
    }
    return out;
  }
  function ruffle(k, n, turn) {
    let out = `<circle r="${r2(10 * k * 0.74)}"/>`;
    for (let p = 0; p < n; p++) {
      const a = p / n * Math.PI * 2 + turn;
      out += `<circle cx="${r2(Math.cos(a) * 10 * k * 0.6)}" cy="${r2(Math.sin(a) * 10 * k * 0.6)}" r="${r2(10 * k * 0.42)}"/>`;
    }
    return out;
  }
  const SHADE = ' stroke="#3d1f28" stroke-opacity=".22" stroke-width=".4"';
  const DEFS = '<svg class="ib-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<radialGradient id="ib-glow-fill"><stop offset="0" stop-color="#fff4e6" stop-opacity=".95"/><stop offset=".35" stop-color="#f9cdd7" stop-opacity=".6"/><stop offset="1" stop-color="#f9cdd7" stop-opacity="0"/></radialGradient>' +
    // dahlia: three rings of pointed petals, paler towards the middle
    `<g id="ib-dahlia" fill="currentColor"${SHADE}>${ring(12, 10, 2.8, 0)}${ring(10, 7.4, 2.4, 18)}` +
    `${ring(8, 4.8, 1.9, 8)}<circle r="1.5" fill="#d9a441" stroke="none"/></g>` +
    // ranunculus: ruffled rings, opening paler at the heart
    `<g id="ib-ranunculus" fill="currentColor"${SHADE}>${ruffle(1, 8, 0)}${ruffle(0.7, 7, 0.4)}` +
    `${ruffle(0.42, 6, 0.9)}<circle r="1.3" fill="#b9c27a" stroke="none"/></g>` +
    // zinnia: tidy rows of rounded petals around a dark, gold-flecked centre
    `<g id="ib-zinnia" fill="currentColor"${SHADE}>` + Array.from({ length: 13 }, (_, i) => `<ellipse cy="-6.6" rx="2.5" ry="3.6" transform="rotate(${r1(i * 360 / 13)})"/>`).join('') +
    Array.from({ length: 11 }, (_, i) => `<ellipse cy="-4.2" rx="1.9" ry="2.6" transform="rotate(${r1(i * 360 / 11 + 16)})"/>`).join('') +
    `<circle r="2.6" fill="#7a3328" stroke="none"/>${dots(7, 2.6, 0.6, '#f2d27f')}</g>` +
    // poppy: four broad crinkled petals and a dark heart
    `<g id="ib-poppy" fill="currentColor"${SHADE}><circle cx="0" cy="-4.4" r="6"/><circle cx="4.4" cy="0" r="6"/><circle cx="0" cy="4.4" r="6"/><circle cx="-4.4" cy="0" r="6"/>` +
    '<path d="M-2 -8 Q0 -5 1 -8 M7 -2 Q5 0 7.5 1.5 M-1 7.5 Q1 5 2.5 8 M-7.5 1 Q-5 -1 -7 -3" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/>' +
    `<circle r="2.4" fill="#3a3528" stroke="none"/>${dots(10, 3.4, 0.6, '#2f2a24')}</g>` +
    // anemone: soft round petals around an inky centre
    `<g id="ib-anemone" fill="currentColor" stroke="#5a4a66" stroke-opacity=".2" stroke-width=".4">` + Array.from({ length: 6 }, (_, i) => `<ellipse cy="-5.4" rx="4" ry="5.2" transform="rotate(${i * 60})"/>`).join('') +
    `<circle r="2.8" fill="#2c3048" stroke="none"/>${dots(8, 3.7, 0.55, '#2c3048')}</g>` +
    // snapdragon: a stalk of florets, smaller towards the tip (base at 0,0, about 46 tall)
    '<g id="ib-snapdragon"><path d="M0 0 Q2.4 -23 0 -46" fill="none" stroke="#6f8a58" stroke-width="1.4" stroke-linecap="round"/>' +
    Array.from({ length: 8 }, (_, i) => {
      const t = 0.14 + i * 0.1;
      const s = 1 - t * 0.5;
      const side = i % 2 ? 1 : -1;
      return `<ellipse cx="${r2(side * 2 * s + 1.2 * t)}" cy="${r1(-46 * t)}" rx="${r2(3.4 * s)}" ry="${r2(2.7 * s)}" fill="currentColor"${SHADE}/>` +
        `<ellipse cx="${r2(side * 3.6 * s + 1.2 * t)}" cy="${r1(-46 * t + 1.2 * s)}" rx="${r2(2 * s)}" ry="${r2(1.5 * s)}" fill="#fff" fill-opacity=".45"/>`;
    }).join('') + '<ellipse cx="0.6" cy="-44" rx="1.4" ry="2.2" fill="#c9d6a8"/><ellipse cx="-0.4" cy="-47.5" rx="1" ry="1.6" fill="#c9d6a8"/></g>' +
    // trailing amaranthus: a soft rope of tiny beads hanging down (top at 0,0, about 60 long)
    '<g id="ib-amaranth"><path d="M0 0 C2 18 -4 34 3 60" fill="none" stroke="#5c3a34" stroke-width=".9"/>' +
    Array.from({ length: 15 }, (_, i) => {
      const t = i / 14;
      const u = 1 - t;
      const x = 3 * u * u * t * 2 + 3 * u * t * t * -4 + t * t * t * 3 + (i % 2 ? 1.2 : -1.2) * (1 - t * 0.5);
      const y = 3 * u * u * t * 18 + 3 * u * t * t * 34 + t * t * t * 60;
      return `<circle cx="${r2(x)}" cy="${r1(y)}" r="${r2(2.6 - t * 1.4)}" fill="currentColor"/>`;
    }).join('') + '</g>' +
    // a leaf (base at 0,0, about 24 long)
    '<g id="ib-leaf"><path d="M0 0 C5 -6 5 -17 0 -24 C-5 -17 -5 -6 0 0Z" fill="currentColor"/><path d="M0 -1 L0 -21" stroke="#fff" stroke-opacity=".3" stroke-width=".7"/></g>' +
    '</defs></svg>';
  let defsReady = false;

  // ---- Drawing helpers (screen pixels) ------------------------------------------------
  const SIZE = { dahlia: 10, ranunculus: 10, zinnia: 9.5, poppy: 10.4, anemone: 10.4, cosmos: 9.4, daisy: 8.4 };
  function bloom(kind, x, y, r, rot) {
    const id = kind === 'cosmos' ? 'bloom-cosmos' : kind === 'daisy' ? 'bloom-daisy' : 'ib-' + kind;
    const colour = kind === 'daisy' ? '' : ` style="color:${pick(KINDS[kind])}"`;
    return `<use href="#${id}" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)}) scale(${r2(r / SIZE[kind])})"${colour}/>`;
  }
  const leaf = (x, y, len, rot, colour) =>
    `<use href="#ib-leaf" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)}) scale(${r2(len / 24)})" style="color:${colour || pick(LEAVES)}"/>`;
  const stalk = (id, x, y, len, rot, full) =>
    `<use href="#ib-${id}" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)}) scale(${r2(len / full)})" style="color:${pick(KINDS[id])}"/>`;

  // a little cluster of growth, drawn around 0,0: leaves behind, blossoms on top
  function cluster(depth, size) {
    let out = '';
    const leaves = depth === 'front' ? 4 : 5;
    for (let i = 0; i < leaves; i++) {
      const a = i / leaves * 360 + rand(-25, 25);
      out += leaf(0, 0, size * rand(depth === 'front' ? 0.6 : 0.45, depth === 'front' ? 0.92 : 0.7), a);
    }
    if (depth === 'back') {
      for (let i = 0, n = Math.round(rand(2, 4)); i < n; i++) {
        const a = rand(0, Math.PI * 2), d = rand(0, size * 0.34);
        out += bloom(pick(['cosmos', 'cosmos', 'daisy', 'daisy', 'anemone', 'ranunculus', 'zinnia']), Math.cos(a) * d, Math.sin(a) * d, size * rand(0.1, 0.2), rand(0, 360));
      }
      return out;
    }
    if (depth === 'mid') {
      if (Math.random() < 0.3) out += stalk('snapdragon', rand(-size * 0.2, size * 0.2), size * 0.25, size * rand(0.8, 1.15), rand(-35, 35), 46);
      if (Math.random() < 0.22) out += stalk('amaranth', rand(-size * 0.2, size * 0.2), -size * 0.1, size * rand(0.7, 1), rand(-25, 25), 60);
      for (let i = 0, n = Math.round(rand(2, 4)); i < n; i++) {
        const a = rand(0, Math.PI * 2), d = rand(0, size * 0.3);
        out += bloom(pick(['dahlia', 'ranunculus', 'poppy', 'zinnia', 'anemone', 'cosmos', 'dahlia', 'ranunculus']), Math.cos(a) * d, Math.sin(a) * d, size * rand(0.17, 0.3), rand(0, 360));
      }
      for (let i = 0; i < 2; i++) out += bloom(pick(['daisy', 'cosmos']), rand(-size * 0.4, size * 0.4), rand(-size * 0.4, size * 0.4), size * rand(0.07, 0.11), rand(0, 360));
      return out;
    }
    // front: one or two huge blossoms, close to the viewer
    if (Math.random() < 0.25) out += stalk('snapdragon', rand(-size * 0.15, size * 0.15), size * 0.3, size * rand(0.9, 1.2), rand(-30, 30), 46);
    for (let i = 0, n = Math.random() < 0.5 ? 1 : 2; i < n; i++) {
      out += bloom(pick(['dahlia', 'ranunculus', 'poppy', 'cosmos', 'anemone', 'zinnia']), rand(-size * 0.2, size * 0.2), rand(-size * 0.2, size * 0.2), size * rand(0.26, 0.38), rand(0, 360));
    }
    return out;
  }

  // a long vine curling in from an edge, with leaves along it (and sometimes a flower at its tip)
  function vine(W, H, width, leafLen, delay, withFlower) {
    const side = pick(['top', 'top', 'left', 'right', 'bottom', 'left', 'right']);
    let p0;
    if (side === 'top') p0 = [rand(0, W), -10];
    else if (side === 'bottom') p0 = [rand(0, W), H + 10];
    else if (side === 'left') p0 = [-10, rand(0, H)];
    else p0 = [W + 10, rand(0, H)];
    const reach = rand(0.35, 0.7);
    const p3 = [p0[0] + (W / 2 - p0[0]) * reach + rand(-W, W) * 0.12, p0[1] + (H / 2 - p0[1]) * reach + rand(-H, H) * 0.12];
    const bend = rand(-1, 1) * Math.min(W, H) * 0.25;
    const nx = -(p3[1] - p0[1]), ny = p3[0] - p0[0], nl = Math.hypot(nx, ny) || 1;
    const c1 = [p0[0] + (p3[0] - p0[0]) * 0.33 + nx / nl * bend, p0[1] + (p3[1] - p0[1]) * 0.33 + ny / nl * bend];
    const c2 = [p0[0] + (p3[0] - p0[0]) * 0.66 - nx / nl * bend * 0.6, p0[1] + (p3[1] - p0[1]) * 0.66 - ny / nl * bend * 0.6];
    const dur = Math.round(rand(520, 700));
    let out = `<path class="ib-vine" pathLength="1" style="--d:${delay}ms; --dur:${dur}ms" d="M${r1(p0[0])} ${r1(p0[1])} C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p3[0])} ${r1(p3[1])}" fill="none" stroke="${pick(['#6f8a58', '#7f9a64', '#5f7a4c'])}" stroke-width="${width}" stroke-linecap="round"/>`;
    const at = (t) => {
      const u = 1 - t;
      return [u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]];
    };
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const [x, y] = at(t);
      const [x2, y2] = at(t + 0.02);
      const heading = Math.atan2(y2 - y, x2 - x) * 180 / Math.PI;
      out += `<g transform="translate(${r1(x)} ${r1(y)})"><g class="ib-grow" style="--d:${Math.round(delay + dur * t)}ms">${leaf(0, 0, leafLen * rand(0.8, 1.2), heading + (i % 2 ? 60 : -60) + 90)}</g></g>`;
    }
    if (withFlower) {
      out += `<g transform="translate(${r1(p3[0])} ${r1(p3[1])})"><g class="ib-grow ib-grow--open" style="--d:${delay + dur - 60}ms">` +
        bloom(pick(['cosmos', 'ranunculus', 'anemone', 'dahlia']), 0, 0, leafLen * 0.8, rand(0, 360)) + '</g></g>';
    }
    return { svg: out, x: p3[0] };
  }

  // ---- Ready-made clusters ------------------------------------------------------------------
  // Drawing hundreds of detailed flowers live would be too heavy, so while the landing page sits
  // quietly, a few dozen clusters are drawn once into images. The transition places many copies,
  // each turned, flipped and sized differently, and only ever moves finished pictures.
  const VARIANTS = { back: 12, mid: 14, front: 8 };
  const NOMINAL = { back: 1.2, mid: 1.47, front: 2.4 };   // each depth's usual cluster size, in far-layer spacings
  let sprites = null;

  const spacing = () => Math.min(190, Math.max(72, Math.max(window.innerWidth, window.innerHeight) / 9));

  function ensureDefs() {
    if (!defsReady) { document.body.insertAdjacentHTML('beforeend', DEFS); defsReady = true; }
  }

  function prepare() {
    const g = spacing();
    if (sprites && Math.abs(sprites.g - g) < 10) return sprites;   // already drawn for this screen
    release();
    ensureDefs();
    // an image can't see the page's drawings, so each carries its own copy of them
    const defs = DEFS.replace(/^<svg[^>]*><defs>/, '').replace(/<\/defs><\/svg>$/, '') +
      document.getElementById('bloom-cosmos').outerHTML + document.getElementById('bloom-daisy').outerHTML;
    const set = { g };
    const loading = [];
    Object.keys(VARIANTS).forEach((depth) => {
      const size = g * NOMINAL[depth];
      const box = Math.round(size * 1.1);
      set[depth] = Array.from({ length: VARIANTS[depth] }, () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-box} ${-box} ${box * 2} ${box * 2}" width="${box * 2}" height="${box * 2}"><defs>${defs}</defs>${cluster(depth, size)}</svg>`;
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        const sprite = { url, box };
        const img = new Image();
        img.src = url;
        if (LITE) {
          // painted once onto a small canvas, then the image itself is let go
          const loaded = img.decode ? img.decode() : new Promise((done, fail) => { img.onload = done; img.onerror = fail; });
          loading.push(loaded.then(() => {
            const c = document.createElement('canvas');
            c.width = c.height = Math.ceil(box * 2 * DPR);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            sprite.canvas = c;
          }, () => {}));
        } else if (img.decode) img.decode().catch(() => {});   // ready before anyone clicks
        return sprite;
      });
    });
    set.done = !LITE;
    set.ready = Promise.all(loading).then(() => { set.done = true; });
    sprites = set;
    return sprites;
  }

  // phones: hand the cluster canvases' memory straight back (Safari is slow to reclaim it on its own)
  function release() {
    if (!sprites || !LITE) return;
    Object.keys(VARIANTS).forEach((depth) => sprites[depth].forEach((s) => { if (s.canvas) { s.canvas.width = 0; s.canvas.height = 0; } }));
    sprites = null;
  }

  // ---- The transition -------------------------------------------------------------------
  let stage = null;
  let timers = [];
  let waiting = false;   // phones: the click came before the clusters were painted (only a moment)
  let painters = [];     // phones: one canvas per half-layer
  let frameId = 0;

  function grow() {
    ensureDefs();
    const sp = prepare();
    if (!sp.done) {
      waiting = true;
      sp.ready.then(() => {
        waiting = false;
        if (!stage && document.body.classList.contains('is-welcome')) grow();
      });
      return;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const b = button.getBoundingClientRect();
    const role = document.querySelector('.welcome__role').getBoundingClientRect();
    const g = spacing();   // the spacing of the far layer
    const edge = (x, y) => Math.max(0, Math.min(1, Math.min(x, W - x, y, H - y) / (Math.min(W, H) / 2)));

    // Each depth is drawn in two halves (left and right), which part as the view pushes through.
    // Vines and their leaves are drawn in one SVG per half; every cluster of flowers is one of the
    // ready-made images, so growing it in is a simple scale the browser does without redrawing.
    const parts = {};
    ['back', 'mid', 'front'].forEach((d) => { parts[d] = { left: { svg: '', cl: [] }, right: { svg: '', cl: [] } }; });
    const side = (x) => (x < W / 2 ? 'left' : 'right');
    const put = (depth, x, html) => { parts[depth][side(x)].svg += html; };
    const grown = (depth, x, y, size, start, span) => {
      const delay = Math.round(start + edge(x, y) * span + rand(0, 80));
      // each copy is shown at its image's own size (so it's only ever drawn once) and sized by --s
      const sprite = pick(sp[depth]);
      const half = sprite.box;
      const left = Math.round(x - half), top = Math.round(y - half);
      const r = Math.round(rand(-25, 25)), f = Math.random() < 0.5 ? -1 : 1, s = r2(size / (sp.g * NOMINAL[depth]));
      if (LITE) {
        parts[depth][side(x)].cl.push({ sprite, x: left + half, y: top + half, d: delay, r, f, s });
        return;
      }
      parts[depth][side(x)].cl.push([sprite.url, `left:${left}px; top:${top}px; width:${half * 2}px; height:${half * 2}px; ` +
        `--d:${delay}ms; --r:${r}deg; --f:${f}; --s:${s}`]);
    };

    // far away: small, soft flowers and leaves on a close-knit grid, so there are no gaps
    const gb = g * 1.12;
    for (let y = -gb * 0.3, row = 0; y < H + gb * 0.5; y += gb * 0.76, row++) {
      for (let x = -gb * 0.3 + (row % 2) * gb * 0.45; x < W + gb * 0.5; x += gb * 0.9) {
        grown('back', x + rand(-0.2, 0.2) * gb, y + rand(-0.2, 0.2) * gb, gb * rand(0.95, 1.2), RISE, 460);
      }
    }
    // the middle: dense clusters of big blooms, snapdragons and trailing amaranthus
    const G = g * 1.4;
    for (let y = -G * 0.2, row = 0; y < H + G * 0.4; y += G * 0.8, row++) {
      for (let x = -G * 0.2 + (row % 2) * G * 0.5; x < W + G * 0.4; x += G) {
        if (Math.random() < 0.18) continue;
        grown('mid', x + rand(-0.3, 0.3) * G, y + rand(-0.3, 0.3) * G, G * rand(0.85, 1.2), RISE + 60, 460);
      }
    }
    // ...and a few more across the middle, the last to fill in, so the peak is a full wall of blooms
    for (let i = 0; i < 7; i++) {
      grown('mid', W * rand(0.28, 0.72), H * rand(0.25, 0.78), G * rand(0.95, 1.25), RISE + 60, 460);
    }
    // up close: huge blossoms and leaves crowding in around the edges
    const F = g * 2.4;
    const perimeter = 2 * (W + H);
    for (let t = rand(0, F * 0.5); t < perimeter; t += F * rand(0.6, 0.85)) {
      let x, y;
      if (t < W) { x = t; y = 0; } else if (t < W + H) { x = W; y = t - W; } else if (t < 2 * W + H) { x = 2 * W + H - t; y = H; } else { x = 0; y = perimeter - t; }
      const inward = rand(-0.1, 0.3) * F;
      x += (x < W / 2 ? 1 : -1) * (x === 0 || x === W ? inward : 0);
      y += (y < H / 2 ? 1 : -1) * (y === 0 || y === H ? inward : 0);
      grown('front', x, y, F * rand(0.8, 1.15), RISE + 120, 300);
    }
    // long vines growing in from every edge
    [['back', 6, 2, g * 0.16], ['mid', 9, 3, g * 0.24], ['front', 4, 5.5, g * 0.42]].forEach(([depth, n, width, leafLen], k) => {
      for (let i = 0; i < n; i++) {
        const v = vine(W, H, width, leafLen, Math.round(RISE - 40 + k * 40 + rand(0, 160)), depth !== 'back' && Math.random() < 0.6);
        put(depth, v.x, v.svg);
      }
    });

    // the opening moment: one pink cosmos on a tiny stem just above the button
    const bx = b.left + b.width / 2;
    const gap = Math.max(18, b.top - role.bottom);
    const stemLen = Math.min(30, gap * 0.8);
    const headY = b.top - stemLen;
    const headR = 13 * Math.min(1.5, Math.max(1, b.height / 40));
    put('mid', bx,
      `<circle class="ib-glow" cx="${r1(bx)}" cy="${r1(headY)}" r="${r1(headR * 3.2)}" fill="url(#ib-glow-fill)"/>` +
      `<path class="ib-vine" pathLength="1" style="--d:0ms; --dur:280ms" d="M${r1(bx)} ${r1(b.top + 4)} Q${r1(bx - 4)} ${r1(b.top - stemLen * 0.5)} ${r1(bx)} ${r1(headY)}" fill="none" stroke="#6f8a58" stroke-width="1.8" stroke-linecap="round"/>` +
      [[-1, -70], [1, 70]].map(([side, rot], i) => `<g transform="translate(${r1(bx)} ${r1(b.top - stemLen * 0.4)})"><g class="ib-grow" style="--d:${140 + i * 70}ms">${leaf(0, 0, 12, rot, '#8fa871')}</g></g>`).join('') +
      `<g transform="translate(${r1(bx)} ${r1(headY)})"><g class="ib-grow ib-grow--open" style="--d:220ms"><use href="#bloom-cosmos" transform="scale(${r2(headR / 9.4)})" style="color:#e5a3b0"/></g></g>`);

    // assemble: back, middle, front, each in two halves that part at the end
    stage = document.createElement('div');
    stage.className = 'ib-stage';
    stage.setAttribute('aria-hidden', 'true');
    ['back', 'mid', 'front'].forEach((depth) => {
      ['left', 'right'].forEach((half) => {
        const p = parts[depth][half];
        const layer = document.createElement('div');
        layer.className = `ib-half ib-half--${depth} ib-half--${half}`;
        if (LITE) {
          const canvas = document.createElement('canvas');
          canvas.className = 'ib-canvas';
          canvas.width = Math.round(W * DPR);
          canvas.height = Math.round(H * DPR);
          layer.appendChild(canvas);
          painters.push({ canvas, ctx: canvas.getContext('2d'), cl: p.cl, alpha: depth === 'back' ? 0.93 : 1, still: false });
        } else p.cl.forEach(([url, style]) => {
          const img = document.createElement('img');
          img.className = 'ib-cl';
          img.alt = '';
          img.decoding = 'sync';
          img.style.cssText = style;
          img.src = url;
          layer.appendChild(img);
        });
        layer.insertAdjacentHTML('beforeend', `<svg class="ib-vines" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${p.svg}</svg>`);
        stage.appendChild(layer);
      });
    });
    document.body.appendChild(stage);
    welcome.classList.add('is-blooming');
    document.body.classList.add('ib-running');

    // when all six layers have drifted out and faded, the temporary flowers are removed
    let away = 0;
    stage.addEventListener('animationend', (event) => {
      if (event.animationName === 'ib-push' && ++away === 6) finish();
    });
    // phones: each canvas repaints its clusters every frame while any of them is still growing, exactly
    // as the CSS animation would (scale(0) until its moment, then 460ms with a soft overshoot), and
    // stops for good once they've all grown
    let grownAll = !LITE;
    let markGrown;
    const grownP = new Promise((done) => { markGrown = done; });
    const paintFrame = (now, t0) => {
      if (!stage) return;
      const t = now - t0;
      let busy = false;
      painters.forEach((pt) => {
        if (pt.still) return;
        const ctx = pt.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, pt.canvas.width, pt.canvas.height);
        ctx.globalAlpha = pt.alpha;
        let moving = false;
        pt.cl.forEach((k) => {
          const p = (t - k.d) / 460;
          if (p < 1) moving = true;
          if (p <= 0 || !k.sprite.canvas) return;
          const e = p >= 1 ? 1 : clusterEase(p);
          const amount = 0.06 + 0.94 * e;
          ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
          ctx.translate(k.x, k.y);
          ctx.rotate((k.r - 50 + 50 * e) * Math.PI / 180);
          ctx.scale(k.f * k.s * amount, k.s * amount);
          ctx.drawImage(k.sprite.canvas, -k.sprite.box, -k.sprite.box, k.sprite.box * 2, k.sprite.box * 2);
        });
        if (moving) busy = true; else pt.still = true;   // fully grown: its last picture simply stays
      });
      if (busy) frameId = window.requestAnimationFrame((next) => paintFrame(next, t0));
      else { grownAll = true; markGrown(); }
    };
    if (LITE) frameId = window.requestAnimationFrame((now) => paintFrame(now, now));

    // the moments are counted from the first frame the flowers are actually drawn
    const begin = () => {
      if (!stage) return;
      timers = [
        window.setTimeout(() => sfx('introBloom'), CHIME),
        window.setTimeout(() => sfx('introGrow'), RISE),
        window.setTimeout(reveal, REVEAL),
        window.setTimeout(push, PUSH)
      ];
    };
    // the view pushes forward once every flower has finished growing (on a busy phone that can take
    // a moment longer; it never waits more than 0.8s)
    const push = () => {
      if (!stage) return;
      const growing = LITE ? (grownAll ? [] : [grownP]) : stage.getAnimations ? stage.getAnimations({ subtree: true })
        .filter((a) => a.animationName === 'ib-cluster' && a.playState === 'running').map((a) => a.finished) : [];
      let pushed = false;
      const go = () => {
        if (pushed || !stage) return;
        pushed = true;
        stage.classList.add('is-pushing');
        timers.push(window.setTimeout(safetyNet, DONE - PUSH));
      };
      if (growing.length) { Promise.all(growing).then(go, go); timers.push(window.setTimeout(go, 800)); } else go();
    };
    // if the layers are somehow still drifting (a very busy phone), give them a little longer
    const safetyNet = () => {
      const moving = stage && stage.getAnimations && !document.hidden &&
        stage.getAnimations({ subtree: true }).some((a) => a.animationName === 'ib-push' && a.playState === 'running');
      if (moving) timers.push(window.setTimeout(finish, 2500)); else finish();
    };
    window.requestAnimationFrame(() => window.requestAnimationFrame(begin));
  }

  // clear the landing overlay (the usual welcome → garden change in js/main.js), behind the flowers
  function reveal() {
    if (location.hash !== '' && location.hash !== '#home') return;   // they've already gone elsewhere
    location.hash = 'garden';
  }

  // remove every temporary flower once the garden is showing
  function finish() {
    timers.forEach((t) => window.clearTimeout(t));
    timers = [];
    window.cancelAnimationFrame(frameId);
    painters.forEach((pt) => { pt.canvas.width = 0; pt.canvas.height = 0; });   // phones: free the canvases at once
    painters = [];
    if (stage) stage.remove();
    stage = null;
    release();   // phones: painted again (quietly) if the visitor comes back to the landing page
    welcome.classList.remove('is-blooming');
    document.body.classList.remove('ib-running');
  }

  button.addEventListener('click', (event) => {
    // a new tab, or already in the garden: just follow the link
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!document.body.classList.contains('is-welcome')) return;
    if (calm.matches) {
      // reduced motion: straight into the garden. The garden appears at once, so for a moment it
      // ignores taps (a quick double click shouldn't open the lake that sits behind the button).
      document.body.classList.add('is-arriving');
      window.setTimeout(() => document.body.classList.remove('is-arriving'), 600);
      return;
    }
    event.preventDefault();
    if (stage || waiting) return;   // already on the way: one transition per click
    grow();
  });

  // if the visitor heads somewhere else mid-way (the menu, the back button), let it go quietly
  window.addEventListener('hashchange', () => {
    if (stage && location.hash !== '#garden') finish();
    if (location.hash === '' || location.hash === '#home') whenIdle(ready);   // back on the landing page: be ready again
  });

  // draw the ready-made clusters while the landing page is quiet, so the click starts instantly
  // (the landing page is rarely completely idle, so it waits a second at most; a hover or focus on
  // the button is a good hint too)
  const whenIdle = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 1000 }) : (f) => window.setTimeout(f, 800);
  const ready = () => { if (!calm.matches && document.body.classList.contains('is-welcome')) prepare(); };
  whenIdle(ready);
  ['pointerenter', 'focus', 'touchstart'].forEach((type) => button.addEventListener(type, ready, { once: true, passive: true }));
})();
