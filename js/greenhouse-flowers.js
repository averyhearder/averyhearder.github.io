/* ==========================================================================
   A Day in Bloom · greenhouse florist
   Fills the greenhouse room with flowers: buckets of mixed bouquets, a cream
   vase on the bench, jars of cut flowers, hanging pots of amaranthus and
   ivy, vines climbing the frames, a woven rug, a stool and scattered petals.

   Each variety has its own drawing (snapdragon spires, layered ranunculus,
   pointed-petal dahlias, zinnias, poppies, cosmos, daisies and filler), so
   the arrangements feel botanical rather than repeated.

   Swaying pieces live on a few separate layers that each move at their own
   pace (styles in css/greenhouse.css). Like the garden's scenery painter,
   it uses a seeded random generator, so the room looks the same every visit.
   ========================================================================== */
(function () {
  'use strict';

  // ---- Little helpers ----------------------------------------------------
  let seed = 4271;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const between = (min, max) => min + random() * (max - min);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const r1 = (n) => Math.round(n * 10) / 10;

  // ---- Palette -------------------------------------------------------------
  const COLOURS = {
    snapdragon: [['#f2a7b8', '#f9d0d9', '#d9859b'], ['#f6c3a0', '#fbdcc6', '#e3a07c'], ['#f4ecdc', '#fffaf1', '#d9cbb0'], ['#a3405a', '#c4677d', '#7d2c42']],
    ranunculus: [['#f4c0c3', '#fadadb', '#d98f99'], ['#f39a86', '#f8bba9', '#d6705e'], ['#f3d686', '#f8e7b6', '#d8b05a'], ['#f4ad74', '#f9caa0', '#d98650']],
    dahlia: [['#f6bc9c', '#fad6c0', '#e5946f'], ['#f2c1c6', '#f9dcde', '#dc97a2'], ['#d99aa3', '#ebbcc2', '#bd7884'], ['#d9567d', '#e98aa6', '#b5395f']],
    zinnia: [['#ec8fae', '#f5b5ca'], ['#f5b28c', '#f9cfb2'], ['#c9416c', '#de6c90'], ['#f6eedc', '#fffaf1']],
    poppy: [['#f48a73', '#f8ab95'], ['#f3bcc0', '#f9dadb'], ['#f5ede0', '#fffaf2'], ['#f3a35b', '#f8c28c']],
    cosmos: ['#efbcc4', '#e39aa8', '#f4d3d5', '#fbe9e7', '#d97a96'],
    leaf: ['#6f8a58', '#7f9a64', '#8fa871', '#5f7a4a', '#93ad76', '#a3b882', '#86a169'],
    amaranth: ['#8f2f4b', '#a8435a', '#7a2440', '#b4566c'],
    euc: ['#9fb5a2', '#8fa894', '#b3c4b0']
  };

  // ---- Plant pieces --------------------------------------------------------
  function leaf(x, y, length, angle, fill) {
    const w = length * 0.32;
    return `<path d="M0 0 C${r1(length * 0.3)} ${r1(-w)} ${r1(length * 0.75)} ${r1(-w * 0.8)} ${r1(length)} 0 ` +
      `C${r1(length * 0.75)} ${r1(w * 0.8)} ${r1(length * 0.3)} ${r1(w)} 0 0 Z" fill="${fill || pick(COLOURS.leaf)}" ` +
      `transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})"/>`;
  }

  function stem(x1, y1, x2, y2, width) {
    const bend = between(-12, 12);
    return `<path d="M${r1(x1)} ${r1(y1)} Q${r1((x1 + x2) / 2 + bend)} ${r1((y1 + y2) / 2)} ${r1(x2)} ${r1(y2)}" ` +
      `fill="none" stroke="#6f8a58" stroke-width="${width || 1.8}" stroke-linecap="round"/>`;
  }

  // eucalyptus: round silvery leaves along a stem
  function eucalyptus(x, y, length, angle) {
    let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angle)})"><path d="M0 0 L${r1(length)} 0" stroke="#7d8f78" stroke-width="1.4"/>`;
    for (let d = 8; d < length; d += 8) {
      const side = (d / 8) % 2 ? 1 : -1;
      const size = 4.4 * (1 - d / length * 0.5);
      s += `<ellipse cx="${r1(d)}" cy="${r1(side * size * 0.9)}" rx="${r1(size)}" ry="${r1(size * 0.82)}" fill="${pick(COLOURS.euc)}"/>`;
    }
    return s + '</g>';
  }

  // ---- Flowers ---------------------------------------------------------------
  // dahlia: rings of pointed petals, opening to a tight centre
  function dahlia(x, y, r, c) {
    let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(between(0, 30))}) scale(1 .88)">`;
    [[13, 1, c[0], 0], [10, 0.72, c[1], 14], [8, 0.46, c[2], 7]].forEach(([count, f, fill, offset]) => {
      const l = r * f;
      const w = l * 0.34;
      for (let i = 0; i < count; i++) {
        s += `<path d="M0 ${r1(-l * 0.12)} C${r1(w)} ${r1(-l * 0.45)} ${r1(w * 0.55)} ${r1(-l)} 0 ${r1(-l)} ` +
          `C${r1(-w * 0.55)} ${r1(-l)} ${r1(-w)} ${r1(-l * 0.45)} 0 ${r1(-l * 0.12)} Z" fill="${fill}" ` +
          `stroke="#7a3b4a" stroke-opacity=".16" stroke-width=".6" transform="rotate(${r1(i * 360 / count + offset)})"/>`;
      }
    });
    return s + `<circle r="${r1(r * 0.13)}" fill="${c[2]}"/></g>`;
  }

  // ranunculus: tightly layered, overlapping rounded petals
  function ranunculus(x, y, r, c) {
    let s = `<g transform="translate(${r1(x)} ${r1(y)}) scale(1 .9)">`;
    for (let k = 0; k < 9; k++) {
      const a = k * 40 * Math.PI / 180;
      s += `<circle cx="${r1(Math.cos(a) * r * 0.58)}" cy="${r1(Math.sin(a) * r * 0.55)}" r="${r1(r * 0.42)}" fill="${c[0]}" stroke="${c[2]}" stroke-opacity=".25" stroke-width=".6"/>`;
    }
    s += `<circle r="${r1(r * 0.78)}" fill="${c[1]}"/>`;
    [[0.62, c[0]], [0.48, c[1]], [0.34, c[0]], [0.2, c[1]]].forEach(([f, fill], n) => {
      s += `<circle cx="${r1(n * 0.5)}" cy="${r1(-n * 0.6)}" r="${r1(r * f)}" fill="${fill}" stroke="${c[2]}" stroke-opacity=".3" stroke-width=".7"/>`;
    });
    s += `<path d="M${r1(-r * 0.5)} ${r1(-r * 0.2)} A${r1(r * 0.55)} ${r1(r * 0.55)} 0 0 1 ${r1(r * 0.2)} ${r1(-r * 0.55)}" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>`;
    return s + `<circle cx="1.6" cy="-2" r="${r1(r * 0.08)}" fill="#8f9a55"/></g>`;
  }

  // zinnia: two rings of rounded petals around a raised centre
  function zinnia(x, y, r, c) {
    let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(between(0, 40))}) scale(1 .9)">`;
    for (let i = 0; i < 14; i++) {
      s += `<ellipse cy="${r1(-r * 0.6)}" rx="${r1(r * 0.2)}" ry="${r1(r * 0.36)}" fill="${c[0]}" stroke="#6b3040" stroke-opacity=".14" stroke-width=".5" transform="rotate(${r1(i * 360 / 14)})"/>`;
    }
    for (let i = 0; i < 11; i++) {
      s += `<ellipse cy="${r1(-r * 0.38)}" rx="${r1(r * 0.15)}" ry="${r1(r * 0.25)}" fill="${c[1]}" transform="rotate(${r1(i * 360 / 11 + 16)})"/>`;
    }
    s += `<circle r="${r1(r * 0.24)}" fill="#7a3b2a"/>`;
    for (let i = 0; i < 7; i++) {
      const a = i * 360 / 7 * Math.PI / 180;
      s += `<circle cx="${r1(Math.cos(a) * r * 0.18)}" cy="${r1(Math.sin(a) * r * 0.18)}" r="${r1(r * 0.045)}" fill="#f2c94c"/>`;
    }
    return s + '</g>';
  }

  // poppy: four silky cupped petals and a dark centre
  function poppy(x, y, r, c) {
    let s = `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(between(-20, 20))}) scale(1 .9)">`;
    s += `<circle cx="${r1(-r * 0.34)}" cy="${r1(-r * 0.28)}" r="${r1(r * 0.58)}" fill="${c[0]}"/>`;
    s += `<circle cx="${r1(r * 0.34)}" cy="${r1(-r * 0.28)}" r="${r1(r * 0.58)}" fill="${c[0]}"/>`;
    s += `<circle cx="${r1(-r * 0.3)}" cy="${r1(r * 0.24)}" r="${r1(r * 0.56)}" fill="${c[1]}" stroke="${c[0]}" stroke-width=".8"/>`;
    s += `<circle cx="${r1(r * 0.3)}" cy="${r1(r * 0.24)}" r="${r1(r * 0.56)}" fill="${c[1]}" stroke="${c[0]}" stroke-width=".8"/>`;
    s += `<path d="M0 0 L${r1(-r * 0.6)} ${r1(-r * 0.5)} M0 0 L${r1(r * 0.6)} ${r1(-r * 0.5)} M0 0 L${r1(-r * 0.55)} ${r1(r * 0.55)} M0 0 L${r1(r * 0.55)} ${r1(r * 0.55)}" stroke="${c[0]}" stroke-opacity=".5" stroke-width=".7"/>`;
    s += `<circle r="${r1(r * 0.3)}" fill="#2e2a2c" opacity=".85"/>`;
    s += `<circle r="${r1(r * 0.16)}" fill="#6f7a52"/>`;
    for (let i = 0; i < 6; i++) {
      s += `<path d="M0 0 L0 ${r1(-r * 0.14)}" stroke="#d9dcc0" stroke-width=".6" transform="rotate(${i * 60})"/>`;
    }
    return s + '</g>';
  }

  function cosmosHead(x, y, r) {
    return `<use href="#bloom-cosmos" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(between(0, 45))}) scale(${r1(r / 9.4 * 100) / 100} ${r1(r / 9.4 * 88) / 100})" style="color:${pick(COLOURS.cosmos)}"/>`;
  }

  function daisyHead(x, y, r) {
    return `<use href="#bloom-daisy" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(r / 8 * 100) / 100})"/>`;
  }

  // snapdragon: a tall spire of florets opening from the bottom up
  function snapdragon(x, base, height, c, lean) {
    let s = `<path d="M${r1(x)} ${r1(base)} Q${r1(x + lean * 0.3)} ${r1(base - height * 0.5)} ${r1(x + lean)} ${r1(base - height)}" fill="none" stroke="#6f8a58" stroke-width="2.2"/>`;
    s += leaf(x, base - height * 0.25, 22, lean > 0 ? -150 : -30) + leaf(x, base - height * 0.35, 18, lean > 0 ? -40 : -140);
    const start = base - height * 0.42;
    const span = height * 0.54;
    for (let k = 0; k < 10; k++) {
      const t = k / 9;
      const yy = start - span * t;
      const xx = x + lean * ((base - yy) / height);
      const size = 7.6 * (1 - t * 0.6);
      const side = k % 2 ? 1 : -1;
      s += `<ellipse cx="${r1(xx + side * size * 0.4)}" cy="${r1(yy)}" rx="${r1(size)}" ry="${r1(size * 0.85)}" fill="${c[0]}" stroke="${c[2]}" stroke-opacity=".3" stroke-width=".5"/>`;
      s += `<ellipse cx="${r1(xx + side * size * 0.55)}" cy="${r1(yy - size * 0.35)}" rx="${r1(size * 0.6)}" ry="${r1(size * 0.45)}" fill="${c[1]}"/>`;
    }
    const tipX = x + lean;
    return s + `<ellipse cx="${r1(tipX)}" cy="${r1(base - height + 4)}" rx="2.6" ry="4" fill="#a9c58a"/>`;
  }

  // amaranthus: long, soft tassels of tiny beads that taper and curl as they fall
  function amaranthus(x, y, length, dx, colour) {
    let s = '';
    [[8, 1, 0], [6, 0.82, 1], [5, 0.64, -1]].forEach(([w, f, side], n) => {
      const ox = side * 5;
      const len = length * f;
      const phase = between(0, 6);
      const tone = n === 1 ? pick(COLOURS.amaranth) : colour;
      for (let t = 0; t <= 1; t += 3.2 / len) {
        const px = x + ox + dx * (t * t * 0.6 + t * 0.4) + Math.sin(t * 7 + phase) * 4 * t;
        const py = y + len * t;
        const r = (w / 2) * (1 - t * 0.68);
        s += `<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(r)}" fill="${tone}"/>`;
        if (r > 2 && Math.round(t * 100) % 3 === 0) s += `<circle cx="${r1(px - r * 0.3)}" cy="${r1(py - r * 0.3)}" r="${r1(r * 0.35)}" fill="#ffffff" opacity=".18"/>`;
      }
    });
    return s;
  }

  // ivy: a trailing strand with leaves on alternating sides
  function ivy(x, y, length, drift) {
    let path = `M${r1(x)} ${r1(y)}`;
    let leaves = '';
    let px = x;
    for (let d = 14; d <= length; d += 14) {
      const nx = x + drift * (d / length) + Math.sin(d / 18) * 5;
      path += ` L${r1(nx)} ${r1(y + d)}`;
      const side = (d / 14) % 2 ? 1 : -1;
      leaves += leaf(nx, y + d, between(9, 14), side > 0 ? between(10, 50) : between(130, 170));
      px = nx;
    }
    return `<path d="${path}" fill="none" stroke="#6f8a58" stroke-width="1.4" stroke-linejoin="round"/>` + leaves +
      (random() < 0.5 ? leaf(px, y + length, 10, 90) : '');
  }

  // filler: tiny clusters of white and cream blooms (like waxflower)
  function filler(x, y, spread, count) {
    let s = '';
    for (let i = 0; i < count; i++) {
      const fx = x + between(-spread, spread);
      const fy = y + between(-spread * 0.6, spread * 0.6);
      s += `<circle cx="${r1(fx)}" cy="${r1(fy)}" r="${r1(between(1.4, 2.6))}" fill="${pick(['#fffaf0', '#fbf3e4', '#f6e7ea'])}"/>`;
    }
    return s;
  }

  const HEADS = {
    dahlia: (x, y, s) => dahlia(x, y, between(21, 27) * s, pick(COLOURS.dahlia)),
    ranunculus: (x, y, s) => ranunculus(x, y, between(16, 21) * s, pick(COLOURS.ranunculus)),
    zinnia: (x, y, s) => zinnia(x, y, between(14, 18) * s, pick(COLOURS.zinnia)),
    poppy: (x, y, s) => poppy(x, y, between(15, 19) * s, pick(COLOURS.poppy)),
    cosmos: (x, y, s) => cosmosHead(x, y, between(13, 16) * s),
    daisy: (x, y, s) => daisyHead(x, y, between(9, 12) * s)
  };

  // ---- A whole arrangement -----------------------------------------------------
  // base = where the stems enter the container; w/h = the bouquet's spread
  function bouquet(cx, base, w, h, recipe) {
    const kinds = [];
    Object.keys(recipe.mix).forEach((kind) => { for (let i = 0; i < recipe.mix[kind]; i++) kinds.push(kind); });
    const scale = recipe.scale || 1;
    const count = Math.max(7, Math.min(40, Math.round(w * h / 1300)));
    const dome = (u) => base - h * (1 - 0.42 * u * u);   // the bouquet's rounded outline
    let stems = '';
    let foliage = '';
    let spires = '';
    const heads = [];

    // blooms packed into the upper dome, like a full, overflowing arrangement
    for (let i = 0; i < count; i++) {
      const u = (random() + random() - 1) * 1.1;
      const x = cx + u * w / 2;
      const y = between(dome(u), dome(u) + h * 0.4);
      heads.push({ kind: pick(kinds), x, y });
      stems += stem(cx + u * w * 0.12, base, x, y);
    }
    // a dense mass of leaves behind the blooms, pointing outward from the centre
    for (let i = 0; i < 3; i++) {
      foliage += `<ellipse cx="${r1(cx + between(-0.2, 0.2) * w)}" cy="${r1(base - h * between(0.35, 0.55))}" rx="${r1(w * between(0.28, 0.4))}" ry="${r1(h * between(0.16, 0.24))}" fill="${pick(['#5f7a4a', '#6f8a58'])}" opacity=".55"/>`;
    }
    for (let i = 0; i < count * 1.5; i++) {
      const u = between(-1.05, 1.05);
      const x = cx + u * w * 0.5;
      const y = between(dome(u) + h * 0.08, base - h * 0.08);
      const angle = Math.atan2(y - (base + h * 0.1), x - cx) * 180 / Math.PI + between(-25, 25);
      foliage += leaf(x, y, between(18, 34) * scale, angle);
    }
    for (let i = 0; i < (recipe.euc || 0); i++) {
      const side = i % 2 ? 1 : -1;
      foliage += eucalyptus(cx + side * w * 0.2, base - h * between(0.3, 0.5), h * 0.45, side > 0 ? between(-60, -30) : between(-150, -120));
    }
    for (let i = 0; i < (recipe.spires || 0); i++) {
      const x = cx + between(-0.36, 0.36) * w;
      spires += snapdragon(x, base - 4, h * between(0.95, 1.18), pick(recipe.spireColours || COLOURS.snapdragon), (x - cx) * 0.12 + between(-6, 6));
    }

    heads.sort((a, b) => a.y - b.y);
    let flowers = heads.map((hd) => HEADS[hd.kind](hd.x, hd.y, scale)).join('');
    for (let i = 0; i < (recipe.filler || 0); i++) {
      flowers += filler(cx + between(-0.4, 0.4) * w, between(base - h * 0.85, base - h * 0.3), 14, 7);
    }

    let front = '';
    for (let i = 0; i < (recipe.amaranth || 0); i++) {
      const side = i % 2 ? 1 : -1;
      front += amaranthus(cx + side * w * between(0.22, 0.34), base - h * between(0.22, 0.32), h * between(0.45, 0.6), side * between(14, 30), pick(COLOURS.amaranth));
    }
    for (let i = 0; i < 4; i++) front += leaf(cx + between(-0.35, 0.35) * w, base - 2, between(14, 22), between(0, 1) > 0.5 ? between(-20, 30) : between(150, 200));

    return { back: stems + foliage + spires + flowers, front };
  }

  // ---- Containers --------------------------------------------------------------
  function bucket(cx, rim, w, h) {
    const b = w * 0.4;
    return `<ellipse cx="${r1(cx)}" cy="${r1(rim + h)}" rx="${r1(w * 0.7)}" ry="9" fill="url(#soft-shadow)"/>` +
      `<path d="M${r1(cx - w / 2)} ${r1(rim)} L${r1(cx + w / 2)} ${r1(rim)} L${r1(cx + b)} ${r1(rim + h)} L${r1(cx - b)} ${r1(rim + h)} Z" fill="url(#galv-body)"/>` +
      `<path d="M${r1(cx - w * 0.47)} ${r1(rim + h * 0.35)} H${r1(cx + w * 0.47)} M${r1(cx - w * 0.44)} ${r1(rim + h * 0.7)} H${r1(cx + w * 0.44)}" stroke="#ffffff" stroke-opacity=".5" stroke-width="2.4"/>` +
      `<path d="M${r1(cx - w * 0.47)} ${r1(rim + h * 0.38)} H${r1(cx + w * 0.47)} M${r1(cx - w * 0.44)} ${r1(rim + h * 0.73)} H${r1(cx + w * 0.44)}" stroke="#6e787d" stroke-opacity=".35" stroke-width="1.4"/>` +
      `<rect x="${r1(cx - w / 2 - 4)}" y="${r1(rim - 6)}" width="${r1(w + 8)}" height="11" rx="5.5" fill="url(#galv-rim)"/>`;
  }

  function vase(cx, rim, w, h) {
    return `<ellipse cx="${r1(cx)}" cy="${r1(rim + h)}" rx="${r1(w * 0.62)}" ry="5" fill="#2f281f" opacity=".16"/>` +
      `<path d="M${r1(cx + w * 0.42)} ${r1(rim + h * 0.18)} C${r1(cx + w * 0.86)} ${r1(rim + h * 0.2)} ${r1(cx + w * 0.86)} ${r1(rim + h * 0.62)} ${r1(cx + w * 0.4)} ${r1(rim + h * 0.66)}" fill="none" stroke="#ece4d2" stroke-width="7"/>` +
      `<path d="M${r1(cx - w * 0.36)} ${r1(rim)} C${r1(cx - w * 0.36)} ${r1(rim + h * 0.2)} ${r1(cx - w * 0.56)} ${r1(rim + h * 0.4)} ${r1(cx - w * 0.5)} ${r1(rim + h * 0.72)} ` +
      `C${r1(cx - w * 0.46)} ${r1(rim + h)} ${r1(cx + w * 0.46)} ${r1(rim + h)} ${r1(cx + w * 0.5)} ${r1(rim + h * 0.72)} ` +
      `C${r1(cx + w * 0.56)} ${r1(rim + h * 0.4)} ${r1(cx + w * 0.36)} ${r1(rim + h * 0.2)} ${r1(cx + w * 0.36)} ${r1(rim)} Z" fill="#f4eee2"/>` +
      `<path d="M${r1(cx - w * 0.4)} ${r1(rim + h * 0.4)} C${r1(cx - w * 0.44)} ${r1(rim + h * 0.62)} ${r1(cx - w * 0.38)} ${r1(rim + h * 0.84)} ${r1(cx - w * 0.28)} ${r1(rim + h * 0.92)}" fill="none" stroke="#ffffff" stroke-width="3" opacity=".8"/>` +
      `<path d="M${r1(cx + w * 0.44)} ${r1(rim + h * 0.5)} C${r1(cx + w * 0.46)} ${r1(rim + h * 0.72)} ${r1(cx + w * 0.38)} ${r1(rim + h * 0.9)} ${r1(cx + w * 0.2)} ${r1(rim + h * 0.96)}" fill="none" stroke="#d9cfba" stroke-width="3" opacity=".8"/>` +
      `<ellipse cx="${r1(cx)}" cy="${r1(rim)}" rx="${r1(w * 0.38)}" ry="4" fill="#e6dcc6"/>`;
  }

  function jar(cx, rim, w, h) {
    return `<ellipse cx="${r1(cx)}" cy="${r1(rim + h)}" rx="${r1(w * 0.62)}" ry="3.6" fill="#2f281f" opacity=".14"/>` +
      `<path d="M${r1(cx - w * 0.5)} ${r1(rim + 4)} L${r1(cx - w * 0.5)} ${r1(rim + h - 5)} Q${r1(cx - w * 0.5)} ${r1(rim + h)} ${r1(cx - w * 0.4)} ${r1(rim + h)} L${r1(cx + w * 0.4)} ${r1(rim + h)} Q${r1(cx + w * 0.5)} ${r1(rim + h)} ${r1(cx + w * 0.5)} ${r1(rim + h - 5)} L${r1(cx + w * 0.5)} ${r1(rim + 4)} Z" fill="#dcebea" fill-opacity=".55" stroke="#ffffff" stroke-width="1.6"/>` +
      `<rect x="${r1(cx - w * 0.48)}" y="${r1(rim + h * 0.45)}" width="${r1(w * 0.96)}" height="${r1(h * 0.5)}" fill="#bcd5d4" opacity=".35"/>` +
      `<path d="M${r1(cx - w * 0.3)} ${r1(rim + h)} L${r1(cx - w * 0.1)} ${r1(rim + 6)} M${r1(cx + w * 0.25)} ${r1(rim + h)} L${r1(cx + w * 0.05)} ${r1(rim + 6)}" stroke="#6f8a58" stroke-width="1.4" opacity=".7"/>` +
      `<path d="M${r1(cx - w * 0.36)} ${r1(rim + 8)} V${r1(rim + h - 8)}" stroke="#ffffff" stroke-width="2" opacity=".7"/>` +
      `<rect x="${r1(cx - w * 0.54)}" y="${r1(rim)}" width="${r1(w * 1.08)}" height="5" rx="2.5" fill="#ffffff" fill-opacity=".6"/>`;
  }

  function terracottaPot(cx, base, w, h) {
    return `<ellipse cx="${r1(cx)}" cy="${r1(base)}" rx="${r1(w * 0.66)}" ry="5" fill="url(#soft-shadow)"/>` +
      `<path d="M${r1(cx - w * 0.5)} ${r1(base - h)} L${r1(cx + w * 0.5)} ${r1(base - h)} L${r1(cx + w * 0.38)} ${r1(base)} L${r1(cx - w * 0.38)} ${r1(base)} Z" fill="url(#terracotta)"/>` +
      `<path d="M${r1(cx - w * 0.5)} ${r1(base - h)} L${r1(cx + w * 0.5)} ${r1(base - h)} L${r1(cx + w * 0.38)} ${r1(base)} L${r1(cx - w * 0.38)} ${r1(base)} Z" fill="url(#pot-shade)"/>` +
      `<rect x="${r1(cx - w * 0.56)}" y="${r1(base - h - 8)}" width="${r1(w * 1.12)}" height="10" rx="2.5" fill="url(#terracotta-rim)"/>`;
  }

  function arrangement(container, cx, rim, cw, chH, bw, bh, recipe) {
    const flowers = bouquet(cx, rim + 6, bw, bh, recipe);
    return flowers.back + container(cx, rim, cw, chH) + flowers.front;
  }

  // a hanging pot with greenery, flowers and long trailing strands
  function hangingPot(x, top, recipe) {
    let s = `<path d="M${x} 126 L${r1(x - 26)} ${top} M${x} 126 L${x} ${top} M${x} 126 L${r1(x + 26)} ${top}" stroke="#b3a993" stroke-width="1.8"/>`;
    let trails = '';
    (recipe.ivy || []).forEach(([dx, length]) => { trails += ivy(x + dx, top + 16, length, between(-14, 14)); });
    (recipe.amaranth || []).forEach(([dx, length]) => { trails += amaranthus(x + dx, top + 12, length, between(-10, 10), pick(COLOURS.amaranth)); });
    let crown = `<ellipse cx="${x}" cy="${top - 4}" rx="44" ry="20" fill="#6f8a58" opacity=".7"/>`;
    for (let i = 0; i < 22; i++) {
      const lx = x + between(-40, 40);
      crown += leaf(lx, top + between(-12, 10), between(14, 24), lx > x ? between(-60, 30) : between(150, 240));
    }
    let blooms = '';
    for (let i = 0; i < (recipe.blooms || 0); i++) {
      blooms += HEADS[pick(recipe.kinds)](x + between(-26, 26), top + between(-14, 4), 0.62);
    }
    blooms += filler(x, top - 4, 24, recipe.filler || 0);
    s += trails + crown + blooms;
    s += `<path d="M${r1(x - 36)} ${top} L${r1(x + 36)} ${top} Q${r1(x + 32)} ${top + 34} ${x} ${top + 37} Q${r1(x - 32)} ${top + 34} ${r1(x - 36)} ${top} Z" fill="url(#terracotta)"/>`;
    s += `<rect x="${r1(x - 39)}" y="${top - 5}" width="78" height="9" rx="3" fill="url(#terracotta-rim)"/>`;
    for (let i = 0; i < 4; i++) s += leaf(x + between(-30, 30), top + 2, between(12, 18), between(40, 140));
    return s;
  }

  // the same drawing kit paints the garden's potted flowers too (js/garden-extras.js)
  window.Florist = {
    reseed: (n) => { seed = n; }, random, between, pick, r1, COLOURS,
    leaf, stem, eucalyptus, dahlia, ranunculus, zinnia, poppy, cosmosHead, daisyHead,
    snapdragon, amaranthus, ivy, filler, HEADS, bouquet, bucket, jar, terracottaPot, arrangement
  };

  // ---- Paint ---------------------------------------------------------------------
  const art = document.querySelector('.gh-room__art');
  if (!art) return;

  // The room is painted once, quietly in the background after the page has loaded (or
  // straight away if someone steps inside first), so it never slows the first visit.
  // It always starts from the same seed, so it looks the same every time.
  let painted = false;
  function paintRoom() {
    if (painted) return;
    painted = true;
    seed = 4271;   // the same room every visit, however much the generator was used before

    const NS = 'http://www.w3.org/2000/svg';

    function fill(id, html) {
      const g = document.getElementById(id);
      if (g) g.innerHTML = html;
    }

    // vines climbing the window frames, with a few tiny white flowers
    let climbers = '';
    [[160, 560], [480, 520], [1120, 370], [1440, 360]].forEach(([x, bottom]) => {
      climbers += ivy(x, 126, bottom - 126, between(-8, 8));
      climbers += filler(x, between(240, bottom - 40), 10, 5);
    });
    for (let x = 30; x < 1600; x += between(70, 120)) {
      if (x > 600 && x < 1000) continue;                   // keep the welcome sign clear
      climbers += ivy(x, 124, between(26, 70), between(-6, 6));
    }
    fill('ghf-climbers', climbers);

    // flowers on the left shelf, a little lantern, and cut stems in a jar
    let shelf = '';
    for (let i = 0; i < 4; i++) shelf += stem(130, 418, 112 + i * 12, between(386, 398), 1.6);
    shelf += zinnia(112, 392, 12, COLOURS.zinnia[0]) + zinnia(140, 386, 11, COLOURS.zinnia[1]) + daisyHead(126, 400, 9) + zinnia(152, 398, 10, COLOURS.zinnia[3]);
    shelf += ranunculus(304, 398, 13, COLOURS.ranunculus[0]) + ranunculus(330, 392, 12, COLOURS.ranunculus[2]) + ranunculus(344, 404, 11, COLOURS.ranunculus[1]);
    shelf += arrangement(jar, 124, 548, 40, 60, 70, 80, { mix: { cosmos: 3, daisy: 2 }, filler: 2, scale: 0.75 });
    shelf += '<g transform="translate(211 560)">' +
      '<rect x="-14" y="10" width="28" height="38" rx="3" fill="#e8e1d0" fill-opacity=".35" stroke="#9b8e7a" stroke-width="2"/>' +
      '<path d="M-16 10 L0 -2 L16 10 Z" fill="#9b8e7a"/><circle cy="-5" r="3" fill="none" stroke="#9b8e7a" stroke-width="1.6"/>' +
      '<rect x="-4" y="30" width="8" height="16" fill="#fbf3e0"/><ellipse cy="26" rx="3" ry="5" fill="#ffd27a" class="ghf-flame"/>' +
      '<ellipse cy="28" rx="12" ry="12" fill="#ffd27a" opacity=".35" class="golden-only"/></g>';
    fill('ghf-shelf', shelf);

    // woven rug, with petals scattered across the floor
    let rug = '<path d="M560 902 L1040 902 L1100 984 L500 984 Z" fill="#d8c09a"/>';
    for (let y = 910; y < 984; y += 9) rug += `<path d="M${r1(560 - (y - 902) * 0.73)} ${y} H${r1(1040 + (y - 902) * 0.73)}" stroke="#bfa47a" stroke-width="2.2" opacity=".55"/>`;
    rug += '<path d="M560 902 L1040 902 L1100 984 L500 984 Z" fill="none" stroke="#b39468" stroke-width="3"/>';
    for (let x = 506; x <= 1094; x += 9) rug += `<path d="M${x} 984 l${r1(between(-2, 2))} 10" stroke="#c9ad82" stroke-width="2"/>`;
    for (let i = 0; i < 34; i++) {
      const x = between(380, 1460);
      const y = between(872, 994);
      rug += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(between(3, 5.5))}" ry="${r1(between(2, 3.4))}" fill="${pick(['#efbcc4', '#e39aa8', '#f6c3a0', '#fffaf0', '#d9567d', '#f4c0c3'])}" transform="rotate(${r1(between(0, 180))} ${r1(x)} ${r1(y)})" opacity=".9"/>`;
    }
    fill('ghf-rug', rug);

    // tea towel over the bench edge, clippings, scissors, greenery spilling underneath
    let bench = '<path d="M738 598 L816 598 L812 692 Q776 698 742 692 Z" fill="#f4efe2"/>' +
      '<path d="M752 600 V693 M760 600 V694 M796 600 V694 M804 600 V693" stroke="#9fb08a" stroke-width="3"/>' +
      '<path d="M742 680 Q777 686 812 680" stroke="#9fb08a" stroke-width="3" fill="none"/>' +
      '<path d="M738 598 L816 598 L816 606 L738 606 Z" fill="#e6dfcf"/>';
    bench += '<g transform="translate(1090 604) rotate(-12)"><path d="M0 0 L22 -3 M0 0 L22 3" stroke="#a9b1b3" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle cx="-5" cy="-4" r="4" fill="none" stroke="#3f3a34" stroke-width="2"/><circle cx="-5" cy="4" r="4" fill="none" stroke="#3f3a34" stroke-width="2"/></g>';
    for (let i = 0; i < 9; i++) bench += leaf(between(520, 1070), between(600, 610), between(8, 13), between(-20, 20) + (random() < 0.5 ? 180 : 0));
    for (let i = 0; i < 12; i++) {
      const x = between(520, 1070);
      bench += `<ellipse cx="${r1(x)}" cy="${r1(between(602, 612))}" rx="3.4" ry="2.2" fill="${pick(['#efbcc4', '#f6c3a0', '#fffaf0', '#e39aa8'])}" transform="rotate(${r1(between(0, 180))} ${r1(x)} 606)"/>`;
    }
    bench += ivy(610, 802, 70, -10) + ivy(660, 802, 54, 8) + ivy(700, 802, 40, -6);
    bench += terracottaPot(1004, 790, 40, 30) + bouquet(1004, 762, 46, 40, { mix: { daisy: 3 }, scale: 0.8 }).back;
    fill('ghf-bench', bench);

    // wooden stool (the little speaker sits on top: see index.html)
    const stool = '<ellipse cx="1290" cy="878" rx="56" ry="7" fill="url(#soft-shadow)"/>' +
      '<path d="M1258 766 L1248 876 M1322 766 L1332 876 M1276 770 L1272 870 M1304 770 L1308 870" stroke="#8c6a4a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M1254 830 H1326" stroke="#9c7a55" stroke-width="5"/>' +
      '<rect x="1244" y="752" width="92" height="14" rx="7" fill="#a9825d"/>' +
      '<ellipse cx="1290" cy="752" rx="46" ry="9" fill="url(#gh-wood)"/>';
    fill('ghf-stool', stool);

    // ---- The "bouquet bar": a little flower-shop cart (drawn inside its own button in
    // index.html, so the whole cart is what visitors tap). The visitor's own jar and
    // bouquet on top are drawn by js/bouquet.js.

    // a bouquet wrapped in kraft paper with a pink ribbon (tip of the cone at 0, 0)
    function wrappedBouquet(recipe) {
      const b = bouquet(0, -80, 74, 66, recipe);
      return b.back +
        '<path d="M0 0 L-36 -86 Q-12 -78 0 -92 Q12 -78 36 -86 Z" fill="#e2c59a"/>' +
        '<path d="M-36 -86 Q0 -100 36 -86 Q0 -80 -36 -86 Z" fill="#cfae80"/>' +
        '<path d="M0 0 L-12 -80 M0 0 L14 -82" stroke="#c9a57a" stroke-width="1.4" opacity=".7"/>' +
        '<path d="M-14 -34 Q0 -28 14 -34" fill="none" stroke="#e3a9b0" stroke-width="5"/>' +
        '<path d="M0 -32 C-14 -46 -24 -36 -14 -30 C-8 -27 -4 -30 0 -32 C4 -30 8 -27 14 -30 C24 -36 14 -46 0 -32 Z" fill="#efbcc4" stroke="#d98f99" stroke-width="1"/>' +
        '<path d="M0 -32 Q-6 -18 -12 -10 M0 -32 Q6 -18 12 -12" fill="none" stroke="#e3a9b0" stroke-width="3" stroke-linecap="round"/>' +
        b.front;
    }

    // a tall bucket of cut stems waits on the floor beside the cart (behind the Lab)
    fill('ghf-station-floor', arrangement(bucket, 1188, 820, 52, 50, 104, 160, { mix: { dahlia: 1, ranunculus: 2, cosmos: 1 }, spires: 3, amaranth: 1, scale: 0.7 }));

    let station = '<ellipse cx="1040" cy="906" rx="124" ry="9" fill="url(#soft-shadow)"/>' +
      // back legs and a sturdy lower shelf
      '<path d="M946 680 V890 M1134 680 V890" stroke="#9c7a55" stroke-width="10"/>' +
      '<rect x="928" y="836" width="224" height="16" rx="3" fill="url(#gh-wood)"/>' +
      '<rect x="928" y="836" width="224" height="3" fill="#d9b88d"/>';
    // on the lower shelf: wrapped bouquets waiting in a bucket, and two buckets of stems
    let shelfFlowers = `<g transform="translate(958 806) rotate(-10) scale(.72)">${wrappedBouquet({ mix: { ranunculus: 2, cosmos: 1 }, scale: 0.7, filler: 1 })}</g>` +
      `<g transform="translate(980 808) rotate(9) scale(.68)">${wrappedBouquet({ mix: { dahlia: 1, zinnia: 2 }, scale: 0.7 })}</g>` +
      bucket(968, 798, 52, 38);
    shelfFlowers += arrangement(bucket, 1042, 796, 52, 40, 104, 120, { mix: { zinnia: 2, poppy: 2, cosmos: 1 }, spires: 2, filler: 1, scale: 0.72 });
    shelfFlowers += arrangement(bucket, 1114, 798, 50, 38, 100, 110, { mix: { dahlia: 2, ranunculus: 2 }, amaranth: 2, scale: 0.72 });
    station += `<g class="gh-station__sway">${shelfFlowers}</g>`;
    // front legs on little wheels
    station += '<path d="M934 674 V896 M1146 674 V896" stroke="#8c6a4a" stroke-width="13"/>' +
      '<circle cx="934" cy="900" r="13" fill="#6f5a45"/><circle cx="934" cy="900" r="5" fill="#c9b08a"/>' +
      '<circle cx="1146" cy="900" r="13" fill="#6f5a45"/><circle cx="1146" cy="900" r="5" fill="#c9b08a"/>';
    // the thick top, and a big hanging board: "bouquet bar ♡"
    station += '<rect x="920" y="662" width="240" height="20" rx="4" fill="url(#gh-wood)"/>' +
      '<rect x="920" y="662" width="240" height="4" fill="#d9b88d"/>' +
      '<path d="M920 682 H1160" stroke="#6f5a45" stroke-width="2" opacity=".35"/>' +
      '<path d="M980 682 L984 694 M1100 682 L1096 694" stroke="#8a7d6c" stroke-width="1.6"/>' +
      '<rect x="962" y="692" width="156" height="40" rx="6" fill="#f6efdf" stroke="#a88a62" stroke-width="2"/>' +
      '<rect x="967" y="697" width="146" height="30" rx="4" fill="none" stroke="#d9c49c" stroke-width="1" stroke-dasharray="3 2"/>' +
      '<text x="1040" y="721" text-anchor="middle" font-family="Caveat, cursive" font-size="26" font-weight="600" fill="#5a4636">bouquet bar ♡</text>';
    // on top: a little chalkboard easel, pink ribbon, snips and clippings
    station += '<path d="M942 662 L952 606 M1008 662 L998 606" stroke="#8c6a4a" stroke-width="3"/>' +
      '<rect x="938" y="600" width="80" height="54" rx="4" fill="#a9825d"/>' +
      '<rect x="943" y="605" width="70" height="44" rx="2" fill="#3d3d3a"/>' +
      '<text font-family="Caveat, cursive" font-weight="600" fill="#f4efe2" text-anchor="middle">' +
      '<tspan x="978" y="623" font-size="15">make your own</tspan><tspan x="978" y="643" font-size="19">bouquet ♡</tspan></text>' +
      '<path d="M950 646 q4 -3 8 0 M998 614 l4 -2" stroke="#efbcc4" stroke-width="1.4" fill="none"/>';
    station += '<path d="M1030 658 C1010 672 970 664 950 674 C934 684 942 712 930 750" fill="none" stroke="#e3a9b0" stroke-width="4" stroke-linecap="round"/>' +
      '<ellipse cx="1034" cy="652" rx="11" ry="10" fill="#efbcc4"/><ellipse cx="1034" cy="652" rx="4" ry="4" fill="#d98f99"/>' +
      '<path d="M1026 646 a9 9 0 0 1 14 -2" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>';
    station += '<g transform="translate(1050 660) rotate(-14)"><path d="M0 0 L24 -3 M0 0 L24 3" stroke="#a9b1b3" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="-5" cy="-4" r="4.2" fill="none" stroke="#c4677d" stroke-width="2.2"/><circle cx="-5" cy="4" r="4.2" fill="none" stroke="#c4677d" stroke-width="2.2"/></g>';
    for (let i = 0; i < 5; i++) station += leaf(between(1020, 1150), between(658, 664), between(9, 14), between(-25, 25) + (random() < 0.5 ? 180 : 0));
    station += '<path d="M1018 662 L1046 657 M1022 664 L1052 661" stroke="#6f8a58" stroke-width="1.8"/>';
    // a wrapped bouquet leaning against the jar, ready to take home
    station += `<g class="gh-station__sway"><g transform="translate(1140 662) rotate(14) scale(.72)">${wrappedBouquet({ mix: { ranunculus: 2, poppy: 1, cosmos: 1 }, spires: 1, scale: 0.7, filler: 1 })}</g></g>`;
    // clippings and petals on the floor around the wheels
    for (let i = 0; i < 6; i++) station += leaf(between(930, 1150), between(896, 914), between(9, 14), between(-30, 30) + (random() < 0.5 ? 180 : 0));
    for (let i = 0; i < 10; i++) {
      const x = between(920, 1160);
      const y = between(892, 916);
      station += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="3.6" ry="2.4" fill="${pick(['#efbcc4', '#f6c3a0', '#fffaf0', '#e39aa8'])}" transform="rotate(${r1(between(0, 180))} ${r1(x)} ${r1(y)})"/>`;
    }
    fill('ghf-station', station);

    // ---- Layers that sway, each at its own pace ------------------------------------------
    function layer(className, html, motion) {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'ghf-layer ' + className);
      svg.setAttribute('viewBox', '0 0 1600 1000');
      svg.setAttribute('aria-hidden', 'true');
      if (motion) Object.keys(motion).forEach((k) => svg.style.setProperty(k, motion[k]));
      svg.innerHTML = html;
      return svg;
    }

    const hangA = hangingPot(120, 215, { amaranth: [[-24, 240], [-4, 290], [18, 260], [34, 200]], ivy: [[-36, 150], [40, 170], [8, 120]], blooms: 4, kinds: ['dahlia', 'zinnia'], filler: 8 }) +
      hangingPot(1100, 225, { ivy: [[-34, 170], [-16, 210], [0, 150], [16, 190], [34, 160]], amaranth: [[-6, 150]], blooms: 5, kinds: ['cosmos', 'daisy', 'ranunculus'], filler: 12 }) +
      hangingPot(1545, 205, { amaranth: [[-26, 230], [-6, 280], [14, 250], [32, 190]], ivy: [[36, 150], [-38, 120]], blooms: 4, kinds: ['zinnia', 'dahlia'], filler: 6 });
    const hangB = hangingPot(410, 172, { ivy: [[-36, 190], [-20, 240], [-4, 200], [12, 170], [28, 220], [40, 150]], blooms: 5, kinds: ['daisy', 'cosmos'], filler: 14 }) +
      hangingPot(1330, 185, { ivy: [[-32, 130], [-12, 160], [26, 150]], amaranth: [[4, 180], [18, 140]], blooms: 5, kinds: ['zinnia', 'ranunculus', 'poppy'], filler: 6 });

    const left =
      arrangement(bucket, 105, 848, 104, 112, 220, 290, { mix: { ranunculus: 2, daisy: 2, cosmos: 1 }, spires: 7, filler: 4, euc: 1 }) +
      arrangement(bucket, 400, 852, 96, 100, 200, 240, { mix: { zinnia: 4, cosmos: 3, daisy: 2 }, filler: 3, amaranth: 1 }) +
      arrangement(bucket, 250, 868, 120, 118, 250, 310, { mix: { ranunculus: 4, dahlia: 3, poppy: 2, daisy: 1 }, spires: 2, filler: 5, amaranth: 2, euc: 2 });

    const benchArrangements =
      arrangement(vase, 1032, 528, 58, 72, 230, 250, { mix: { dahlia: 3, ranunculus: 3, poppy: 2, cosmos: 2, zinnia: 1 }, spires: 2, filler: 5, amaranth: 2, euc: 1 }) +
      arrangement(jar, 548, 556, 30, 44, 70, 104, { mix: { cosmos: 3, daisy: 2 }, filler: 3, scale: 0.75 });

    const right =
      arrangement(bucket, 1532, 860, 110, 115, 210, 255, { mix: { dahlia: 4, zinnia: 3, daisy: 2 }, filler: 3, amaranth: 2, euc: 1 });

    // chalkboard sign and a few soft foreground blooms (still, in front of everything). The sign
    // rests on the floor just in front of the left bucket (its base level with the bucket's)
    let front = '<g transform="translate(0 -24) rotate(-6 70 920)">' +
      '<path d="M54 852 L86 852" stroke="#8c6a4a" stroke-width="3"/>' +
      '<rect x="14" y="860" width="122" height="132" rx="6" fill="#a9825d"/>' +
      '<rect x="22" y="868" width="106" height="116" rx="3" fill="#3d3d3a"/>' +
      '<text font-family="Caveat, cursive" font-size="22" fill="#f4efe2" text-anchor="middle">' +
      '<tspan x="75" y="900">fresh</tspan><tspan x="75" y="922">flowers &amp;</tspan><tspan x="75" y="944">happy</tspan><tspan x="75" y="966">things ♡</tspan></text></g>';
    front += '<g filter="url(#blur-sm)" opacity=".95">' + bouquet(1585, 1010, 120, 120, { mix: { daisy: 3, cosmos: 2 }, filler: 3 }).back + '</g>';

    const scene = art.parentNode;
    const layers = [
      layer('ghf-layer--hang-b', hangB, { '--d': '11s', '--delay': '-4s', '--a': '1deg', '--o': '50% 13%' }),
      layer('ghf-layer--hang-a', hangA, { '--d': '9s', '--delay': '0s', '--a': '1.2deg', '--o': '50% 13%' }),
      layer('ghf-layer--bench', benchArrangements, { '--d': '7.5s', '--delay': '-2s', '--a': '.7deg', '--o': '65% 60%' }),
      layer('ghf-layer--right', right, { '--d': '8.5s', '--delay': '-5s', '--a': '.8deg', '--o': '90% 96%' }),
      layer('ghf-layer--left', left, { '--d': '6.8s', '--delay': '-1s', '--a': '.9deg', '--o': '16% 96%' }),
      layer('ghf-layer--still', front)
    ];

    // falling petals and dust motes drifting through the sunbeams
    const air = document.createElement('div');
    air.className = 'ghf-air';
    air.setAttribute('aria-hidden', 'true');
    [[130, 300, 16, -3], [420, 260, 19, -9], [1110, 300, 17, -6], [1340, 260, 21, -14], [1545, 330, 18, -2], [1030, 320, 20, -11], [250, 600, 15, -7]].forEach(([x, y, dur, delay]) => {
      air.insertAdjacentHTML('beforeend', `<i class="ghf-petal" style="--x:${x}; --y:${y}; --dur:${dur}s; --delay:${delay}s"></i>`);
    });
    for (let i = 0; i < 14; i++) {
      air.insertAdjacentHTML('beforeend', `<i class="ghf-mote" style="--x:${r1(between(780, 1380))}; --y:${r1(between(180, 760))}; --dur:${r1(between(12, 22))}s; --delay:${r1(between(-20, 0))}s"></i>`);
    }

    art.after(...layers, air);
  }
  // (js/greenhouse.js decides when: in the background after the page loads, or on entry)
  window.GreenhouseArt = { paint: paintRoom };
})();
