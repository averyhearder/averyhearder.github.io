/* ==========================================================================
   A Day in Bloom · the three project flowers (drawn in SVG)
   Used by js/game.js when a bed blooms after sunshine.
     Snapdragon – tall, soft pink, vertical and architectural
     Ranunculus – butter yellow and pale peach, layered and full
     Cosmos     – delicate blush pink, airy and whimsical
   Each flower is 120 wide × 220 tall, with its base at the bottom centre.
   Elements with class "bloom__head" open one after another (--i sets the order).
   ========================================================================== */
(function () {
  'use strict';

  const r1 = (n) => Math.round(n * 10) / 10;
  const STEM = '#6f8a58';

  function wrap(inner, label) {
    return `<svg class="bloom" viewBox="0 0 120 220" role="img" aria-label="${label}">` +
      '<ellipse cx="60" cy="216" rx="30" ry="3.5" fill="#2a1d14" opacity=".45"/>' +
      `<g class="bloom__sway">${inner}</g></svg>`;
  }

  function leaf(x, y, length, angle, fill) {
    const w = length * 0.28;
    return `<path d="M0 0 C${r1(length * 0.3)} ${r1(-w)} ${r1(length * 0.75)} ${r1(-w * 0.8)} ${r1(length)} 0 ` +
      `C${r1(length * 0.75)} ${r1(w * 0.8)} ${r1(length * 0.3)} ${r1(w)} 0 0 Z" fill="${fill}" transform="translate(${x} ${y}) rotate(${angle})"/>` +
      `<path d="M${r1(length * 0.08)} 0 L${r1(length * 0.85)} 0" stroke="#d6e0bf" stroke-opacity=".5" stroke-width=".6" transform="translate(${x} ${y}) rotate(${angle})"/>`;
  }

  // ---- Snapdragon: three tall spires of soft pink florets --------------------
  function snapdragon() {
    const C = { main: '#e9a0b5', light: '#f6cad5', deep: '#cf7f97', throat: '#f3dc95', bud: '#a9c58a' };
    let s = leaf(58, 206, 34, -128, '#86a96a') + leaf(62, 204, 32, -52, '#7f9f60') + leaf(58, 186, 26, -140, '#93b276') + leaf(62, 182, 24, -40, '#8aaa6c');
    const spires = [
      { x: 40, top: 56, lean: -7, i: 0 },
      { x: 82, top: 64, lean: 8, i: 2 },
      { x: 60, top: 18, lean: 1, i: 1 }
    ];
    spires.forEach((sp) => {
      const xAt = (y) => sp.x + sp.lean * (214 - y) / (214 - sp.top);
      s += `<path d="M${sp.x} 214 Q${r1(sp.x + sp.lean * 0.25)} 130 ${r1(xAt(sp.top + 4))} ${sp.top + 4}" fill="none" stroke="${STEM}" stroke-width="2.2" stroke-linecap="round"/>`;
      s += `<g class="bloom__head bloom__head--spire" style="--i:${sp.i}">`;
      let k = 0;
      for (let y = sp.top + 112; y >= sp.top + 14; y -= 8.5, k++) {
        const t = (y - (sp.top + 14)) / 98;              // 1 = bottom of the spire, 0 = top
        const size = 3.2 + t * 4.4;
        const side = k % 2 ? 1 : -1;
        const cx = xAt(y) + side * size * 0.45;
        s += `<ellipse cx="${r1(cx)}" cy="${r1(y)}" rx="${r1(size)}" ry="${r1(size * 0.86)}" fill="${C.main}" stroke="${C.deep}" stroke-opacity=".35" stroke-width=".5"/>`;
        s += `<ellipse cx="${r1(cx + side * size * 0.22)}" cy="${r1(y - size * 0.38)}" rx="${r1(size * 0.66)}" ry="${r1(size * 0.5)}" fill="${C.light}"/>`;
        if (t > 0.3) s += `<ellipse cx="${r1(cx - side * size * 0.12)}" cy="${r1(y + size * 0.28)}" rx="${r1(size * 0.3)}" ry="${r1(size * 0.18)}" fill="${C.throat}" opacity=".85"/>`;
      }
      s += `<ellipse cx="${r1(xAt(sp.top + 8))}" cy="${sp.top + 8}" rx="2.6" ry="3.6" fill="${C.bud}"/>`;
      s += `<ellipse cx="${r1(xAt(sp.top + 2))}" cy="${sp.top + 1}" rx="1.8" ry="2.6" fill="#c6d9a6"/>`;
      s += '</g>';
    });
    return wrap(s, 'A blooming pink snapdragon');
  }

  // ---- Ranunculus: full, layered rosettes in butter and peach ------------------
  function rosette(cx, cy, r, c, i) {
    let g = `<g class="bloom__head" style="--i:${i}">`;
    for (let k = 0; k < 10; k++) {
      const a = (k * 36) * Math.PI / 180;
      g += `<circle cx="${r1(cx + Math.cos(a) * r * 0.62)}" cy="${r1(cy + Math.sin(a) * r * 0.58)}" r="${r1(r * 0.42)}" fill="${c[0]}" stroke="#a8743a" stroke-opacity=".2" stroke-width=".5"/>`;
    }
    g += `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${c[1]}"/>`;
    [0.64, 0.5, 0.36].forEach((f, n) => {
      g += `<circle cx="${r1(cx + n * 0.4)}" cy="${r1(cy - n * 0.5)}" r="${r1(r * f)}" fill="${n % 2 ? c[2] : c[1]}" stroke="#a8743a" stroke-opacity=".24" stroke-width=".6"/>`;
    });
    g += `<path d="M${r1(cx - r * 0.5)} ${r1(cy - r * 0.2)} A${r1(r * 0.55)} ${r1(r * 0.55)} 0 0 1 ${r1(cx + r * 0.2)} ${r1(cy - r * 0.55)}" fill="none" stroke="#ffffff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>`;
    g += `<circle cx="${r1(cx + 1)}" cy="${r1(cy - 1.2)}" r="${r1(r * 0.17)}" fill="#c2b06a"/><circle cx="${r1(cx + 1)}" cy="${r1(cy - 1.2)}" r="${r1(r * 0.08)}" fill="#8f9a55"/>`;
    return g + '</g>';
  }

  function ranunculus() {
    const butter = ['#f0c97f', '#f6dca2', '#fae9c4'];
    const peach = ['#f2b68c', '#f7cda8', '#fbe0c8'];
    const cream = ['#f3c88f', '#f8dbb0', '#fcebd2'];
    let s = '';
    s += `<path d="M60 214 Q60 140 60 76" fill="none" stroke="${STEM}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<path d="M58 214 Q44 170 34 116" fill="none" stroke="${STEM}" stroke-width="2.1" stroke-linecap="round"/>`;
    s += `<path d="M62 214 Q78 170 88 108" fill="none" stroke="${STEM}" stroke-width="2.1" stroke-linecap="round"/>`;
    s += `<path d="M61 200 Q72 172 78 146" fill="none" stroke="${STEM}" stroke-width="1.6" stroke-linecap="round"/>`;
    // lobed leaves
    s += leaf(58, 206, 30, -150, '#86a96a') + leaf(58, 206, 26, -120, '#93b276') + leaf(62, 206, 30, -30, '#7f9f60') + leaf(62, 206, 26, -62, '#8aaa6c');
    s += leaf(46, 160, 18, -160, '#93b276') + leaf(74, 156, 18, -20, '#86a96a');
    s += rosette(34, 104, 17, peach, 0);
    s += rosette(88, 96, 18, cream, 2);
    s += rosette(60, 60, 23, butter, 1);
    // a little bud
    s += '<g class="bloom__head" style="--i:3">' +
      '<circle cx="78" cy="140" r="7" fill="#efd18f"/><path d="M71.4 141 Q78 150 84.6 141 Q80 146 78 147 Q76 146 71.4 141 Z" fill="#8fb069"/>' +
      '<path d="M74 136 Q78 133 82 136" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width=".8"/></g>';
    return wrap(s, 'Blooming butter-yellow and peach ranunculus');
  }

  // ---- Cosmos: airy blush flowers on wiry stems with feathery leaves ----------
  function cosmosHead(cx, cy, r, colour, tilt, i) {
    const petal = `M0 ${r1(-r * 0.12)} C${r1(-r * 0.34)} ${r1(-r * 0.3)} ${r1(-r * 0.38)} ${r1(-r * 0.78)} ${r1(-r * 0.21)} ${r1(-r)} ` +
      `L${r1(-r * 0.1)} ${r1(-r * 0.9)} L0 ${r1(-r * 1.04)} L${r1(r * 0.1)} ${r1(-r * 0.9)} L${r1(r * 0.21)} ${r1(-r)} ` +
      `C${r1(r * 0.38)} ${r1(-r * 0.78)} ${r1(r * 0.34)} ${r1(-r * 0.3)} 0 ${r1(-r * 0.12)} Z`;
    let g = `<g class="bloom__head" style="--i:${i}"><g transform="translate(${cx} ${cy}) rotate(${tilt}) scale(1 .84)">`;
    for (let k = 0; k < 8; k++) {
      g += `<path d="${petal}" fill="${colour}" stroke="#b9677c" stroke-opacity=".28" stroke-width=".5" transform="rotate(${k * 45 + 8})"/>`;
      g += `<path d="M0 ${r1(-r * 0.25)} L0 ${r1(-r * 0.8)}" stroke="#ffffff" stroke-opacity=".35" stroke-width=".6" transform="rotate(${k * 45 + 8})"/>`;
    }
    g += `<circle r="${r1(r * 0.24)}" fill="#e0b44e"/>`;
    for (let k = 0; k < 8; k++) {
      const a = k * 45 * Math.PI / 180;
      g += `<circle cx="${r1(Math.cos(a) * r * 0.15)}" cy="${r1(Math.sin(a) * r * 0.15)}" r=".9" fill="#b98a2c"/>`;
    }
    return g + '</g></g>';
  }

  function frond(x, y, length, angle) {
    let f = `<g transform="translate(${x} ${y}) rotate(${angle})" stroke="#7f9a64" stroke-width=".8" stroke-linecap="round" fill="none">`;
    f += `<path d="M0 0 L${length} 0"/>`;
    for (let d = 3; d < length; d += 3.4) {
      const l = 6 * (1 - d / length) + 1.5;
      f += `<path d="M${r1(d)} 0 l${r1(l * 0.6)} ${r1(-l * 0.8)} M${r1(d + 1.6)} 0 l${r1(l * 0.6)} ${r1(l * 0.8)}"/>`;
    }
    return f + '</g>';
  }

  function cosmos() {
    const heads = [
      { x: 50, y: 36, r: 17, c: '#f3c1c9', tilt: -12, i: 0 },
      { x: 86, y: 66, r: 15, c: '#f7d3d8', tilt: 10, i: 1 },
      { x: 26, y: 84, r: 14, c: '#eeb2bd', tilt: -4, i: 2 },
      { x: 68, y: 104, r: 13, c: '#f9dfe2', tilt: 14, i: 3 }
    ];
    let s = '';
    heads.forEach((h) => {
      s += `<path d="M60 214 C${r1(60 + (h.x - 60) * 0.2)} 170 ${r1(h.x + (60 - h.x) * 0.15)} ${r1(h.y + 50)} ${h.x} ${r1(h.y + h.r * 0.5)}" fill="none" stroke="${STEM}" stroke-width="1.3" stroke-linecap="round"/>`;
    });
    s += `<path d="M60 214 C62 180 80 150 98 122" fill="none" stroke="${STEM}" stroke-width="1.1"/>`;
    s += `<path d="M60 214 C58 184 46 156 38 132" fill="none" stroke="${STEM}" stroke-width="1.1"/>`;
    s += frond(58, 206, 30, -150) + frond(62, 206, 30, -30) + frond(58, 196, 24, -120) + frond(62, 194, 26, -62) + frond(60, 176, 20, -100) + frond(54, 150, 18, -160) + frond(70, 140, 18, -24);
    s += '<g class="bloom__head" style="--i:4"><ellipse cx="98" cy="120" rx="3.4" ry="4.6" fill="#e9a8b6"/><path d="M95 122 Q98 128 101 122" fill="#8fb069"/></g>';
    s += '<g class="bloom__head" style="--i:4"><ellipse cx="38" cy="130" rx="3" ry="4.2" fill="#a9c58a"/></g>';
    heads.slice().reverse().forEach((h) => { s += cosmosHead(h.x, h.y, h.r, h.c, h.tilt, h.i); });
    return wrap(s, 'Blooming blush-pink cosmos');
  }

  window.BloomArt = {
    snapdragon: snapdragon(),
    ranunculus: ranunculus(),
    cosmos: cosmos()
  };
})();
