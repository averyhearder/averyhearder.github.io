/* ==========================================================================
   A Day in Bloom · make your own bouquet
   The little flower cart in the greenhouse ("bouquet bar") opens a card
   where visitors tap buckets of stems to gather a bouquet in a glass jar
   (up to eight stems), then finish it with a twine bow and a note.

   Flowers are drawn with the greenhouse's own florist kit (window.Florist,
   js/greenhouse-flowers.js). A finished bouquet also sits in the jar on the
   cart, and is remembered in this browser for next time.
   ========================================================================== */
(function () {
  'use strict';

  const F = window.Florist;
  const dialog = document.getElementById('gh-bouquet');
  const station = document.getElementById('gh-station');
  if (!F || !dialog || !station) return;

  const SAVE_KEY = 'aDayInBloom.bouquet.v1';
  const MAX_STEMS = 10;
  const PNG_NAME = 'a-little-bouquet.png';

  // the buckets on the cart, in the order they're shown
  const KINDS = [
    { kind: 'snapdragon', label: 'snapdragons' },
    { kind: 'ranunculus', label: 'ranunculus' },
    { kind: 'cosmos', label: 'cosmos' },
    { kind: 'poppy', label: 'poppies' },
    { kind: 'zinnia', label: 'zinnias' },
    { kind: 'dahlia', label: 'dahlias' },
    { kind: 'amaranth', label: 'amaranthus' },
    { kind: 'greenery', label: 'greenery' },
    { kind: 'filler', label: 'little filler' }
  ];
  const ARTICLE = { snapdragon: 'a snapdragon', ranunculus: 'a ranunculus', cosmos: 'a cosmos', poppy: 'a poppy', zinnia: 'a zinnia', dahlia: 'a dahlia', amaranth: 'an amaranthus', greenery: 'some greenery', filler: 'a sprig of filler' };

  // where each new stem's flower goes: [across, up] from the middle of the jar's mouth.
  // Three loose layers (tall at the back, a middle layer, and a few low blooms tipping toward
  // the rim), no two at quite the same height, and a little lopsided on purpose, like a
  // hand-gathered bouquet. Any number of stems makes a balanced, airy bunch within the card.
  const SLOTS = [[-6, 158], [46, 56], [-50, 122], [10, 102], [-84, 80], [42, 134], [-62, 28], [80, 88], [-32, 76], [0, 42]];
  const CX = 150;
  const BASE_Y = 300;   // where stems rest at the bottom of the jar
  const MOUTH_Y = 226;  // the jar's rim

  const r1 = (n) => Math.round(n * 10) / 10;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

  // ---- Drawing ----------------------------------------------------------------
  const PALETTE = { snapdragon: F.COLOURS.snapdragon, ranunculus: F.COLOURS.ranunculus, dahlia: F.COLOURS.dahlia, zinnia: F.COLOURS.zinnia, poppy: F.COLOURS.poppy, amaranth: F.COLOURS.amaranth };
  const colourFor = (kind, ci) => (PALETTE[kind] ? PALETTE[kind][ci % PALETTE[kind].length] : null);

  // each flower's radius (the room it takes up); spires, tassels and filler are narrower
  const SIZE = { dahlia: 24, ranunculus: 19, poppy: 18, zinnia: 17, cosmos: 17, snapdragon: 10, amaranth: 10, filler: 12 };
  const BLOOMS = ['dahlia', 'ranunculus', 'poppy', 'zinnia', 'cosmos'];

  function head(kind, x, y, colour, k = 1) {
    const r = SIZE[kind] * k;
    switch (kind) {
      case 'dahlia': return F.dahlia(x, y, r, colour);
      case 'ranunculus': return F.ranunculus(x, y, r, colour);
      case 'zinnia': return F.zinnia(x, y, r, colour);
      case 'poppy': return F.poppy(x, y, r, colour);
      default: return F.cosmosHead(x, y, r);
    }
  }

  // flowers at the back are drawn a touch smaller and the low ones at the front a touch larger,
  // which gives the bouquet its depth
  const depth = (y) => 0.9 + 0.14 * clamp((y - 68) / 130, 0, 1);

  // how far each kind leans out of the jar (greenery, filler and spires a little less than the
  // flowers, so nothing angles out too sharply)
  const LEAN = { greenery: 0.72, filler: 0.72, snapdragon: 0.8, amaranth: 0.85 };

  // Where a new stem's flower sits: it starts at its slot, then shifts a little (never far) to
  // the spot nearby where it hides the least of the flowers already in the jar. Big blooms
  // like dahlias claim more room, and blooms in the middle don't line up at one height.
  // It depends only on the stems before it, so a saved bouquet comes back exactly the same.
  function place(kind, slot, earlier) {
    const [across, up] = SLOTS[slot];
    const tx = CX + across * (LEAN[kind] || 1);
    const ty = MOUTH_Y - up;
    if (kind === 'greenery') return { x: tx, y: ty };
    const r = SIZE[kind] * depth(ty);
    const bloom = BLOOMS.includes(kind);
    let best = null;
    [0, 6, 12, 18].forEach((ring) => {
      for (let k = 0; k < (ring ? 8 : 1); k++) {
        const a = (k + ring / 12) * Math.PI / 4;
        const x = tx + Math.cos(a) * ring;
        const y = ty + Math.sin(a) * ring;
        let cost = 0.15 * ring * ring;
        earlier.forEach((other) => other.spots.forEach(([ox, oy, or, weight, isBloom]) => {
          const need = (r + or) * 0.8;   // a little layering is lovely; hiding most of a flower isn't
          const d = Math.hypot(x - ox, y - oy);
          if (d < need) cost += weight * (need - d) ** 2;
          const level = 9 - Math.abs(y - oy);
          if (bloom && isBloom && level > 0 && Math.abs(x - ox) < 70 && Math.abs(x - CX) < 50 && Math.abs(ox - CX) < 50) cost += 2 * level * level;
        }));
        // stay within the card and above the rim
        const over = Math.max(0, 34 - (x - r), (x + r) - 266, 28 - (y - r), y - 202);
        cost += 40 * over * over;
        if (!best || cost < best.cost) best = { x, y, cost };
      }
    });
    return best;
  }

  // one stem, drawn in the stage's coordinates. Every stem rises inside the jar from its base to a
  // point in the jar's mouth, and only spreads out above the rim from there, so nothing pokes
  // through the glass; leaves, flowers and greenery open naturally above. It also notes the room
  // its flower takes up (stem.spots: x, y, radius, how much it minds being covered, is a bloom).
  function drawStem(stem) {
    const hx = stem.x;
    const hy = stem.y;
    const a = Math.atan2(hx - CX, MOUTH_Y - hy);
    const deg = a * 180 / Math.PI;
    const s = Math.sin(a);
    const len = Math.hypot(hx - CX, MOUTH_Y - hy);
    const side = s > 0.02 || (s >= -0.02 && stem.slot % 2) ? 1 : -1;
    const bx = CX + s * 10;                 // its foot, at the bottom of the jar
    const ex = CX + s * 30;                 // where it leaves the jar, well inside the mouth (108-192)
    const colour = colourFor(stem.kind, stem.ci);
    const k = depth(hy);
    stem.spots = [];
    // up through the water, then out of the mouth in a gentle curve to the flower
    const rise = (x, top, w, tone) => `<path d="M${r1(bx)} ${BASE_Y} Q${r1((bx + x) / 2)} ${r1((BASE_Y + MOUTH_Y) / 2)} ${r1(x)} ${r1(top)}" fill="none" stroke="${tone || '#6f8a58'}" stroke-width="${w || 2.4}" stroke-linecap="round"/>`;
    const stalk = rise(ex, MOUTH_Y) +
      `<path d="M${r1(ex)} ${MOUTH_Y} Q${r1(ex + (hx - ex) * 0.25)} ${r1(MOUTH_Y - (MOUTH_Y - hy) * 0.6)} ${r1(hx)} ${r1(hy)}" fill="none" stroke="#6f8a58" stroke-width="2.4" stroke-linecap="round"/>`;
    // a leaf partway up; on the low blooms by the rim it turns upward rather than droop over the glass
    const lx = ex + (hx - ex) * 0.4;
    const ly = MOUTH_Y - (MOUTH_Y - hy) * 0.45;
    const droops = ly + 24 * Math.sin((-90 + deg + side * 52) * Math.PI / 180) > 204;
    const leafy = F.leaf(lx, ly, 24, -90 + deg + (droops ? -side : side) * 52);

    switch (stem.kind) {
      case 'snapdragon': {
        // the spire starts just under the rim, its florets gathered around the flower's spot
        const foot = MOUTH_Y + 10;
        const height = clamp((foot - hy) / 0.69, 70, foot - 48);
        const lean = clamp((hx - ex) / 0.69, -height * 0.6, height * 0.6);
        stem.spots = [[0.5, 9], [0.69, 8], [0.88, 6]].map(([f, r]) => [ex + lean * f, foot - height * f, r, 0.8, false]);
        return rise(ex, foot, 2.2) + F.snapdragon(ex, foot, height, colour, lean);
      }
      case 'amaranth': {
        // tassels fall longer and swing wider toward the outside, and stay shorter in the middle,
        // so they drape over the edge instead of across the other flowers
        const outer = Math.min(1, Math.abs(hx - CX) / 70);
        const drop = Math.min(70 + 26 * outer, 276 - hy);   // never lower than halfway down the jar
        const sway = side * (14 + 16 * outer);
        const along = (t) => [hx + sway * (t * t * 0.6 + t * 0.4), hy + drop * t];
        stem.spots = [[hx, hy, 9, 1, false], [...along(0.45), 8, 0.6, false], [...along(0.85), 6, 0.6, false]];
        return stalk + leafy + F.amaranthus(hx, hy, drop, sway, colour);
      }
      case 'greenery':
        // a branch rises from the mouth, with a second, shorter sprig just beside it
        return rise(ex, MOUTH_Y, 1.4, '#7d8f78') +
          F.eucalyptus(ex, MOUTH_Y, len + 4, -90 + deg) + F.eucalyptus(ex - side * 3, MOUTH_Y - 4, (len + 40) * 0.6, -90 + deg + side * 8);
      case 'filler':
        // little sprays tuck in between the blooms, so they hardly mind being covered
        stem.spots = [[hx, hy, 12, 0.4, false], [hx - s * 20, hy + 22, 9, 0.4, false]];
        return stalk + leafy + F.filler(hx, hy, 18, 18) + F.filler(hx - s * 20, hy + 22, 12, 9);
      default:
        stem.spots = [[hx, hy, SIZE[stem.kind] * k, 1, true]];
        return stalk + leafy + head(stem.kind, hx, hy, colour, k);
    }
  }

  const JAR =
    `<path d="M108 226 L108 300 Q108 314 122 314 L178 314 Q192 314 192 300 L192 226 Z" fill="#dcebea" fill-opacity=".45" stroke="#ffffff" stroke-width="2.4"/>` +
    '<path d="M110 252 L190 252 L190 300 Q190 312 178 312 L122 312 Q110 312 110 300 Z" fill="#bcd5d4" opacity=".35"/>' +
    '<path d="M110 252 Q150 256 190 252" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.4"/>' +
    '<path d="M118 238 V302" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" opacity=".7"/>' +
    '<path d="M182 246 V296" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>' +
    '<rect x="104" y="219" width="92" height="9" rx="4.5" fill="#ffffff" fill-opacity=".65" stroke="#d9e6e5" stroke-width="1"/>';

  // the twine bow and a little kraft tag, added when the bouquet is finished
  const BOW =
    '<path d="M110 240 Q150 248 190 240" fill="none" stroke="#c9a57a" stroke-width="3"/>' +
    '<path d="M150 244 C136 230 122 236 128 246 C132 252 144 248 150 244 C156 248 168 252 172 246 C178 236 164 230 150 244 Z" fill="none" stroke="#b9925f" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<path d="M150 244 Q144 262 136 274 M150 244 Q158 260 168 270" fill="none" stroke="#b9925f" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle cx="150" cy="244" r="3.2" fill="#c9a57a"/>' +
    '<g transform="rotate(-10 168 270)"><path d="M168 270 L172 280" stroke="#b9925f" stroke-width="1.2"/>' +
    '<path d="M160 280 H196 L202 290 L196 300 H160 Z" fill="#e2c59a" stroke="#b39468" stroke-width="1"/>' +
    '<circle cx="197" cy="290" r="1.6" fill="#b39468"/>' +
    '<text x="178" y="294.5" text-anchor="middle" font-family="Caveat, cursive" font-size="12" font-weight="600" fill="#5a4636">for you ♡</text></g>';

  // the whole arrangement: greenery at the back, then the amaranthus tassels, then the flowers
  // from the highest (at the back) to the lowest (at the front), then the jar
  const LAYER = { greenery: 0, amaranth: 1 };
  function arrangementSVG(stems, finished, newest) {
    const layer = (stem) => (stem.kind in LAYER ? LAYER[stem.kind] : 2);
    const order = stems.slice().sort((p, q) => layer(p) - layer(q) || p.y - q.y);
    const flowers = order.map((stem) => `<g class="gh-bq-stem${stem === newest ? ' is-new' : ''}">${stem.svg}</g>`).join('');
    return flowers + JAR + (finished ? `<g class="gh-bq-bow">${BOW}</g>` : '');
  }

  // a little bucket of each flower, for the buttons
  function bucketIcon(kind) {
    const c = (i) => colourFor(kind, i);
    let bunch = '';
    if (kind === 'snapdragon') bunch = F.snapdragon(-12, 0, 84, c(0), -8) + F.snapdragon(12, 0, 74, c(1), 8);
    else if (kind === 'amaranth') bunch = F.stem(-4, 0, -14, -56, 3) + F.stem(4, 0, 12, -62, 3) + F.leaf(0, -24, 22, -130) + F.amaranthus(-14, -56, 50, -10, c(0)) + F.amaranthus(12, -62, 56, 10, c(1));
    else if (kind === 'greenery') bunch = F.eucalyptus(-6, 0, 82, -112) + F.eucalyptus(6, 0, 76, -70) + F.leaf(0, -20, 26, -60);
    else if (kind === 'filler') bunch = F.stem(-4, 0, -12, -56, 2) + F.stem(4, 0, 14, -60, 2) + F.filler(-12, -56, 13, 14) + F.filler(14, -60, 13, 14);
    else {
      [[-18, -46, 0], [18, -48, 1], [0, -66, 2]].forEach(([x, y, i]) => { bunch += F.stem(x * 0.3, 0, x, y, 2.4) + head(kind, x, y, c(i)); });
      bunch = F.leaf(-6, -16, 24, -150) + F.leaf(6, -18, 24, -30) + bunch;
    }
    return '<svg viewBox="0 0 64 74" aria-hidden="true">' +
      `<g transform="translate(32 50) scale(.5)">${bunch}</g>` +
      '<path d="M15 48 L49 48 L45 71 L19 71 Z" fill="url(#galv-body)"/>' +
      '<path d="M16 58 H48" stroke="#ffffff" stroke-opacity=".5" stroke-width="1.4"/>' +
      '<rect x="12.5" y="45" width="39" height="6" rx="3" fill="url(#galv-rim)"/></svg>';
  }

  // ---- State --------------------------------------------------------------------
  const stage = document.getElementById('gh-bouquet-stage');
  const list = document.getElementById('gh-bouquet-stems');
  const count = document.getElementById('gh-bouquet-count');
  const message = document.getElementById('gh-bouquet-message');
  const sub = document.getElementById('gh-bouquet-sub');
  const clearButton = document.getElementById('gh-bouquet-clear');
  const finishButton = document.getElementById('gh-bouquet-finish');
  const keep = document.getElementById('gh-bouquet-keep');
  const saveButton = document.getElementById('gh-bouquet-save');
  const sendButton = document.getElementById('gh-bouquet-send');
  const keepNote = document.getElementById('gh-bouquet-keep-note');
  const roomJar = document.getElementById('gh-station-jar');

  let stems = [];
  let finished = false;
  let picture = null;   // the finished bouquet as a PNG (a promise of a Blob), made once

  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };

  function makeStem(kind, slot, ci, earlier) {
    const stem = { kind, slot, ci, ...place(kind, slot, earlier) };
    stem.svg = drawStem(stem);
    return stem;
  }

  function save() {
    try {
      if (finished) localStorage.setItem(SAVE_KEY, JSON.stringify({ stems: stems.map(({ kind, slot, ci }) => ({ kind, slot, ci })) }));
      else localStorage.removeItem(SAVE_KEY);
    } catch (error) { /* storage blocked: the bouquet still works for this visit */ }
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved || !Array.isArray(saved.stems)) return;
      const valid = saved.stems.filter((s) => KINDS.some((k) => k.kind === s.kind) && SLOTS[s.slot] && Number.isInteger(s.ci)).slice(0, MAX_STEMS);
      if (!valid.length) return;
      stems = [];
      valid.forEach((s) => stems.push(makeStem(s.kind, s.slot, s.ci, stems)));
      finished = true;
    } catch (error) { /* start with an empty jar */ }
  }

  // the jar on the cart in the room (scaled down from the card's drawing; its base rests
  // on the cart's top at y 664)
  function renderRoomJar() {
    const k = 0.75;
    roomJar.innerHTML = `<g transform="translate(${r1(1092 - CX * k)} ${r1(664 - 314 * k)}) scale(${k})">` +
      '<ellipse cx="150" cy="315" rx="54" ry="5" fill="#2f281f" opacity=".16"/>' +
      arrangementSVG(finished ? stems : [], finished) + '</g>';
  }

  function render(newest) {
    stage.innerHTML = '<rect x="10" y="316" width="280" height="16" fill="#c9a57a" opacity=".55"/>' +
      '<ellipse cx="150" cy="316" rx="62" ry="6" fill="#2f281f" opacity=".15"/>' +
      `<g>${arrangementSVG(stems, finished, newest)}</g>`;

    const full = stems.length >= MAX_STEMS;
    list.querySelectorAll('button').forEach((button) => {
      const off = finished || full;
      button.setAttribute('aria-disabled', String(off));
      button.classList.toggle('is-off', off);
    });
    if (finished) count.textContent = 'all wrapped up ♡';
    else if (!stems.length) count.textContent = 'an empty jar, ready for flowers';
    else if (full) count.textContent = `${MAX_STEMS} of ${MAX_STEMS} stems · your jar is full ♡`;
    else count.textContent = `${stems.length} of ${MAX_STEMS} stems`;

    message.hidden = !finished;
    keep.hidden = !finished;
    dialog.classList.toggle('is-finished', finished);
    sub.textContent = finished ? 'it’s all yours: freshly picked, just for you' : 'Colour, texture and balance can completely change how something feels, whether it’s a bouquet or a room.';
    finishButton.hidden = finished;
    finishButton.disabled = !stems.length;
    clearButton.textContent = finished ? 'start a new bouquet' : 'clear bouquet';
    clearButton.disabled = !stems.length;
    stage.setAttribute('aria-label', stems.length
      ? `Your bouquet, in a glass jar: ${stems.map((s) => ARTICLE[s.kind]).join(', ')}${finished ? ', tied with a twine bow' : ''}`
      : 'An empty glass jar, ready for flowers');
  }

  function addStem(kind) {
    if (finished || stems.length >= MAX_STEMS) return;
    const ci = stems.filter((s) => s.kind === kind).length + Math.floor(Math.random() * 2);
    const stem = makeStem(kind, stems.length, ci, stems);
    stems.push(stem);
    sfx('stem');
    render(stem);
  }

  function clear() {
    if (finished || stems.length) sfx('seed');
    stems = [];
    finished = false;
    picture = null;
    keepNote.textContent = '';
    save();
    render();
    renderRoomJar();
  }

  function finish() {
    if (!stems.length || finished) return;
    finished = true;
    save();
    sfx('bloom');
    render();
    renderRoomJar();
    // start drawing the PNG now, so sharing can happen straight from the tap
    getPicture().catch(() => { /* tried again when a button is pressed */ });
    saveButton.focus({ preventScroll: true });
  }

  // ---- Keeping the bouquet: a PNG to save or share ------------------------------------
  const NS = 'http://www.w3.org/2000/svg';
  const HAND = '"Caveat", "Segoe Print", "Bradley Hand", cursive';
  const SERIF = '"Cormorant Garamond", Georgia, serif';
  const SANS = '"Jost", "Helvetica Neue", Arial, sans-serif';

  // the arrangement exactly as it appears in the jar, measured so it can be framed nicely
  function measure(art) {
    const probe = document.createElementNS(NS, 'svg');
    probe.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden');
    probe.innerHTML = `<g>${art}</g>`;
    document.body.appendChild(probe);
    const box = probe.firstChild.getBBox();
    probe.remove();
    return box;
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // a tiny pressed cosmos on a curved stem with two leaves, centred on (x, y)
  function pressedFlower(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-12 * Math.PI / 180);
    ctx.strokeStyle = '#7f9a64';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 26);
    ctx.quadraticCurveTo(2, 10, 0, -4);
    ctx.stroke();
    ctx.fillStyle = '#93ad76';
    [[-3, 16, -0.9], [2, 10, 0.8]].forEach(([lx, ly, a]) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(a < 0 ? -7 : 7, 0, 8, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = '#efbcc4';
    ctx.strokeStyle = 'rgba(176, 105, 122, .55)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(i * Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, -7, 3.6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#dcae46';
    ctx.beginPath();
    ctx.arc(0, -12, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // a small, softly drawn Instagram mark (rounded square, lens and dot) at (x, y)
  function instagramMark(ctx, x, y, size) {
    ctx.save();
    ctx.strokeStyle = '#9b5d6c';
    ctx.fillStyle = '#9b5d6c';
    ctx.lineWidth = 2;
    const r = size * 0.28;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + size, y, x + size, y + size, r);
    ctx.arcTo(x + size, y + size, x, y + size, r);
    ctx.arcTo(x, y + size, x, y, r);
    ctx.arcTo(x, y, x + size, y, r);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size * 0.22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + size * 0.76, y + size * 0.24, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  async function drawPicture() {
    const W = 1200;
    const H = 1800;   // a tall postcard: heading, bouquet, then a signature with room to breathe
    const art = arrangementSVG(stems, true);
    const box = measure(art);
    const pad = 10;
    const vb = { x: box.x - pad, y: box.y - pad, w: box.width + pad * 2, h: box.height + pad * 2 };
    // the bouquet sits between the heading and the caption, resting on the same line every time
    const s = Math.min(960 / vb.w, 990 / vb.h);
    const dw = vb.w * s;
    const dh = vb.h * s;
    const dx = (W - dw) / 2;
    const dy = 1250 - dh;
    const at = (x, y) => [dx + (x - vb.x) * s, dy + (y - vb.y) * s];

    // the drawing on its own, as a standalone SVG image (the tag's words are added below
    // with the real handwriting font, which an SVG image can't load by itself)
    const cosmos = document.getElementById('bloom-cosmos').outerHTML;
    const svg = `<svg xmlns="${NS}" viewBox="${r1(vb.x)} ${r1(vb.y)} ${r1(vb.w)} ${r1(vb.h)}" width="${Math.round(dw)}" height="${Math.round(dh)}">` +
      `<defs>${cosmos}</defs>${art.replace(/<text[\s\S]*?<\/text>/g, '')}</svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      // every typeface the postcard uses must be ready before drawing, or the text would fall back
      await Promise.all([`600 80px ${HAND}`, `italic 40px ${SERIF}`, `400 22px ${SANS}`].map((f) => document.fonts.load(f, 'a little bouquet ♡ @violainedesign ✿').catch(() => null)));
    } catch (error) { /* fonts unavailable: the page's fallbacks are used */ }
    const img = await loadImage(url).finally(() => window.setTimeout(() => URL.revokeObjectURL(url), 0));

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // warm cream paper with faint ruled lines and a soft light in the middle
    ctx.fillStyle = '#f8f3e7';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(226, 143, 161, .09)';
    ctx.lineWidth = 2;
    for (let y = 92; y < H; y += 46) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    const glow = ctx.createRadialGradient(W / 2, 720, 80, W / 2, 720, 820);
    glow.addColorStop(0, 'rgba(255, 253, 246, .9)');
    glow.addColorStop(1, 'rgba(248, 243, 231, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // a stitched border and a strip of pink gingham washi tape
    ctx.save();
    ctx.setLineDash([12, 9]);
    ctx.strokeStyle = 'rgba(176, 105, 122, .35)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, 40, W - 80, H - 80);
    ctx.restore();
    ctx.save();
    ctx.translate(W / 2, 46);
    ctx.rotate(-3 * Math.PI / 180);
    ctx.fillStyle = 'rgba(241, 201, 205, .9)';
    ctx.fillRect(-120, -22, 240, 44);
    ctx.fillStyle = 'rgba(255, 255, 255, .45)';
    for (let x = -120; x < 120; x += 16) ctx.fillRect(x, -22, 8, 44);
    for (let y = -22; y < 22; y += 16) ctx.fillRect(-120, y, 240, 8);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#b0697a';
    ctx.font = `600 84px ${HAND}`;
    ctx.fillText('a little bouquet for you ♡', W / 2, 186);

    // a soft shadow where the jar rests, then the bouquet itself
    const [jx, jy] = at(150, 315);
    ctx.save();
    ctx.translate(jx, jy);
    ctx.scale(1, 0.12);
    const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 70 * s);
    shadow.addColorStop(0, 'rgba(47, 40, 31, .22)');
    shadow.addColorStop(1, 'rgba(47, 40, 31, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, 70 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(img, dx, dy, dw, dh);

    // the words on the kraft tag
    const [tx, ty] = at(168, 270);
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(-10 * Math.PI / 180);
    ctx.fillStyle = '#5a4636';
    ctx.font = `600 ${r1(12 * s)}px ${HAND}`;
    ctx.fillText('for you ♡', 10 * s, 24.5 * s);
    ctx.restore();

    ctx.fillStyle = '#6a7362';
    ctx.font = `italic 44px ${SERIF}`;
    ctx.fillText('freshly gathered in the greenhouse', W / 2, 1338);

    // ---- the postcard's signature ----
    // a pressed cosmos between two fine lines
    const divY = 1430;
    ctx.strokeStyle = 'rgba(176, 105, 122, .38)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(390, divY); ctx.lineTo(556, divY);
    ctx.moveTo(644, divY); ctx.lineTo(810, divY);
    ctx.stroke();
    pressedFlower(ctx, W / 2, divY);

    ctx.fillStyle = '#b0697a';
    ctx.font = `600 66px ${HAND}`;
    ctx.fillText('with love, Avery ♡', W / 2, 1532);

    ctx.fillStyle = '#6b4f3a';
    ctx.font = `400 22px ${SANS}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '5px';
    ctx.fillText('AVERY HEARDER · A DAY IN BLOOM', W / 2, 1592);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';

    // a little hand-drawn Instagram mark beside the handle
    ctx.font = `400 26px ${SANS}`;
    const handle = '@violainedesign';
    const handleWidth = ctx.measureText(handle).width;
    const iconSize = 24;
    const lineLeft = W / 2 - (iconSize + 12 + handleWidth) / 2;
    instagramMark(ctx, lineLeft, 1640 - iconSize / 2 - 9, iconSize);
    ctx.fillStyle = '#9b5d6c';
    ctx.textAlign = 'left';
    ctx.fillText(handle, lineLeft + iconSize + 12, 1640);
    ctx.textAlign = 'center';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

    ctx.fillStyle = '#6a7362';
    ctx.font = `italic 32px ${SERIF}`;
    ctx.fillText('come visit the garden again ✿', W / 2, 1704);

    return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('no image'))), 'image/png'));
  }

  function getPicture() {
    if (!picture) picture = drawPicture().catch((error) => { picture = null; throw error; });
    return picture;
  }

  function download(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = PNG_NAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function busy(button, on) {
    button.disabled = on;
    button.setAttribute('aria-busy', String(on));
  }

  async function savePicture() {
    busy(saveButton, true);
    try {
      download(await getPicture());
      sfx('sketchbook');
      keepNote.textContent = 'saved as a-little-bouquet.png ♡';
    } catch (error) {
      keepNote.textContent = 'sorry, the picture couldn’t be made in this browser ♡';
    }
    busy(saveButton, false);
  }

  // Share the real PNG with the device's own share sheet (email, messages…) where the
  // browser can share files. Otherwise save it, and say so honestly.
  async function sendPicture() {
    busy(sendButton, true);
    try {
      const blob = await getPicture();
      const file = new File([blob], PNG_NAME, { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'a little bouquet for you ♡', text: 'freshly gathered in the greenhouse at A Day in Bloom ✿' });
          keepNote.textContent = 'sent with love ♡';
        } catch (error) {
          if (error && error.name === 'AbortError') keepNote.textContent = '';
          else {
            download(blob);
            keepNote.textContent = 'sharing didn’t work this time, so your bouquet was saved as a-little-bouquet.png instead ♡ you can attach it to an email or message.';
          }
        }
      } else {
        download(blob);
        keepNote.textContent = 'this browser can’t share pictures directly, so your bouquet was saved as a-little-bouquet.png ♡ you can attach it to an email or message.';
      }
    } catch (error) {
      keepNote.textContent = 'sorry, the picture couldn’t be made in this browser ♡';
    }
    busy(sendButton, false);
  }

  // ---- The card -----------------------------------------------------------------
  list.innerHTML = KINDS.map(({ kind, label }) =>
    `<li><button type="button" class="gh-bq-bucket" data-kind="${kind}" aria-label="Add ${ARTICLE[kind]}">` +
    `${bucketIcon(kind)}<span class="hand">${label}</span></button></li>`).join('');

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-kind]');
    if (button && button.getAttribute('aria-disabled') !== 'true') addStem(button.dataset.kind);
  });
  clearButton.addEventListener('click', clear);
  finishButton.addEventListener('click', finish);
  saveButton.addEventListener('click', savePicture);
  sendButton.addEventListener('click', sendPicture);

  function open() {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const first = finished ? saveButton : list.querySelector('button');
    first.focus({ preventScroll: true });
    if (finished) getPicture().catch(() => { /* tried again when a button is pressed */ });
  }

  function close() {
    if (!dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  station.addEventListener('click', () => { sfx('seed'); open(); });
  dialog.querySelectorAll('[data-bouquet-close]').forEach((button) => button.addEventListener('click', close));
  dialog.addEventListener('close', () => { if (location.hash === '#greenhouse') station.focus({ preventScroll: true }); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') event.stopPropagation();   // closes only the card, not the greenhouse
  });
  window.addEventListener('hashchange', close);

  load();
  render();
  renderRoomJar();
})();
