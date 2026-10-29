/* ==========================================================================
   A Day in Bloom · The Wishing Willow
   Clicking the willow in the garden steps beneath its branches (#willow):
   a quiet, secret nook with the great trunk and its little hollow, a rope
   swing, a writing desk with paper, pencils and pressed flowers, a stool,
   ribbons tied to the branches, and moss, roots, mushrooms and wildflowers.

   At the desk a visitor can write little wishes and hang up to eight of them
   on the branches, each on its own ribbon. They're private and kept only in
   this page's memory for now. The scene is painted on the first visit; all
   movement is CSS (styles in css/willow.css).
   ========================================================================== */
(function () {
  'use strict';

  const body = document.body;
  const room = document.getElementById('willow-room');
  const peek = document.getElementById('willow-peek');
  if (!room || !peek) return;

  const viewport = document.getElementById('willow-viewport');
  const scene = document.getElementById('willow-scene');
  const back = document.getElementById('willow-back');
  const gardenViewport = document.getElementById('garden-viewport');
  const instructionBar = document.getElementById('instruction-bar');

  // soft sounds (js/sound.js); silent unless the visitor has turned sound on
  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };

  // ---- Little helpers ----------------------------------------------------------
  let seed = 5519;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const between = (min, max) => min + random() * (max - min);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const r1 = (n) => Math.round(n * 10) / 10;
  const GREENS = ['#8fae74', '#a3bd88', '#7f9a64', '#96b27a', '#b0c795'];

  function fill(id, html) {
    const g = document.getElementById(id);
    if (g) g.innerHTML = html;
  }

  // ---- Willow strands: a hanging line with slender leaves along it ----------------
  function strand(x0, y0, length, drift, opts) {
    const o = opts || {};
    const steps = Math.max(2, Math.round(length / 14));
    let path = `M${r1(x0)} ${r1(y0)}`;
    let leaves = '';
    const points = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + drift * t * t + Math.sin(t * 5 + x0) * 3;
      const y = y0 + length * t;
      path += ` L${r1(x)} ${r1(y)}`;
      points.push([x, y]);
      if (o.leaves !== false) {
        const side = i % 2 ? 1 : -1;
        const len = (o.leaf || 13) * (1 - t * 0.3);
        leaves += `<ellipse cx="${r1(x + side * len * 0.45)}" cy="${r1(y + 3)}" rx="${r1(len * 0.55)}" ry="${r1(len * 0.16)}" fill="${pick(o.colours || GREENS)}" transform="rotate(${r1(side * 62 + between(-10, 10))} ${r1(x + side * len * 0.45)} ${r1(y + 3)})"/>`;
      }
    }
    return { svg: `<path d="${path}" fill="none" stroke="${o.stem || '#7f9a64'}" stroke-width="${o.width || 1.6}" stroke-linejoin="round"/>` + leaves, points };
  }

  // a soft ribbon tied in a bow, with two trailing tails
  function ribbon(x, y, colour, edge) {
    return `<g transform="translate(${r1(x)} ${r1(y)})">` +
      `<path d="M0 0 C-14 -12 -26 -4 -20 6 C-15 13 -6 6 0 0 C6 6 15 13 20 6 C26 -4 14 -12 0 0 Z" fill="${colour}" stroke="${edge}" stroke-width="1.2"/>` +
      `<path d="M-2 2 Q-10 22 -6 42 L-1 38 Q-4 22 3 4 Z M2 2 Q12 20 10 40 L5 37 Q6 22 -1 4 Z" fill="${colour}" stroke="${edge}" stroke-width="1"/>` +
      `<circle r="4" fill="${edge}" opacity=".7"/></g>`;
  }

  function mushroom(x, y, s, cap, spots) {
    let m = `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">` +
      '<ellipse cx="0" cy="1" rx="12" ry="3" fill="#3f4a30" opacity=".2"/>' +
      '<path d="M-5 0 Q-6 -14 -3 -20 L3 -20 Q6 -14 5 0 Z" fill="#f4ecdc"/>' +
      `<path d="M-15 -18 Q-14 -34 0 -35 Q14 -34 15 -18 Q0 -14 -15 -18 Z" fill="${cap}"/>` +
      '<path d="M-14 -18 Q0 -14 14 -18" fill="none" stroke="#e9dcc4" stroke-width="2"/>';
    if (spots) m += '<circle cx="-6" cy="-27" r="2.4" fill="#fffaf0"/><circle cx="4" cy="-30" r="2" fill="#fffaf0"/><circle cx="8" cy="-23" r="1.6" fill="#fffaf0"/>';
    return m + '</g>';
  }

  function wildflower(x, y, kind) {
    let f = `<path d="M${r1(x)} ${r1(y + 20)} L${r1(x)} ${r1(y)}" stroke="#6f8a58" stroke-width="1.6"/>`;
    if (kind === 'daisy') f += `<use href="#bloom-daisy" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(between(1, 1.4))})"/>`;
    else if (kind === 'cosmos') f += `<use href="#bloom-cosmos" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(between(1, 1.3))})" style="color:${pick(['#efbcc4', '#e39aa8', '#f4d3d5'])}"/>`;
    else if (kind === 'forget') {
      for (let k = 0; k < 5; k++) {
        const a = k * 72 * Math.PI / 180;
        f += `<circle cx="${r1(x + Math.cos(a) * 3)}" cy="${r1(y + Math.sin(a) * 3)}" r="2.4" fill="#9fc0dc"/>`;
      }
      f += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.4" fill="#f2d27a"/>`;
    } else f += `<circle cx="${r1(x)}" cy="${r1(y)}" r="4" fill="#f2d27a"/><circle cx="${r1(x)}" cy="${r1(y)}" r="1.5" fill="#d9a83a"/>`;
    return f;
  }

  // ---- Painting the nook (once, on the first visit) ---------------------------------
  let painted = false;

  function paint() {
    if (painted) return;
    painted = true;

    // the far curtain of willow strands, with bright meadow light glowing between them
    let curtain = '<g fill="#fbf6e2" filter="url(#blur-md)" opacity=".7">';
    for (let i = 0; i < 14; i++) curtain += `<ellipse cx="${r1(between(0, 1600))}" cy="${r1(between(260, 700))}" rx="${r1(between(30, 80))}" ry="${r1(between(60, 160))}"/>`;
    curtain += '</g><g filter="url(#blur-sm)" opacity=".75" fill="none" stroke-linecap="round">';
    for (let x = -20; x < 1620; x += between(12, 22)) {
      const len = between(420, 860);
      const drift = between(-20, 20);
      curtain += `<path d="M${r1(x)} -10 Q${r1(x + drift * 0.4)} ${r1(len * 0.5)} ${r1(x + drift)} ${r1(len)}" stroke="${pick(['#a9bd90', '#b9cba3', '#c5d4ae', '#9db584'])}" stroke-width="${r1(between(3, 6))}" stroke-dasharray="${r1(between(6, 10))} ${r1(between(3, 6))}"/>`;
    }
    fill('wl-curtain', curtain + '</g>');

    // the mossy ground: grass, moss patches, wildflowers and little mushrooms
    let ground = '<path d="M0 790 C200 770 420 800 620 784 C800 770 1000 796 1200 782 C1380 770 1500 790 1600 782 L1600 1000 L0 1000 Z" fill="url(#wl-moss)"/>';
    for (let i = 0; i < 16; i++) ground += `<ellipse cx="${r1(between(0, 1600))}" cy="${r1(between(810, 990))}" rx="${r1(between(40, 120))}" ry="${r1(between(8, 18))}" fill="${pick(['#86a56a', '#a9c48a', '#7a9a5e'])}" opacity=".55"/>`;
    for (let i = 0; i < 150; i++) {
      const x = between(0, 1600);
      const y = between(790, 1000);
      ground += `<path d="M${r1(x)} ${r1(y)} q${r1(between(-4, 4))} ${r1(-between(8, 18))} ${r1(between(-6, 6))} ${r1(-between(14, 28))}" stroke="${pick(['#6f8a58', '#7f9a64', '#93ad76'])}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 48; i++) {
      const x = between(20, 1580);
      if (x > 640 && x < 960 && random() < 0.7) continue;   // keep the roots of the trunk tidy
      ground += wildflower(x, between(812, 980), pick(['daisy', 'daisy', 'cosmos', 'forget', 'forget', 'buttercup']));
    }
    fill('wl-ground', ground);

    // the great trunk: limbs reaching out above, roots spreading below, and the little hollow
    let trunk = '';
    // limbs arching away overhead (the strands hang from them)
    [['M700 140 C560 70 360 40 120 70', 46], ['M720 220 C600 170 470 170 300 210', 26], ['M900 140 C1040 70 1240 40 1500 60', 46], ['M880 230 C1000 180 1150 180 1320 220', 26]].forEach(([d, w]) => {
      trunk += `<path d="${d}" fill="none" stroke="#7d6e5c" stroke-width="${w}" stroke-linecap="round"/>`;
      trunk += `<path d="${d}" fill="none" stroke="#a39380" stroke-width="${w * 0.25}" stroke-linecap="round" opacity=".6" transform="translate(0 ${-w * 0.2})"/>`;
      // soft moss along the top of each limb
      trunk += `<path d="${d}" fill="none" stroke="#8fae74" stroke-width="${r1(w * 0.26)}" stroke-linecap="round" stroke-dasharray="${w * 1.4} ${w * 0.8}" opacity=".75" transform="translate(0 ${r1(-w * 0.36)})"/>`;
    });
    // roots
    trunk += '<path d="M640 820 C590 856 520 872 440 890 C500 900 580 892 652 860 Z" fill="#6f6252"/>' +
      '<path d="M960 820 C1010 856 1080 870 1160 884 C1100 896 1020 890 948 860 Z" fill="#6f6252"/>' +
      '<path d="M700 850 C680 880 640 900 600 916 C650 918 700 900 726 870 Z M900 850 C920 880 962 900 1004 914 C956 918 902 902 874 870 Z" fill="#7d6e5c"/>';
    // the trunk itself, wide and flaring at its base
    trunk += '<path d="M610 1000 C650 930 664 860 668 760 C672 600 644 420 664 250 C676 150 650 60 620 -20 L980 -20 C950 60 924 150 936 250 C956 420 928 600 932 760 C936 860 950 930 990 1000 Z" fill="url(#wl-bark)"/>';
    for (let i = 0; i < 14; i++) {
      const x = between(680, 920);
      trunk += `<path d="M${r1(x)} ${r1(between(-10, 300))} C${r1(x + between(-14, 14))} ${r1(between(300, 500))} ${r1(x + between(-14, 14))} ${r1(between(500, 700))} ${r1(x + between(-10, 10))} ${r1(between(720, 900))}" fill="none" stroke="#5f5446" stroke-width="${r1(between(1.4, 3))}" opacity=".45"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const x = between(690, 900);
      trunk += `<path d="M${r1(x)} ${r1(between(40, 700))} q${r1(between(-6, 6))} 40 0 80" fill="none" stroke="#c9b79c" stroke-width="1.6" opacity=".4"/>`;
    }
    // moss creeping up from the roots
    trunk += '<path d="M640 960 C660 900 690 860 720 850 C700 900 690 940 700 990 Z M960 960 C940 900 906 860 878 852 C900 900 906 940 896 990 Z" fill="#8fae74" opacity=".75"/>';
    // a climbing vine and soft moss on the trunk, with a few fresh sprouts of new growth
    const vineLeaves = (pts) => {
      let v = `<path d="M${pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L')}" fill="none" stroke="#6f8a58" stroke-width="2" stroke-linejoin="round"/>`;
      pts.forEach(([x, y], i) => {
        if (i === 0) return;
        const side = i % 2 ? 1 : -1;
        v += `<ellipse cx="${r1(x + side * 6)}" cy="${r1(y)}" rx="7" ry="4" fill="${pick(['#7fa866', '#93ad76', '#86a169'])}" transform="rotate(${side * 35} ${r1(x + side * 6)} ${r1(y)})"/>`;
      });
      return v;
    };
    const climb = [];
    for (let y = 990; y > 300; y -= 22) climb.push([700 + Math.sin(y / 60) * 16 + (990 - y) * 0.02, y]);
    trunk += vineLeaves(climb);
    const climb2 = [];
    for (let y = 980; y > 640; y -= 22) climb2.push([900 - Math.sin(y / 50) * 12, y]);
    trunk += vineLeaves(climb2);
    [[686, 330, 22, 10], [912, 420, 18, 9], [700, 720, 26, 12], [905, 760, 22, 10], [760, 250, 16, 8]].forEach(([x, y, rx, ry]) => {
      trunk += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#8fae74" opacity=".7"/><ellipse cx="${x - 4}" cy="${y - 3}" rx="${rx * 0.5}" ry="${ry * 0.5}" fill="#a9c48a" opacity=".7"/>`;
    });
    [[676, 846], [928, 838], [752, 980], [858, 984]].forEach(([x, y]) => {
      trunk += `<path d="M${x} ${y} q-2 -14 2 -24" stroke="#7f9a64" stroke-width="2" fill="none"/>` +
        `<ellipse cx="${x - 5}" cy="${y - 20}" rx="6" ry="3" fill="#a9c48a" transform="rotate(-30 ${x - 5} ${y - 20})"/>` +
        `<ellipse cx="${x + 6}" cy="${y - 24}" rx="6" ry="3" fill="#b0c795" transform="rotate(30 ${x + 6} ${y - 24})"/>`;
    });

    // the little hollow, with a tiny shelf of letters and rolled wishes, and a glass lantern
    trunk += '<ellipse cx="800" cy="522" rx="56" ry="76" fill="#6f6252"/>' +
      '<ellipse cx="800" cy="526" rx="44" ry="63" fill="url(#wl-hollow)"/>' +
      // the lantern's warm light on the inside of the hollow (brighter at golden hour, see css)
      '<ellipse cx="814" cy="532" rx="30" ry="34" fill="#ffd98a" fill-opacity=".22" filter="url(#blur-md)"/>' +
      // a pressed flower pinned to the back wall, and a rolled wish tucked above the shelf
      '<rect x="776" y="486" width="16" height="22" rx="1.5" fill="#f6eedc" transform="rotate(-6 784 497)"/>' +
      '<use href="#bloom-cosmos" transform="translate(784 494) scale(.55)" style="color:#efbcc4"/>' +
      '<path d="M784 500 v6" stroke="#7f9a64" stroke-width="1"/>' +
      '<circle cx="784" cy="487" r="1.2" fill="#c9a96a"/>' +
      // the tiny wooden shelf
      '<rect x="764" y="552" width="72" height="5" rx="1.5" fill="#a8845e"/><rect x="764" y="557" width="72" height="2.4" fill="#5e4630" opacity=".6"/>' +
      // a folded letter and two rolled wishes, one tied with pink thread
      '<path d="M770 538 L790 538 L790 552 L770 552 Z" fill="#fbf6ea"/><path d="M770 538 L780 546 L790 538" fill="none" stroke="#d9c49c" stroke-width=".8"/>' +
      '<rect x="792" y="545" width="20" height="7" rx="3.5" fill="#f4ecdc"/><path d="M801 545 v7" stroke="#e3a9b0" stroke-width="1.6"/>' +
      '<rect x="796" y="539" width="16" height="6" rx="3" fill="#fbf6ea" transform="rotate(-8 804 542)"/>' +
      // the little glass lantern
      '<path d="M817 552 V532 H831 V552 Z" fill="#fff6dc" fill-opacity=".55" stroke="#5e4630" stroke-width="1.2"/>' +
      '<path d="M815 532 L824 525 L833 532 Z" fill="#5e4630"/><circle cx="824" cy="523" r="2" fill="none" stroke="#5e4630" stroke-width="1"/>' +
      '<rect x="822" y="542" width="4" height="9" fill="#fbf3e0"/><ellipse cx="824" cy="539" rx="2" ry="3.2" fill="#ffcf73"/>' +
      '<path d="M752 500 C756 460 778 444 800 444" fill="none" stroke="#b3a38c" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M846 510 C844 540 840 570 830 590" fill="none" stroke="#5a4e40" stroke-width="4" stroke-linecap="round" opacity=".6"/>' +
      // (golden-only layers fade to full opacity, so the glow's softness lives in its fill)
      '<ellipse class="golden-only" cx="800" cy="540" rx="30" ry="40" fill="#ffcf8a" fill-opacity=".22" filter="url(#blur-md)"/>' +
      '<path d="M760 590 C780 602 820 602 842 590 C830 610 772 612 760 590 Z" fill="#8fae74"/>' +
      // moss and a delicate vine around the opening
      '<path d="M748 470 C752 452 766 444 778 442 C770 452 760 462 754 476 Z M842 474 C846 488 848 500 846 512 C842 500 838 488 836 478 Z" fill="#93ad76"/>' +
      vineLeaves([[746, 560], [744, 538], [746, 516], [752, 494], [762, 474], [776, 458], [792, 450], [808, 450], [824, 456]]) +
      mushroom(828, 594, 0.55, '#e3a9b0', false);
    // mushrooms clustered among the roots
    trunk += mushroom(560, 884, 1, '#c96a5a', true) + mushroom(588, 896, 0.7, '#d98a7a', true) +
      mushroom(1040, 880, 0.9, '#c9a77c', false) + mushroom(1066, 892, 0.65, '#e3a9b0', false) +
      mushroom(470, 912, 0.75, '#c96a5a', true);
    fill('wl-trunk', trunk);

    // the handwritten sign: "The Wishing Willow ♡"
    fill('wl-sign',
      '<rect x="404" y="706" width="12" height="190" fill="#7a5c40"/>' +
      '<rect x="286" y="690" width="248" height="66" rx="9" fill="#d9bd94" stroke="#8c6a4a" stroke-width="3" transform="rotate(-3 410 723)"/>' +
      '<rect x="294" y="697" width="232" height="52" rx="6" fill="none" stroke="#f3e3c2" stroke-width="1.4" stroke-dasharray="4 3" transform="rotate(-3 410 723)"/>' +
      '<text x="410" y="733" text-anchor="middle" font-family="Caveat, cursive" font-size="32" font-weight="600" fill="#4f3b28" transform="rotate(-3 410 723)">The Wishing Willow ♡</text>' +
      wildflower(392, 878, 'daisy') + wildflower(430, 884, 'forget') + wildflower(416, 870, 'cosmos'));

    // the little writing desk: paper, a jar of pencils, pressed flowers, an envelope; and a stool
    let desk = '<ellipse cx="1186" cy="904" rx="170" ry="12" fill="#3f4a30" opacity=".18"/>' +
      // back legs, then the top, apron and drawer, then the front legs
      '<path d="M1064 712 V888 M1300 712 V888" stroke="#8c6a4a" stroke-width="10"/>' +
      '<rect x="1030" y="690" width="314" height="20" rx="4" fill="url(#wl-wood)"/>' +
      '<rect x="1030" y="690" width="314" height="4" fill="#dcc29a"/>' +
      '<rect x="1044" y="710" width="286" height="34" fill="#a8845e"/>' +
      '<rect x="1140" y="716" width="94" height="22" rx="3" fill="#b48c62" stroke="#8c6a4a" stroke-width="1.4"/>' +
      '<circle cx="1187" cy="727" r="4" fill="#d9bd94"/>' +
      '<path d="M1052 744 V900 M1322 744 V900" stroke="#7a5c40" stroke-width="12" stroke-linecap="round"/>';
    // a stack of cream writing paper
    for (let i = 0; i < 5; i++) desk += `<rect x="${1060 + i * 1.5}" y="${684 - i * 3}" width="96" height="10" rx="1.5" fill="${i % 2 ? '#fbf6ea' : '#f4ecdc'}" stroke="#e2d6c0" stroke-width=".8" transform="rotate(${-2 + i * 0.8} 1108 ${680 - i * 3})"/>`;
    // a pressed-flower card
    desk += '<g transform="rotate(6 1206 682)"><rect x="1172" y="668" width="70" height="18" rx="2" fill="#fffaf0" stroke="#e2d6c0" stroke-width=".8"/>' +
      '<path d="M1190 682 Q1200 676 1210 672" stroke="#7f9a64" stroke-width="1.2" fill="none"/>' +
      '<use href="#bloom-cosmos" transform="translate(1212 672) scale(.7)" style="color:#efbcc4"/>' +
      '<use href="#bloom-daisy" transform="translate(1226 678) scale(.55)"/></g>';
    // an envelope with a little pink seal, leaning on the jar
    desk += '<g transform="rotate(-14 1262 664)"><rect x="1236" y="646" width="50" height="34" rx="2" fill="#f6eedc" stroke="#d9c49c" stroke-width="1"/>' +
      '<path d="M1236 646 L1261 666 L1286 646" fill="none" stroke="#d9c49c" stroke-width="1"/><circle cx="1261" cy="666" r="5" fill="#e3a9b0"/></g>';
    // a jar of pencils
    desk += '<path d="M1290 690 L1290 640 Q1290 634 1296 634 L1322 634 Q1328 634 1328 640 L1328 690 Z" fill="#dcebea" fill-opacity=".55" stroke="#ffffff" stroke-width="1.6"/>';
    [['#e3a9b0', 1298, -8], ['#9db08b', 1306, 4], ['#f2d58f', 1314, -3], ['#b9a2cf', 1320, 9]].forEach(([c, x, lean]) => {
      desk += `<path d="M${x} 686 L${x + lean * 0.6} 604" stroke="${c}" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M${x + lean * 0.6} 604 l${r1(lean * 0.05)} -8" stroke="#3f3a34" stroke-width="2" stroke-linecap="round"/>`;
    });
    desk += '<rect x="1288" y="630" width="42" height="6" rx="3" fill="#ffffff" fill-opacity=".6"/>';
    // a loose pencil
    desk += '<path d="M1168 692 L1232 688" stroke="#9db08b" stroke-width="4" stroke-linecap="round"/><path d="M1232 688 l7 -.4" stroke="#3f3a34" stroke-width="2"/>';
    // the cozy wooden stool, just in front
    desk += '<ellipse cx="1176" cy="918" rx="56" ry="7" fill="#3f4a30" opacity=".18"/>' +
      '<path d="M1144 826 L1134 914 M1208 826 L1218 914 M1162 830 L1158 908 M1190 830 L1194 908" stroke="#8c6a4a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M1140 876 H1212" stroke="#9c7a55" stroke-width="5"/>' +
      '<rect x="1128" y="812" width="96" height="14" rx="7" fill="#a9825d"/>' +
      '<ellipse cx="1176" cy="812" rx="48" ry="9" fill="url(#wl-wood)"/>';
    fill('wl-desk', desk);

    // soft beams of sunlight slanting down through the leaves
    fill('wl-beams', '<g fill="#fff8e0" filter="url(#blur-md)">' +
      '<path d="M980 -20 L1100 -20 L860 820 L740 820 Z" opacity=".16"/>' +
      '<path d="M1180 -20 L1250 -20 L1080 760 L1000 760 Z" opacity=".12"/>' +
      '<path d="M500 -20 L560 -20 L420 700 L360 700 Z" opacity=".1"/></g>' +
      '<g class="golden-only" fill="#ffd9a6" filter="url(#blur-md)">' +
      '<path d="M1300 -20 L1420 -20 L1140 820 L1020 820 Z" fill-opacity=".3"/></g>');

    // the strands nearest to you, framing the nook. A clear pocket is kept on the left, under
    // the lower limb (around x 350–520, y 200–440), where a visitor's wish hangs; the desk,
    // the hollow and the sign stay clear too.
    const left = [[20, 900], [74, 330], [126, 780], [186, 280], [252, 650], [318, 240], [390, 140], [452, 110]];
    const right = [[1150, 210], [1214, 300], [1282, 250], [1346, 640], [1410, 300], [1470, 780], [1530, 340], [1584, 900]];
    const top = [];
    for (let x = 520; x <= 1080; x += 70) top.push([x, between(110, 200)]);
    let front = '';
    const tie = [];
    [...left, ...right, ...top].forEach(([x, len], i) => {
      const s = strand(x, -10, len, between(-24, 24), { width: 2 });
      front += s.svg;
      if (len > 600) tie.push(s.points[Math.floor(s.points.length * 0.55)]);
    });
    // more cascading strands for a lusher canopy: olive, sage and fresh greens, in varied lengths
    const LUSH = ['#8f9a5a', '#9db08b', '#7fa866', '#a3bd88', '#86a169', '#b0c795'];
    [[48, 520], [100, 860], [156, 420], [220, 840], [284, 380], [1180, 460], [1246, 520], [1314, 400], [1378, 880], [1440, 520], [1500, 860], [1556, 600]].forEach(([x, len]) => {
      front += strand(x + between(-6, 6), -10, len, between(-20, 20), { width: 1.8, leaf: between(11, 16), colours: LUSH }).svg;
    });
    // a soft fringe of short leafy tips all along the top of the canopy
    for (let x = -10; x < 1620; x += between(18, 30)) {
      front += strand(x, -14, between(40, 150), between(-12, 12), { width: 1.4, leaf: between(10, 15), colours: LUSH }).svg;
    }
    // strands hanging from the limbs themselves (keeping the wish pocket and the desk clear)
    [[150, 90], [230, 80], [310, 70], [600, 112], [660, 128], [940, 128], [1010, 108], [1090, 90], [1290, 70], [1400, 72], [1470, 80]].forEach(([x, y]) => {
      front += strand(x, y, between(80, 220), between(-14, 14), { width: 1.4, leaf: 12, colours: LUSH }).svg;
    });
    [[560, 196], [620, 204], [960, 206], [1040, 196], [1120, 190]].forEach(([x, y]) => {
      front += strand(x, y, between(60, 150), between(-10, 10), { width: 1.4, leaf: 11, colours: LUSH }).svg;
    });
    // ribbons tied to the longest strands at the edges (clear of the swing ropes and the wishes' branches)
    const colours = [['#efbcc4', '#d98f99'], ['#c9d6b6', '#86996f'], ['#f6eedc', '#c9b48a'], ['#f3dea4', '#c9a96a'], ['#e3a9b0', '#b0697a']];
    tie.filter(([x]) => x < 80 || x > 1560).forEach(([x, y], i) => { front += ribbon(x, y, colours[i % colours.length][0], colours[i % colours.length][1]); });
    fill('wl-strands-front', front);

    let backStrands = '';
    for (let x = 0; x < 1600; x += between(26, 44)) {
      if (x > 590 && x < 1010) continue;   // the trunk stands here
      if (x > 350 && x < 520) continue;    // the wish pocket
      backStrands += strand(x + between(-10, 10), -10, between(180, 640), between(-20, 20), { width: 1.4, leaf: between(10, 13), colours: ['#a9c48a', '#b9cfa0', '#9db584', '#a7b16f', '#8fae74'], stem: '#8fae74' }).svg;
    }
    // the crown of the canopy: soft clusters of leaves layered all along the top
    let crown = '';
    for (let i = 0; i < 520; i++) {
      const x = between(-20, 1620);
      const y = -20 + Math.pow(random(), 1.6) * 150;
      const len = between(9, 17);
      crown += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(len * 0.55)}" ry="${r1(len * 0.18)}" fill="${pick(['#9db584', '#a9c48a', '#8fae74', '#b5cc93', '#a7b16f'])}" transform="rotate(${r1(between(40, 140))} ${r1(x)} ${r1(y)})"/>`;
    }
    fill('wl-strands-back', `<g opacity=".85">${backStrands}${crown}</g>`);

    // a middle layer of long cascading strands, for a full, mature willow. The outer curtains reach
    // right down to the grass; over the hollow, the desk and the sign they stay short.
    const MID = ['#93ad76', '#a3bd88', '#8f9a5a', '#7fa866', '#b5cc93', '#9db08b', '#86a169'];
    let mid = '';
    for (let x = -16; x < 1620; x += between(14, 24)) {
      if (x > 610 && x < 990) continue;                   // the trunk and its hollow
      let len;
      if (x < 100 || x > 1500) len = between(620, 960);   // the outer curtains, down to the grass
      else if (x < 280) len = between(380, 900);          // behind the swing
      else if (x < 610) len = between(140, 600);          // above the sign
      else if (x < 1360) len = between(110, 500);         // above the desk
      else len = between(420, 920);
      mid += strand(x, -12, len, between(-26, 26), { width: 1.5, leaf: between(9, 18), colours: MID, stem: pick(['#7f9a64', '#8fae74', '#86a169']) }).svg;
    }
    fill('wl-strands-mid', mid);

    paintSwing();
  }

  // ---- The rope swing: a wooden seat with a gingham cushion, on two ropes wound with vines --------
  // Drawn in its own units (160 × 690), which match the willow's: the ropes are tied round the
  // thick left limb at x 128 and 238 and the seat hangs about 80 units above the grass.
  function paintSwing() {
    const ropes = [25, 135];
    let s = '<svg viewBox="0 0 160 690" aria-hidden="true"><defs>' +
      '<pattern id="wl-gingham" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f7e3e3"/>' +
      '<rect width="4" height="8" fill="#e3a9b0" fill-opacity=".5"/><rect width="8" height="4" fill="#e3a9b0" fill-opacity=".5"/></pattern>' +
      '<linearGradient id="wl-seat-face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9916a"/><stop offset="1" stop-color="#94704e"/></linearGradient></defs>';
    // the ropes, each wound a few times round the limb, with a little twist along their length
    [[25, 16, 60], [135, 6, 52]].forEach(([x, top, bottom]) => {
      for (let y = top + 4; y < bottom; y += 9) s += `<path d="M${x - 8} ${y} Q${x} ${y - 4} ${x + 8} ${y + 3}" fill="none" stroke="#c9ad84" stroke-width="4.4" stroke-linecap="round"/><path d="M${x - 7} ${y + 2} Q${x} ${y - 1} ${x + 7} ${y + 5}" fill="none" stroke="#9c8463" stroke-width="1" opacity=".6"/>`;
      s += `<path d="M${x} ${bottom} V672" stroke="#c9ad84" stroke-width="4.6"/>` +
        `<path d="M${x} ${bottom} V672" stroke="#9c8463" stroke-width="4.6" stroke-dasharray="2 5" opacity=".55"/>` +
        `<path d="M${x - 1.2} ${bottom} V672" stroke="#efdcb8" stroke-width="1" opacity=".6"/>`;
    });
    // delicate vines spiralling round the ropes, with tiny leaves and flowers
    ropes.forEach((x, k) => {
      let d = '';
      let bits = '';
      for (let y = 70; y <= 640; y += 6) {
        const vx = x + Math.sin(y / 15 + k * 2) * 4.5;
        d += `${y === 70 ? 'M' : ' L'}${r1(vx)} ${y}`;
        if (y % 30 === 10) {
          const side = Math.sin(y / 15 + k * 2) > 0 ? 1 : -1;
          bits += `<ellipse cx="${r1(vx + side * 5)}" cy="${y}" rx="5" ry="2.4" fill="${pick(['#7fa866', '#93ad76', '#a3bd88'])}" transform="rotate(${side * 30} ${r1(vx + side * 5)} ${y})"/>`;
        }
        if (y % 78 === 4 && y < 600) {
          const c = pick(['#f2c9cf', '#fffaf0', '#e3a9b0', '#f6e3a8']);
          for (let p = 0; p < 5; p++) {
            const a = p * 72 * Math.PI / 180;
            bits += `<circle cx="${r1(vx + Math.cos(a) * 2.6)}" cy="${r1(y + Math.sin(a) * 2.6)}" r="1.9" fill="${c}"/>`;
          }
          bits += `<circle cx="${r1(vx)}" cy="${y}" r="1.2" fill="#e6b85c"/>`;
        }
      }
      s += `<path d="${d}" fill="none" stroke="#6f8a58" stroke-width="1.3"/>` + bits;
    });
    // the seat: a plank seen a little from above, the cushion, and the rope knots beneath
    s += '<ellipse cx="80" cy="688" rx="60" ry="2" fill="#3f4a30" opacity=".12"/>' +
      '<path d="M10 662 L150 662 L146 655 L14 655 Z" fill="#d6b78c"/>' +
      '<rect x="8" y="662" width="144" height="13" rx="2.5" fill="url(#wl-seat-face)"/>' +
      '<path d="M14 666 Q44 664 70 667 T146 666 M18 671 Q60 669 96 672 T144 671" fill="none" stroke="#7a5c40" stroke-width=".9" opacity=".45"/>' +
      '<ellipse cx="104" cy="668" rx="3.4" ry="1.6" fill="none" stroke="#7a5c40" stroke-width=".8" opacity=".5"/>' +
      '<path d="M8 662 h144" stroke="#e6cfa6" stroke-width="1" opacity=".8"/>' +
      // the cushion, puffed up a little, with tiny ties at its corners
      '<path d="M36 657 Q34 642 46 641 L114 641 Q126 642 124 657 Q80 661 36 657 Z" fill="url(#wl-gingham)" stroke="#d29aa3" stroke-width="1"/>' +
      '<path d="M44 646 Q80 643 116 646" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".55"/>' +
      '<path d="M37 655 l-5 4 M37 655 l-2 6 M123 655 l5 4 M123 655 l2 6" stroke="#d29aa3" stroke-width="1.3" stroke-linecap="round"/>';
    ropes.forEach((x) => { s += `<path d="M${x} 672 V681" stroke="#c9ad84" stroke-width="4.6"/><circle cx="${x}" cy="683" r="4.6" fill="#c9ad84" stroke="#9c8463" stroke-width="1"/>`; });
    fill('wl-swing-art', s + '</svg>');
  }

  // ---- Stepping in and out (like the greenhouse and the lake) -----------------------
  let enteredFromGarden = false;
  let closeTimer;
  let settleTimer;

  function unit() { return scene.clientWidth / 1600; }

  function enter() {
    if (!room.hidden && room.classList.contains('is-open')) return;
    window.clearTimeout(closeTimer);
    paint();
    room.hidden = false;
    body.classList.add('at-willow');
    gardenViewport.inert = true;
    instructionBar.inert = true;
    // on narrow screens, start with the hollow in view and the writing desk beside it
    // (on wide screens the whole nook fits, so there's nothing to scroll)
    const spare = scene.clientWidth - viewport.clientWidth;
    viewport.scrollLeft = spare > 0 ? Math.min(spare, Math.max(0, 950 * unit() - viewport.clientWidth / 2)) : 0;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => body.classList.add('willow-settled'), 1300);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      room.classList.add('is-open');
      back.focus({ preventScroll: true });
    }));
    greet();   // "welcome back ♡", if their wishes were waiting for them
  }

  function leave() {
    if (room.hidden) return;
    if (card.open) closeWish();
    window.clearTimeout(greetTimer);
    greeting.classList.remove('is-visible');
    window.clearTimeout(settleTimer);
    body.classList.remove('willow-settled');
    room.classList.remove('is-open');
    body.classList.remove('at-willow');
    gardenViewport.inert = false;
    instructionBar.inert = false;
    closeTimer = window.setTimeout(() => { room.hidden = true; }, 600);
    if (location.hash === '#garden' || location.hash === '') peek.focus({ preventScroll: true });
  }

  function sync() {
    if (location.hash === '#willow') enter();
    else leave();
  }

  function goBack() {
    if (enteredFromGarden) { enteredFromGarden = false; history.back(); }
    else location.hash = 'garden';
  }

  // ---- Little wishes: written at the desk, tied on with a ribbon, hung on the willow ---------
  // Up to eight, each on its own branch. Everything lives only in this page's memory: nothing is
  // saved, sent or shared, and only the visitor's own wishes are ever shown. (Remembering them
  // between visits comes next.)
  const deskButton = document.getElementById('wl-desk-btn');
  const deskTag = document.getElementById('wl-desk-tag');
  const card = document.getElementById('wl-wish');
  const text = document.getElementById('wl-wish-text');
  const count = document.getElementById('wl-wish-count');
  const writeView = document.getElementById('wl-wish-write');
  const previewView = document.getElementById('wl-wish-preview-view');
  const previewButton = document.getElementById('wl-wish-preview');
  const editButton = document.getElementById('wl-wish-edit');
  const hangButton = document.getElementById('wl-wish-hang');
  const noteText = document.getElementById('wl-note-text');
  const ribbonButtons = document.querySelectorAll('.wl-ribbon');
  const removeBox = document.getElementById('wl-wish-remove');
  const removeAsk = document.getElementById('wl-remove-ask');
  const removeConfirm = document.getElementById('wl-remove-confirm');
  const wishesBox = document.getElementById('wl-wishes');
  const toast = document.getElementById('wl-toast');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const LIMIT = 180;
  const FULL = 'your little willow is full of wishes ♡';
  const RIBBONS = {
    pink: ['#e3a9b0', '#c58a93'],
    sage: ['#a9bc94', '#7f9468'],
    butter: ['#f2d58f', '#c9a96a'],
    lavender: ['#c9b8de', '#9d89b8']
  };
  const BOW = '<svg viewBox="-24 -14 48 50" aria-hidden="true">' +
    '<path d="M0 0 C-14 -12 -26 -4 -20 6 C-15 13 -6 6 0 0 C6 6 15 13 20 6 C26 -4 14 -12 0 0 Z" fill="var(--ribbon)" stroke="var(--ribbon-edge)" stroke-width="1.4"/>' +
    '<path d="M-2 2 Q-10 20 -6 34 L-1 31 Q-4 18 3 4 Z M2 2 Q12 18 10 32 L5 30 Q6 18 -1 4 Z" fill="var(--ribbon)" stroke="var(--ribbon-edge)" stroke-width="1.1"/>' +
    '<circle r="4" fill="var(--ribbon-edge)"/></svg>';
  ribbonButtons.forEach((b) => { b.innerHTML = BOW; });

  // Where the wishes hang, in willow units: the knot on the branch (x, y), the length of its
  // ribbon string, a little tilt, and its own slow sway. Every note stays clear of the swing,
  // the hollow, the desk, the sign and the menus, and they fill in this order so that even a
  // few wishes are spread across the tree.
  const SLOTS = [
    { x: 500, y: 190, len: 70, tilt: -3, sway: 6.5 },      // the lower left limb
    { x: 1058, y: 200, len: 80, tilt: 2, sway: 7.2 },      // the lower right limb
    { x: 360, y: 207, len: 250, tilt: -2, sway: 5.9 },
    { x: 1180, y: 204, len: 230, tilt: 3, sway: 6.8 },
    { x: 1500, y: 70, len: 170, tilt: -1.5, sway: 7.6 },   // the tip of the high right limb
    { x: 590, y: 196, len: 260, tilt: 2.5, sway: 6.1 },
    { x: 1295, y: 222, len: 60, tilt: -2.5, sway: 7 },
    { x: 1405, y: 66, len: 360, tilt: 1.5, sway: 6.3 }
  ];
  const MAX = SLOTS.length;
  // a note's fixed markup (the visitor's words are only ever added as plain text)
  const NOTE = '<span class="wl-hung__swing"><span class="wl-hung__string" aria-hidden="true"></span>' +
    BOW.replace('<svg ', '<svg class="wl-hung__bow" ') +
    '<span class="wl-hung__note"><span class="wl-hung__text hand"></span><span class="wl-hung__sign hand" aria-hidden="true">♡</span></span></span>' +
    '<span class="prop-tag">read your wish ♡</span>';

  let wishes = [];            // the wishes on the willow: { slot, text, ribbon, el }
  let current = null;         // the wish open in the card, or null while writing a new one
  let wish = '';              // the words in the card
  let draft = '';             // a new wish, half written, kept while the card is closed
  let draftRibbon = 'pink';
  let chosenRibbon = 'pink';  // the ribbon chosen in the card
  let returnFocus = deskButton;
  let toastTimer;

  // ---- The willow remembers: wishes are kept in this browser only (localStorage) --------------
  // Each wish is saved with its words, its ribbon, its branch and an id. Nothing ever leaves the
  // visitor's browser. If storage isn't available, wishes simply stay until they leave.
  const SAVE_KEY = 'aDayInBloom.willow.v1';
  const privacyLine = document.getElementById('wl-wish-privacy');
  let canSave = (() => {
    try {
      localStorage.setItem(SAVE_KEY + '.test', '1');
      localStorage.removeItem(SAVE_KEY + '.test');
      return true;
    } catch (error) { return false; }
  })();

  function storageUnavailable() {
    canSave = false;
    privacyLine.textContent = 'just between you and the willow ♡ this browser can’t save wishes, so they’ll stay only until you leave';
  }

  // returns whether the wishes were really saved
  function saveWishes() {
    if (!canSave) return false;
    try {
      if (wishes.length) localStorage.setItem(SAVE_KEY, JSON.stringify({ wishes: wishes.map(({ id, slot, text: words, ribbon }) => ({ id, slot, text: words, ribbon })) }));
      else localStorage.removeItem(SAVE_KEY);
      return true;
    } catch (error) {
      storageUnavailable();
      return false;
    }
  }

  // the saved wishes, checked over: each on its own branch, never more than eight, never twice
  function loadWishes() {
    if (!canSave) return [];
    let saved;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (error) { return []; }
    if (!saved || !Array.isArray(saved.wishes)) return [];
    const slots = new Set();
    const ids = new Set();
    return saved.wishes.filter((w) => {
      const ok = w && typeof w.text === 'string' && w.text.trim() && Number.isInteger(w.slot) && w.slot >= 0 && w.slot < MAX &&
        !slots.has(w.slot) && typeof w.id === 'string' && !ids.has(w.id);
      if (ok) { slots.add(w.slot); ids.add(w.id); }
      return ok;
    }).slice(0, MAX).map((w) => ({ id: w.id, slot: w.slot, text: w.text.slice(0, LIMIT), ribbon: RIBBONS[w.ribbon] ? w.ribbon : 'pink', el: null }));
  }

  function newId() {
    return 'wish-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  const NOT_SAVED = 'hanging just for this visit ♡ (this browser can’t save it)';

  function say(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4200);
  }

  function updateCount() {
    count.textContent = `${text.value.length}/${LIMIT}`;
    count.classList.toggle('is-near', text.value.length >= LIMIT - 20);
    previewButton.disabled = !text.value.trim();
  }

  function updateHangLabel() {
    const changed = current && (current.text !== wish || current.ribbon !== chosenRibbon);
    hangButton.textContent = !current ? 'hang my wish ♡' : changed ? 'hang my changes ♡' : 'keep it hanging ♡';
  }

  function selectRibbon(key) {
    chosenRibbon = RIBBONS[key] ? key : 'pink';
    if (!current) draftRibbon = chosenRibbon;
    ribbonButtons.forEach((b) => b.setAttribute('aria-checked', String(b.dataset.ribbon === chosenRibbon)));
    updateHangLabel();
  }

  // the desk invites another wish, until all eight branches are taken
  function updateDesk() {
    const full = wishes.length >= MAX;
    deskTag.textContent = full ? FULL : wishes.length ? 'leave another wish ♡' : 'leave a little wish ♡';
    deskButton.setAttribute('aria-label', 'Writing desk: ' + (full ? 'your little willow is full of wishes' : wishes.length ? 'leave another wish' : 'leave a little wish'));
  }

  function showWriting(focus) {
    previewView.hidden = true;
    writeView.hidden = false;
    text.value = wish;
    updateCount();
    if (focus) text.focus({ preventScroll: true });
  }

  function showPreview(quiet) {
    wish = text.value.trim().slice(0, LIMIT) || wish;
    if (!wish) return;
    noteText.textContent = wish;   // always as plain text, never as markup
    writeView.hidden = true;
    previewView.hidden = false;
    updateHangLabel();
    removeBox.hidden = !current;
    removeAsk.hidden = false;
    removeConfirm.hidden = true;
    if (!quiet) sfx('pageFlip');
    editButton.focus({ preventScroll: true });
  }

  // on phones, keep the card within the space above the keyboard
  function fitToKeyboard() {
    if (!window.visualViewport) return;
    card.style.setProperty('--vvh', Math.round(window.visualViewport.height) + 'px');
  }

  function showCard() {
    sfx('seed');   // a delicate paper rustle
    fitToKeyboard();
    if (typeof card.showModal === 'function') card.showModal();
    else card.setAttribute('open', '');
  }

  // the desk: a fresh card for a new wish (or the one half written before)
  function openNew() {
    if (wishes.length >= MAX) {
      sfx('seed');
      say(FULL);
      return;
    }
    current = null;
    returnFocus = deskButton;
    wish = draft;
    selectRibbon(draftRibbon);
    showWriting(false);
    showCard();
    text.focus({ preventScroll: true });
  }

  // a hanging note: open it, ready to read, edit, re-ribbon or take down
  function openWish(w) {
    current = w;
    returnFocus = w.el;
    wish = w.text;
    text.value = wish;
    selectRibbon(w.ribbon);
    showCard();
    showPreview(true);
  }

  function closeWish() {
    if (!card.open) return;
    if (!current && !writeView.hidden) draft = text.value;   // keep a half-written wish for now
    if (typeof card.close === 'function') card.close();
    else { card.removeAttribute('open'); card.dispatchEvent(new Event('close')); }
  }

  function makeNote(w) {
    const s = SLOTS[w.slot];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'wl-hung';
    el.setAttribute('aria-haspopup', 'dialog');
    el.setAttribute('aria-controls', 'wl-wish');
    // it floats up from the paper on the desk to its own branch
    el.style.cssText = `--x:${s.x}; --y:${s.y}; --len:${s.len}; --tilt:${s.tilt}deg; --sway:${s.sway}s; --delay:${r1(-w.slot * 0.9)}s; ` +
      `--from-x:${r1((1110 - s.x) / 16)}cqw; --from-y:${r1((660 - s.y - s.len - 80) / 16)}cqw`;
    el.innerHTML = NOTE;
    el.addEventListener('click', () => openWish(w));
    wishesBox.appendChild(el);
    return el;
  }

  function dressNote(w) {
    w.el.querySelector('.wl-hung__text').textContent = w.text;   // plain text only
    w.el.setAttribute('aria-label', 'Your wish, hanging on the willow: ' + w.text);
    const [fill, edge] = RIBBONS[w.ribbon];
    w.el.style.setProperty('--ribbon', fill);
    w.el.style.setProperty('--ribbon-edge', edge);
  }

  // on a narrow screen the branch can be off to one side: glide over so the wish is in view
  function showNote(el) {
    const box = el.getBoundingClientRect();
    if (box.left >= 0 && box.right <= viewport.clientWidth) return;
    const left = viewport.scrollLeft + box.left + box.width / 2 - viewport.clientWidth / 2;
    viewport.scrollTo({ left: Math.max(0, left), behavior: calm.matches ? 'auto' : 'smooth' });
  }

  // hang the wish: the card closes and the note floats up to its branch, then is tied on
  function hangWish() {
    if (!wish) return;
    if (current) {
      const w = current;
      const same = w.text === wish && w.ribbon === chosenRibbon;
      w.text = wish;
      w.ribbon = chosenRibbon;
      returnFocus = w.el;
      closeWish();
      if (same) return;   // "keep it hanging ♡"
      const kept = saveWishes();
      dressNote(w);
      w.el.classList.remove('is-updated');
      void w.el.offsetWidth;
      w.el.classList.add('is-updated');
      showNote(w.el);
      sfx('wish');
      say(kept ? 'your wish has been updated ♡' : 'your changes are ' + NOT_SAVED);
      return;
    }
    const slot = SLOTS.findIndex((s, i) => !wishes.some((w) => w.slot === i));
    if (slot < 0) { closeWish(); say(FULL); return; }
    const w = { id: newId(), slot, text: wish, ribbon: chosenRibbon, el: null };
    w.el = makeNote(w);
    wishes.push(w);
    const kept = saveWishes();
    dressNote(w);
    draft = '';
    draftRibbon = 'pink';
    returnFocus = w.el;
    closeWish();
    updateDesk();
    sfx('seed');   // the leaves rustle as it rises
    w.el.classList.add('is-arriving');
    showNote(w.el);
    window.setTimeout(() => {
      w.el.classList.remove('is-arriving');   // the string unrolls and the bow is tied
      sfx('wish');
      window.setTimeout(() => {
        w.el.classList.add('is-swaying');
        say(kept ? 'your wish has found a home ♡' : 'your wish is ' + NOT_SAVED);
        if (wishes.length >= MAX) window.setTimeout(() => say(FULL), 4400);
      }, calm.matches ? 0 : 500);
    }, calm.matches ? 0 : 2600);
  }

  // take this wish down (after a gentle second step)
  function takeDown() {
    const w = current;
    if (!w) return;
    wishes = wishes.filter((other) => other !== w);
    saveWishes();
    current = null;
    wish = '';
    returnFocus = deskButton;
    closeWish();
    updateDesk();
    sfx('seed');
    w.el.classList.add('is-leaving');
    window.setTimeout(() => w.el.remove(), calm.matches ? 0 : 850);
    say('your wish has been gently taken down ♡');
  }

  deskButton.addEventListener('click', openNew);
  text.addEventListener('input', () => { wish = text.value; if (!current) draft = wish; updateCount(); });
  // keep the line being written in view above a phone keyboard
  text.addEventListener('focus', () => window.setTimeout(() => text.scrollIntoView({ block: 'nearest' }), 300));
  previewButton.addEventListener('click', () => showPreview(false));
  editButton.addEventListener('click', () => showWriting(true));
  hangButton.addEventListener('click', hangWish);
  ribbonButtons.forEach((b) => b.addEventListener('click', () => { selectRibbon(b.dataset.ribbon); sfx('seed'); }));
  // arrow keys move between ribbons, like any set of radio buttons
  document.getElementById('wl-ribbons').addEventListener('keydown', (event) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    event.preventDefault();
    const keys = Object.keys(RIBBONS);
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    selectRibbon(keys[(keys.indexOf(chosenRibbon) + step + keys.length) % keys.length]);
    card.querySelector(`.wl-ribbon[data-ribbon="${chosenRibbon}"]`).focus();
  });
  removeAsk.addEventListener('click', () => { removeAsk.hidden = true; removeConfirm.hidden = false; document.getElementById('wl-remove-no').focus(); });
  document.getElementById('wl-remove-no').addEventListener('click', () => { removeConfirm.hidden = true; removeAsk.hidden = false; removeAsk.focus(); });
  document.getElementById('wl-remove-yes').addEventListener('click', takeDown);
  card.querySelectorAll('[data-wish-close]').forEach((b) => b.addEventListener('click', closeWish));
  card.addEventListener('click', (event) => { if (event.target === card) closeWish(); });
  card.addEventListener('keydown', (event) => { if (event.key === 'Escape') event.stopPropagation(); });   // closes only the card
  card.addEventListener('close', () => {
    if (room.hidden) return;
    const target = returnFocus && returnFocus.isConnected ? returnFocus : deskButton;
    target.focus({ preventScroll: true });
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { if (card.open) fitToKeyboard(); });
  selectRibbon('pink');

  // welcome back: each saved wish returns to its own branch, with its own words and ribbon
  if (!canSave) storageUnavailable();
  wishes = loadWishes();
  wishes.forEach((w) => {
    w.el = makeNote(w);
    dressNote(w);
    w.el.classList.add('is-swaying');
  });
  updateDesk();
  const greeting = document.getElementById('wl-greeting');
  let greetPending = wishes.length > 0;   // only when wishes really were restored, once per visit
  let greetTimer;
  function greet() {
    if (!greetPending) return;
    greetPending = false;
    window.clearTimeout(greetTimer);
    greetTimer = window.setTimeout(() => {
      greeting.classList.add('is-visible');
      greetTimer = window.setTimeout(() => greeting.classList.remove('is-visible'), 7000);
    }, calm.matches ? 300 : 1400);
  }

  // ---- The rope swing: it sways in the breeze; a click sends it a little higher ----------------
  const swing = document.getElementById('wl-swing');
  swing.addEventListener('click', () => {
    sfx('swing');
    swing.classList.remove('is-pushed');
    void swing.offsetWidth;
    swing.classList.add('is-pushed');
  });
  swing.addEventListener('animationend', (event) => { if (event.animationName === 'wl-swing-push') swing.classList.remove('is-pushed'); });

  peek.addEventListener('click', () => {
    sfx('seed');   // a soft rustle as you part the branches
    enteredFromGarden = true;
    location.hash = 'willow';
  });
  back.addEventListener('click', goBack);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !room.hidden && !document.querySelector('dialog[open]')) goBack();
  });

  window.addEventListener('hashchange', sync);
  sync();
})();
