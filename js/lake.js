/* ==========================================================================
   A Day in Bloom · A Few Thoughts from the Lake
   Clicking the lake in the garden steps down to a little Muskoka dock (#lake).
   "take a little ride ♡" rows the boat to five quiet spots; at each one a
   bobber nibbles, one tap reels in a fish, and its card holds a thought about
   Interior Design. After the fifth, the boat drifts home and a message in a
   bottle floats up to the dock.

   No timing games: every catch is a single tap (or Enter), and visitors can
   skip the ride or read all five thoughts at once. The scenery is painted on
   the first visit, and all movement is CSS (styles in css/lake.css).
   ========================================================================== */

/* ✿ THE FIVE THOUGHTS ✿  (shown in this order, one per catch) */
const LAKE_THOUGHTS = [
  {
    title: 'More than a pretty room',
    text: 'A beautiful space is lovely, but that’s only the beginning. Interior design is about how people move, feel, live, and experience the spaces around them.',
    fish: 'sunfish'
  },
  {
    title: 'What’s in a name?',
    text: 'Some believe Interior Architecture is a better name for our profession. I understand why. It communicates that there’s much more to our work than choosing colours and furniture.',
    fish: 'perch'
  },
  {
    title: 'Why I believe in design',
    text: 'But I’ve never thought the word design needed replacing. To me, it represents creativity, problem-solving, technical knowledge, and the responsibility of making spaces better for people.',
    fish: 'bass'
  },
  {
    title: 'Changing the conversation',
    text: 'Rather than changing our title, I’d rather show people what happens behind the beautiful spaces: the drawings, planning, accessibility, safety, and careful decisions that make design meaningful.',
    fish: 'shiner'
  },
  {
    title: 'The future I’d love to see',
    text: 'I hope for a future where Interior Design is recognized for everything it contributes—not just how a space looks, but how it supports the people who experience it.',
    fish: 'koi'
  }
];

(function () {
  'use strict';

  const body = document.body;
  const room = document.getElementById('lake-room');
  const peek = document.getElementById('lake-peek');
  if (!room || !peek) return;

  const viewport = document.getElementById('lake-viewport');
  const scene = document.getElementById('lake-scene');
  const boat = document.getElementById('lk-boat');
  const line = document.querySelector('.lk-line');
  const linePath = document.getElementById('lk-line');
  const bobber = document.getElementById('lk-bobber');
  const jump = document.getElementById('lk-jump');
  const bottle = document.getElementById('lk-bottle');
  const status = document.getElementById('lk-status');
  const rideButton = document.getElementById('lk-ride');
  const skipButton = document.getElementById('lk-skip');
  const readButton = document.getElementById('lk-read');
  const backButton = document.getElementById('lk-back');
  const catchCard = document.getElementById('lk-catch');
  const noteCard = document.getElementById('lk-note');
  const listCard = document.getElementById('lk-thoughts');
  const gardenViewport = document.getElementById('garden-viewport');
  const instructionBar = document.getElementById('instruction-bar');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  // soft sounds (js/sound.js); silent unless the visitor has turned sound on
  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };

  // ---- Little helpers ----------------------------------------------------------
  let seed = 7331;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const between = (min, max) => min + random() * (max - min);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const r1 = (n) => Math.round(n * 10) / 10;

  // ---- The fish: five freshwater friends, each its own colour ---------------------------
  const FISH = {
    sunfish: { back: '#6f8f3a', belly: '#eea54c', fin: '#9db35a', h: 17 },   // pumpkinseed
    perch:   { back: '#71842f', belly: '#ece27e', fin: '#e27d4c', h: 14 },   // yellow perch
    bass:    { back: '#4e6a2a', belly: '#e6e2b2', fin: '#7d9046', h: 15 },   // largemouth bass
    shiner:  { back: '#5c7ea2', belly: '#eef2f5', fin: '#ebc44e', h: 10 },   // silver shiner
    koi:     { back: '#efae95', belly: '#fde8da', fin: '#f6cdb9', h: 15 }    // a dreamy pastel koi
  };
  let fishCount = 0;

  function fishSVG(kind) {
    const f = FISH[kind];
    const h = f.h;
    const id = 'lk-fish-' + (++fishCount);
    const top = 35 - h;
    const bottom = 35 + h;
    const bodyPath = `M26 35 C36 ${top - 4} 92 ${top - 6} 124 34 C121 38 118 40 114 41 C96 ${bottom + 5} 40 ${bottom + 4} 26 35 Z`;
    let s = `<svg viewBox="0 0 140 70" aria-hidden="true"><defs>` +
      `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f.back}"/><stop offset=".9" stop-color="${f.belly}"/></linearGradient>` +
      `<clipPath id="${id}-c"><path d="${bodyPath}"/></clipPath></defs>`;
    // tail, back fin and belly fin
    s += `<path d="M30 35 C22 28 14 ${top + 2} 5 ${top - 2} C11 29 11 41 5 ${bottom + 2} C14 ${bottom - 2} 22 42 30 35 Z" fill="${f.fin}"/>`;
    s += `<path d="M46 ${top + 3} C56 ${top - 13} 82 ${top - 13} 98 ${top + 3} Z" fill="${f.fin}"/>`;
    s += `<path d="M76 ${bottom - 3} C82 ${bottom + 8} 94 ${bottom + 6} 98 ${bottom - 3} Z" fill="${f.fin}"/>`;
    if (kind === 'perch' || kind === 'bass') {
      s += `<path d="M52 ${top} V${top - 7} M60 ${top - 2} V${top - 10} M68 ${top - 3} V${top - 11} M76 ${top - 3} V${top - 10} M84 ${top - 2} V${top - 8}" stroke="#3f4a24" stroke-width="1" opacity=".5"/>`;
    }
    s += `<path d="${bodyPath}" fill="url(#${id})"/>`;
    // markings, kept inside the body
    s += `<g clip-path="url(#${id}-c)">`;
    if (kind === 'sunfish') {
      s += '<path d="M100 29 q6 -3 12 0 M99 35 q7 -3 14 0 M101 41 q5 -2 10 0" fill="none" stroke="#4fa3ad" stroke-width="1.6"/>';
      for (let i = 0; i < 9; i++) s += `<circle cx="${r1(40 + i * 7 + (i % 2) * 3)}" cy="${r1(28 + (i % 3) * 6)}" r="1.6" fill="#f2a24a" opacity=".85"/>`;
      s += '<ellipse cx="100" cy="33" rx="3.2" ry="2.4" fill="#2f3b2a"/><circle cx="101" cy="32.4" r=".9" fill="#d9573e"/>';
    } else if (kind === 'perch') {
      for (let x = 44; x <= 94; x += 10) s += `<path d="M${x} ${top - 2} Q${x + 3} 33 ${x - 1} ${36 + h * 0.4}" stroke="#46521f" stroke-width="5" stroke-linecap="round" fill="none" opacity=".5"/>`;
    } else if (kind === 'bass') {
      s += '<path d="M32 37 C46 33 54 38 66 35 C78 32 88 37 100 34 C106 33 112 34 118 33" fill="none" stroke="#33461a" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="9 3" opacity=".55"/>';
      s += '<ellipse cx="76" cy="27" rx="38" ry="6" fill="#3f5a20" opacity=".25"/>';
    } else if (kind === 'shiner') {
      s += '<path d="M30 35 Q76 32 120 34" stroke="#3f5f80" stroke-width="1.4" fill="none" opacity=".7"/>';
      s += '<path d="M40 31 Q78 26 112 30" stroke="#ffffff" stroke-width="3" fill="none" opacity=".45"/>';
    } else if (kind === 'koi') {
      [[48, 30, '#e48fa6'], [66, 38, '#9fc5dc'], [84, 28, '#e48fa6'], [58, 24, '#f3d38a'], [96, 38, '#9fc5dc']].forEach(([x, y, c]) => {
        for (let p = 0; p < 5; p++) {
          const a = p * 72 * Math.PI / 180;
          s += `<circle cx="${r1(x + Math.cos(a) * 3)}" cy="${r1(y + Math.sin(a) * 3)}" r="2.4" fill="${c}" opacity=".8"/>`;
        }
        s += `<circle cx="${x}" cy="${y}" r="1.6" fill="#e8c27a"/>`;
      });
      for (let x = 40; x < 110; x += 9) s += `<path d="M${x} 44 a4 4 0 0 1 8 0" fill="none" stroke="#e8c27a" stroke-width=".9" opacity=".7"/>`;
    }
    s += '</g>';
    // fin, gill, eye and smile
    s += `<ellipse cx="96" cy="41" rx="9" ry="3.8" transform="rotate(25 96 41)" fill="${f.fin}" opacity=".9"/>`;
    s += '<ellipse cx="74" cy="41" rx="30" ry="3.6" fill="#ffffff" opacity=".2"/>';
    s += '<path d="M104 25 Q99 35 105 45" fill="none" stroke="#2f2a24" stroke-width="1" opacity=".35"/>';
    s += '<circle cx="113" cy="31" r="4.4" fill="#fffaf0"/><circle cx="113.6" cy="31" r="2.7" fill="#2a2622"/><circle cx="112.6" cy="30" r=".9" fill="#ffffff"/>';
    s += kind === 'bass'
      ? '<path d="M124 34 Q116 38 110 36" fill="none" stroke="#2f2a24" stroke-width="1.2"/>'
      : '<path d="M124 34 q-3 2 -7 1.2" fill="none" stroke="#2f2a24" stroke-width="1"/>';
    return s + '</svg>';
  }

  // ---- Little drawings: boat, bobber, bottle, ducks, loon, dragonfly, lantern -------------
  // the rowboat, seen from the side and a little above: bow on the right
  const BOAT_SVG = '<svg viewBox="0 0 220 110" aria-hidden="true">' +
    '<ellipse cx="110" cy="100" rx="108" ry="7" fill="#3d5e5f" opacity=".22"/>' +
    // the inside of the hull, with the far gunwale showing
    '<path d="M10 54 C60 38 160 30 212 38 L206 30 C150 20 60 24 14 42 Z" fill="#e6d6ba"/>' +
    '<path d="M14 42 C60 24 150 20 206 30" fill="none" stroke="#b48c62" stroke-width="3.5" stroke-linecap="round"/>' +
    // two wooden seats across the boat
    '<path d="M64 47 L84 44 L88 30 L68 32 Z M138 41 L156 39 L159 27 L141 28 Z" fill="#b48c62"/>' +
    '<path d="M66 44 L86 41 M140 38 L157 36" stroke="#d6b48a" stroke-width="1.2"/>' +
    // the hull: cream, with a sage stripe and a wooden gunwale
    '<path d="M8 56 L214 40 Q206 80 168 96 L62 98 Q20 94 8 56 Z" fill="#f4efe4"/>' +
    '<path d="M14 68 Q110 74 206 56" fill="none" stroke="#9db08b" stroke-width="7"/>' +
    '<path d="M18 80 Q110 86 194 70" fill="none" stroke="#e3d9c6" stroke-width="2.4"/>' +
    '<path d="M60 96 Q110 100 168 94" fill="none" stroke="#d9cfba" stroke-width="2"/>' +
    '<path d="M8 56 L214 40" stroke="#a5845f" stroke-width="5.5" stroke-linecap="round"/>' +
    '<path d="M10 54.4 L212 38.6" stroke="#d6b48a" stroke-width="1.4"/>' +
    // oars resting in their oarlocks
    '<circle cx="78" cy="49" r="2.6" fill="#8d979b"/><circle cx="150" cy="44" r="2.6" fill="#8d979b"/>' +
    '<path d="M98 38 L44 104 M130 34 L190 102" stroke="#9a7b58" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="41" cy="106" rx="13" ry="4" transform="rotate(-50 41 106)" fill="#c9a77c"/>' +
    '<ellipse cx="193" cy="104" rx="13" ry="4" transform="rotate(48 193 104)" fill="#c9a77c"/>' +
    // a ring on the bow for the mooring line, and a pink pennant
    '<circle cx="212" cy="46" r="3.4" fill="none" stroke="#8d979b" stroke-width="1.6"/>' +
    '<path d="M208 40 V18" stroke="#8a7d6c" stroke-width="2"/><path d="M208 18 L226 23 L208 29 Z" fill="#efbcc4"/>' +
    '</svg>';
  const BOBBER_SVG = '<svg viewBox="0 0 30 40" aria-hidden="true">' +
    '<ellipse cx="15" cy="34" rx="13" ry="3.4" fill="#ffffff" opacity=".45"/>' +
    '<path d="M15 2 V8" stroke="#6b4f3a" stroke-width="1.6"/>' +
    '<circle cx="15" cy="20" r="11" fill="#fffaf0"/>' +
    '<path d="M4 20 A11 11 0 0 1 26 20 Z" fill="#e0607a"/>' +
    '<path d="M4 20 H26" stroke="#b74a62" stroke-width="1"/>' +
    '<circle cx="11" cy="14" r="2.4" fill="#ffffff" opacity=".7"/></svg>';

  // a glass bottle with a cork, and a little rolled-up letter inside tied with pink ribbon
  const BOTTLE_SVG = '<svg viewBox="0 0 100 60" aria-hidden="true">' +
    '<ellipse cx="50" cy="50" rx="44" ry="6" fill="#ffffff" opacity=".3"/>' +
    '<ellipse cx="50" cy="48" rx="34" ry="3.5" fill="#3f6466" opacity=".18"/>' +
    '<g transform="rotate(-10 50 30)">' +
    '<path d="M8 30 Q8 16 22 16 L66 16 Q74 16 77 21 L87 23 L87 35 L77 37 Q74 42 66 42 L22 42 Q8 42 8 32 Z" fill="#d3e9e2" fill-opacity=".72" stroke="#ffffff" stroke-width="1.8"/>' +
    '<path d="M10 34 Q10 42 22 42 L66 42 Q72 42 75 38 Z" fill="#a9cfc8" fill-opacity=".45"/>' +
    '<rect x="85" y="21.5" width="10" height="15" rx="2.4" fill="#b48c62"/>' +
    '<path d="M88 22 v14 M92 22 v14" stroke="#9b7552" stroke-width=".8"/>' +
    // the rolled letter: a paper scroll with curled ends and a few lines of writing
    '<rect x="24" y="22" width="38" height="13" rx="6.5" fill="#f8f0dc" stroke="#d9c3a0" stroke-width="1"/>' +
    '<ellipse cx="24.5" cy="28.5" rx="3.2" ry="6.5" fill="#efe2c6" stroke="#d9c3a0" stroke-width="1"/>' +
    '<ellipse cx="24.5" cy="28.5" rx="1.2" ry="3" fill="#e2cfa8"/>' +
    '<path d="M30 26 h7 M31 30.5 h5 M49 26 h9 M50 30.5 h7" stroke="#c9a57a" stroke-width="1" stroke-linecap="round"/>' +
    '<rect x="41" y="21.5" width="4" height="14" rx="1" fill="#e3a9b0"/>' +
    '<path d="M43 22 C38 17 35 20 38.5 22.5 Z M43 22 C48 17 51 20 47.5 22.5 Z" fill="#e3a9b0" stroke="#c58a93" stroke-width=".8"/>' +
    '<path d="M16 21 Q32 18.5 50 19" stroke="#ffffff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>' +
    '<path d="M70 20 l3 2" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g></svg>';

  function duckSVG(baby) {
    if (baby) {
      return '<svg viewBox="0 0 30 22" aria-hidden="true">' +
        '<ellipse cx="14" cy="19" rx="13" ry="2.4" fill="#ffffff" opacity=".35"/>' +
        '<ellipse cx="13" cy="15" rx="10" ry="5.5" fill="#f2d27a"/>' +
        '<path d="M5 13 Q9 10 15 12" fill="none" stroke="#c99a3e" stroke-width="1.4"/>' +
        '<g class="lk-duck__head"><circle cx="22" cy="9" r="5" fill="#f4d886"/><path d="M18 7 Q22 4 26 7" fill="#a07a45"/>' +
        '<path d="M26 9.5 L30 10.5 L26 11.6 Z" fill="#e39a4a"/><circle cx="23.4" cy="8.6" r=".9" fill="#2a2622"/></g></svg>';
    }
    return '<svg viewBox="0 0 72 46" aria-hidden="true">' +
      '<ellipse cx="34" cy="41" rx="34" ry="4" fill="#ffffff" opacity=".35"/>' +
      '<path d="M4 30 Q2 22 10 22 L46 20 Q60 22 58 32 Q54 40 34 40 L12 40 Q4 38 4 30 Z" fill="#9c7a55"/>' +
      '<path d="M12 26 Q26 20 46 24 Q40 32 22 32 Z" fill="#7d5f42"/>' +
      '<path d="M30 28 h10" stroke="#6b8fc0" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M14 30 q4 -2 8 0 M20 34 q4 -2 8 0 M30 33 q4 -2 8 0" fill="none" stroke="#6b5240" stroke-width="1" opacity=".6"/>' +
      '<g class="lk-duck__head"><path d="M50 26 Q54 12 58 10" stroke="#9c7a55" stroke-width="7" stroke-linecap="round" fill="none"/>' +
      '<circle cx="59" cy="10" r="7" fill="#8a6a4a"/><path d="M53 8 L66 9" stroke="#5e4630" stroke-width="1.6"/>' +
      '<path d="M65 11 L72 13 L65 15 Z" fill="#e39a4a"/><circle cx="61" cy="8.6" r="1.1" fill="#1f1a16"/></g></svg>';
  }

  // a white swan with a long curved neck, facing right, with soft ripples around her
  const SWAN_SVG = '<svg viewBox="0 0 100 74" aria-hidden="true">' +
    '<g class="lk-swan__ripples" fill="none" stroke="#ffffff" stroke-linecap="round" opacity=".7">' +
    '<path d="M6 68 Q50 74 94 68" stroke-width="1.6"/><path d="M14 72 Q50 77 86 72" stroke-width="1.1" opacity=".6"/></g>' +
    '<ellipse cx="48" cy="66" rx="40" ry="4" fill="#3d5e5f" opacity=".18"/>' +
    // body, folded wings and a lifted tail
    '<path d="M8 46 Q4 36 12 34 Q22 42 34 42 L66 42 Q80 44 82 54 Q80 64 60 66 L26 66 Q10 64 8 46 Z" fill="#fbfaf6"/>' +
    '<g class="lk-swan__wing"><path d="M22 44 Q40 30 62 40 Q56 56 32 56 Q24 54 22 44 Z" fill="#efece4"/>' +
    '<path d="M28 46 q8 -4 16 -2 M32 50 q8 -4 16 -2 M38 54 q8 -3 14 -1" fill="none" stroke="#d9d4c8" stroke-width="1.2"/></g>' +
    // the long, curved neck and her head (they dip together, from the base of the neck)
    '<g class="lk-swan__neck"><path d="M68 46 C76 34 66 24 66 16 C66 8 74 4 80 8" fill="none" stroke="#fbfaf6" stroke-width="8" stroke-linecap="round"/>' +
    '<path d="M70 44 C76 34 68 26 68 18" fill="none" stroke="#e9e5dc" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="80" cy="10" r="6" fill="#fbfaf6"/>' +
    '<path d="M84 8 L96 14 L85 15 Z" fill="#ec9a52"/><path d="M83 7 Q86 6 87 9 L84 11 Z" fill="#2f2a26"/>' +
    '<circle cx="81" cy="8.6" r="1.1" fill="#1f1a16"/></g></svg>';

  // a little green frog sitting on a lily pad, facing you
  const FROG_SVG = '<svg viewBox="0 0 40 32" aria-hidden="true">' +
    '<ellipse cx="20" cy="29" rx="17" ry="3" fill="#3f6a5c" opacity=".25"/>' +
    '<path d="M4 27 Q2 20 8 19 Q12 24 10 28 Z M36 27 Q38 20 32 19 Q28 24 30 28 Z" fill="#6f9a4a"/>' +
    '<ellipse cx="20" cy="20" rx="13" ry="9" fill="#7fae52"/>' +
    '<ellipse class="lk-frog__throat" cx="20" cy="24.5" rx="5" ry="2.6" fill="#e8f0c8"/>' +
    '<ellipse cx="20" cy="23" rx="8" ry="4.2" fill="#c9de9a" opacity=".55"/>' +
    '<path d="M12 21 Q20 25 28 21" fill="none" stroke="#4f7a36" stroke-width="1.1" stroke-linecap="round"/>' +
    '<circle cx="12" cy="12" r="5" fill="#7fae52"/><circle cx="28" cy="12" r="5" fill="#7fae52"/>' +
    '<circle cx="12" cy="11.5" r="3.4" fill="#fffaf0"/><circle cx="28" cy="11.5" r="3.4" fill="#fffaf0"/>' +
    '<circle cx="12.4" cy="11.8" r="2" fill="#2a2622"/><circle cx="27.6" cy="11.8" r="2" fill="#2a2622"/>' +
    '<circle cx="11.6" cy="11" r=".7" fill="#ffffff"/><circle cx="26.8" cy="11" r=".7" fill="#ffffff"/>' +
    '<g class="lk-frog__lids" fill="#6f9a4a"><ellipse cx="12" cy="10" rx="3.8" ry="3"/><ellipse cx="28" cy="10" rx="3.8" ry="3"/></g>' +
    '<circle cx="9" cy="18" r="1.3" fill="#5f8a3e" opacity=".6"/><circle cx="31" cy="18" r="1.3" fill="#5f8a3e" opacity=".6"/>' +
    '<circle cx="15" cy="17" r=".9" fill="#ef9aa8" opacity=".6"/><circle cx="25" cy="17" r=".9" fill="#ef9aa8" opacity=".6"/></svg>';

  // sitting in the rowboat, looking out over the bow: the inside of the hull, two seats,
  // your fishing rod reaching over the water, and a little tackle box at your feet
  const POV_BOAT_SVG = '<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
    // the outside of the hull, just visible below the gunwales: cream with the sage stripe
    '<path d="M250 1000 L790 748 L810 748 L1350 1000 Z" fill="#f4efe4"/>' +
    '<path d="M300 1000 L792 758 M1300 1000 L808 758" stroke="#9db08b" stroke-width="14"/>' +
    // the inside of the hull, warm wood, with ribs and floorboards
    '<path d="M340 1000 L792 738 L808 738 L1260 1000 Z" fill="#e6d6ba"/>' +
    '<path d="M560 1000 L798 760 M660 1000 L799 760 M760 1000 L800 760 M860 1000 L801 760 M960 1000 L802 760 M1060 1000 L803 760" stroke="#d2bd98" stroke-width="2.4"/>' +
    '<g fill="none" stroke="#c9ad82" stroke-width="5" opacity=".75">' +
    '<path d="M470 925 Q800 960 1130 925"/><path d="M560 872 Q800 898 1040 872"/><path d="M650 822 Q800 840 950 822"/></g>' +
    // two wooden seats across the boat
    '<path d="M520 868 L1080 868 L1100 900 L500 900 Z" fill="#b48c62"/><path d="M500 900 L1100 900 L1100 912 L500 912 Z" fill="#8c6a4a"/>' +
    '<path d="M528 878 H1072" stroke="#d6b48a" stroke-width="2"/>' +
    '<path d="M676 796 L924 796 L934 814 L666 814 Z" fill="#b48c62"/><path d="M666 814 L934 814 L934 821 L666 821 Z" fill="#8c6a4a"/>' +
    // the gunwales: thick wooden rails meeting at the bow
    '<path d="M300 1000 L796 734" stroke="#a5845f" stroke-width="30" stroke-linecap="round"/>' +
    '<path d="M1300 1000 L804 734" stroke="#a5845f" stroke-width="30" stroke-linecap="round"/>' +
    '<path d="M296 990 L794 728 M1304 990 L806 728" stroke="#d6b48a" stroke-width="5" stroke-linecap="round"/>' +
    // the bow: a little stem post, a ring and the pink pennant
    '<path d="M792 740 L800 700 L808 740 Z" fill="#8c6a4a"/>' +
    '<circle cx="800" cy="726" r="6" fill="none" stroke="#8d979b" stroke-width="2.4"/>' +
    '<path d="M800 702 V640" stroke="#8a7d6c" stroke-width="3"/><path d="M800 640 L840 652 L800 666 Z" fill="#efbcc4"/>' +
    // oars shipped along the gunwales
    '<path d="M330 1000 L560 870 M1270 1000 L1040 870" stroke="#9a7b58" stroke-width="12" stroke-linecap="round"/>' +
    '<ellipse cx="575" cy="862" rx="34" ry="10" transform="rotate(-29 575 862)" fill="#c9a77c"/>' +
    '<ellipse cx="1025" cy="862" rx="34" ry="10" transform="rotate(29 1025 862)" fill="#c9a77c"/>' +
    // a little tackle box on the front seat, lid open, with colourful bobbers and a wildflower tucked in
    '<g transform="translate(686 768) scale(.8)">' +
    '<path d="M0 0 L104 0 L98 46 L6 46 Z" fill="#9db08b"/><path d="M0 0 L104 0 L98 10 L6 10 Z" fill="#86996f"/>' +
    '<path d="M2 0 L102 0 L96 -30 L8 -30 Z" fill="#b5c4a5"/><path d="M14 -6 H90" stroke="#86996f" stroke-width="2"/>' +
    '<rect x="46" y="16" width="12" height="9" rx="2" fill="#c9a96a"/>' +
    '<g><circle cx="22" cy="-4" r="7" fill="#fffaf0"/><path d="M15 -4 A7 7 0 0 1 29 -4 Z" fill="#e0607a"/></g>' +
    '<g><circle cx="42" cy="-6" r="6" fill="#fffaf0"/><path d="M36 -6 A6 6 0 0 1 48 -6 Z" fill="#f2c94c"/></g>' +
    '<g><circle cx="60" cy="-4" r="6.5" fill="#fffaf0"/><path d="M53.5 -4 A6.5 6.5 0 0 1 66.5 -4 Z" fill="#8fb3cf"/></g>' +
    '<path d="M96 6 Q104 -14 100 -30" stroke="#6f8a58" stroke-width="2" fill="none"/>' +
    '<use href="#bloom-daisy" transform="translate(100 -32) scale(1.5)"/>' +
    '<use href="#bloom-cosmos" transform="translate(88 -20) scale(1.1)" style="color:#efbcc4"/></g>' +
    // your fishing rod, held just out of view, reaching out over the bow
    '<path d="M1060 1010 L884 556" stroke="#5e4630" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M960 800 L884 556" stroke="#6b4f3a" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M1046 974 L1028 928" stroke="#c9a77c" stroke-width="14" stroke-linecap="round"/>' +
    '<circle cx="1018" cy="902" r="16" fill="#8d979b"/><circle cx="1018" cy="902" r="7" fill="#c3c9ca"/>' +
    '<g fill="none" stroke="#8d979b" stroke-width="2"><circle cx="960" cy="752" r="5"/><circle cx="930" cy="674" r="4"/><circle cx="906" cy="612" r="3"/></g>' +
    '</svg>';

  const LOON_SVG ='<svg viewBox="0 0 56 26" aria-hidden="true">' +
    '<ellipse cx="26" cy="23" rx="26" ry="2.6" fill="#ffffff" opacity=".35"/>' +
    '<path d="M2 18 Q4 12 14 12 L36 12 Q44 13 42 20 Q38 22 26 22 L8 22 Q2 21 2 18 Z" fill="#2c3230"/>' +
    '<g fill="#e9ecea" opacity=".85"><circle cx="14" cy="15" r=".9"/><circle cx="19" cy="14.6" r=".9"/><circle cx="24" cy="15" r=".9"/><circle cx="29" cy="14.6" r=".9"/><circle cx="17" cy="18" r=".8"/><circle cx="22" cy="18" r=".8"/><circle cx="27" cy="18" r=".8"/></g>' +
    '<path d="M38 14 Q42 6 46 5" stroke="#2c3230" stroke-width="5" stroke-linecap="round" fill="none"/>' +
    '<path d="M39.6 11 q2 -1 3.4 0" stroke="#e9ecea" stroke-width="1" fill="none"/>' +
    '<circle cx="47" cy="5" r="4" fill="#232826"/><path d="M50 5 L56 6.4 L50 7.4 Z" fill="#2c3230"/><circle cx="48.4" cy="4.2" r=".8" fill="#c0392b"/></svg>';

  const DRAGONFLY_SVG = '<svg viewBox="0 0 36 20" aria-hidden="true">' +
    '<g fill="#ffffff" opacity=".6"><ellipse class="lk-wing" cx="14" cy="6" rx="9" ry="3"/><ellipse class="lk-wing" cx="22" cy="6" rx="9" ry="3"/></g>' +
    '<g fill="#e7f1f4" opacity=".5"><ellipse class="lk-wing" cx="14" cy="11" rx="8" ry="2.6"/><ellipse class="lk-wing" cx="22" cy="11" rx="8" ry="2.6"/></g>' +
    '<rect x="2" y="8" width="18" height="2.4" rx="1.2" fill="#3f8f9a"/><circle cx="21" cy="9.2" r="2.4" fill="#2f7180"/><circle cx="24" cy="9" r="2" fill="#4fa3ad"/></svg>';

  const LANTERN_SVG = '<svg viewBox="0 0 44 64" aria-hidden="true">' +
    '<path d="M22 2 V8" stroke="#5e4630" stroke-width="2"/><circle cx="22" cy="2" r="2" fill="none" stroke="#5e4630" stroke-width="1.4"/>' +
    '<path d="M10 14 L22 8 L34 14 Z" fill="#5e4630"/>' +
    '<rect x="11" y="14" width="22" height="34" rx="2" fill="#fff6dc" fill-opacity=".5" stroke="#5e4630" stroke-width="2"/>' +
    '<rect x="19" y="34" width="6" height="12" fill="#fbf3e0"/>' +
    '<ellipse class="lk-flame" cx="22" cy="31" rx="3" ry="5" fill="#ffcf73"/>' +
    '<rect x="9" y="48" width="26" height="4" rx="1" fill="#5e4630"/></svg>';

  // ---- Painting the lakeside (once, on the first visit) ---------------------------------
  let painted = false;
  let padSpots = [];
  // on phones the buttons along the bottom cover the nearest pads, so the frogs keep to the others
  function frogPads() {
    if (!window.matchMedia('(max-width: 560px)').matches) return padSpots.slice();
    const clear = padSpots.filter(([, y]) => y <= 820);
    return clear.length >= 3 ? clear : padSpots.slice();
  }

  function fill(id, html) {
    const g = document.getElementById(id);
    if (g) g.innerHTML = html;
  }

  function lilyFlower(x, y, r, colour) {
    let s = '';
    for (let i = 0; i < 8; i++) {
      const a = i * 45 + 22;
      s += `<ellipse cx="${r1(x)}" cy="${r1(y - r * 0.5)}" rx="${r1(r * 0.28)}" ry="${r1(r * 0.62)}" fill="${colour}" stroke="#d9a3b3" stroke-opacity=".5" stroke-width=".6" transform="rotate(${a} ${r1(x)} ${r1(y)}) translate(0 ${r1(r * 0.08)})"/>`;
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 60;
      s += `<ellipse cx="${r1(x)}" cy="${r1(y - r * 0.36)}" rx="${r1(r * 0.2)}" ry="${r1(r * 0.42)}" fill="#ffffff" opacity=".85" transform="rotate(${a} ${r1(x)} ${r1(y)})"/>`;
    }
    return s + `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 0.18)}" fill="#f2c94c"/>`;
  }

  // ---- A Muskoka (Adirondack) chair, in a slight three-quarter view ------------------------
  // Drawn around (0, 0) = the middle of where it stands on the deck, about 124 wide and
  // 132 tall. c = the painted wood, d = its shaded sides, dd = the parts furthest back,
  // l = sunlit edges. Every piece meets the next: the back slats rise from the seat's back
  // edge, the arms rest on the front legs and are held at the back by posts that run down
  // to the seat, and the legs stand under the seat's corners.
  function muskokaChair(c, d, dd, l) {
    const P = (pts) => pts.map(([x, y]) => `${r1(x)} ${r1(y)}`).join(' L');
    // the seat: its back edge is higher and narrower (further away) than its front edge
    const seatBackL = [-34, -48];
    const seatBackR = [30, -52];
    const seatFrontL = [-50, -34];
    const seatFrontR = [44, -38];
    const backEdgeY = (x) => seatBackL[1] + (x - seatBackL[0]) * (seatBackR[1] - seatBackL[1]) / (seatBackR[0] - seatBackL[0]);
    let s = '<ellipse cx="0" cy="-2" rx="66" ry="7" fill="#2f281f" opacity=".16"/>';

    // rear legs, under the back corners of the seat (mostly hidden behind it)
    s += `<path d="M${P([[-38, -48], [-31, -48], [-32, -5], [-39, -5]])} Z" fill="${dd}"/>`;
    s += `<path d="M${P([[26, -52], [33, -52], [33, -9], [26, -9]])} Z" fill="${dd}"/>`;

    // the two back rails the slats are fixed to (their ends peek out at the sides)
    s += `<path d="M${P([[-48, -106], [46, -110], [46, -102], [-48, -98]])} Z" fill="${dd}"/>`;
    s += `<path d="M${P([[-40, -68], [36, -71], [36, -64], [-40, -61]])} Z" fill="${dd}"/>`;

    // the posts that hold up the back of each arm, running down to the seat's back corners
    s += `<path d="M${P([[-46, -84], [-39, -84], [-33, -48], [-40, -48]])} Z" fill="${d}"/>`;
    s += `<path d="M${P([[34, -89], [41, -89], [32, -52], [25, -52]])} Z" fill="${dd}"/>`;

    // six fanned back slats, reclining, rising from the seat's back edge; the middle ones tallest
    const n = 6;
    for (let i = 0; i < n; i++) {
      const b0 = -32 + i * 10;
      const b1 = b0 + 8;
      const t0 = -46 + i * 14.4;
      const t1 = t0 + 12;
      const top = -120 - (6.25 - Math.pow(i - 2.5, 2)) * 2.2;
      s += `<path d="M${r1(b0)} ${r1(backEdgeY(b0))} L${r1(t0)} ${r1(top + 6)} Q${r1((t0 + t1) / 2)} ${r1(top - 5)} ${r1(t1)} ${r1(top + 6)} L${r1(b1)} ${r1(backEdgeY(b1))} Z" fill="${c}"/>`;
      s += `<path d="M${r1(b0 + 2)} ${r1(backEdgeY(b0) - 3)} L${r1(t0 + 2.5)} ${r1(top + 7)}" stroke="${l}" stroke-width="1.4" opacity=".75"/>`;
      s += `<path d="M${r1(b1)} ${r1(backEdgeY(b1))} L${r1(t1)} ${r1(top + 6)}" stroke="${d}" stroke-width="1" opacity=".6"/>`;
    }

    // the deep, slatted seat, sloping down toward the back
    s += `<path d="M${P([seatFrontL, seatBackL, [seatBackL[0], seatBackL[1] + 5], [seatFrontL[0], seatFrontL[1] + 8]])} Z" fill="${d}"/>`;   // its left side
    s += `<path d="M${P([seatBackL, seatBackR, seatFrontR, seatFrontL])} Z" fill="${c}"/>`;
    [0.28, 0.54, 0.78].forEach((f) => {
      const a = [seatBackL[0] + (seatFrontL[0] - seatBackL[0]) * f, seatBackL[1] + (seatFrontL[1] - seatBackL[1]) * f];
      const b = [seatBackR[0] + (seatFrontR[0] - seatBackR[0]) * f, seatBackR[1] + (seatFrontR[1] - seatBackR[1]) * f];
      s += `<path d="M${r1(a[0])} ${r1(a[1])} L${r1(b[0])} ${r1(b[1])}" stroke="${d}" stroke-width="1.6"/>`;
    });
    // the rounded front board of the seat
    s += `<path d="M${P([seatFrontL, seatFrontR, [44, -30], [-50, -26]])} Z" fill="${d}"/>`;
    s += `<path d="M-49 -33.4 L43 -37.4" stroke="${l}" stroke-width="1.6" opacity=".85"/>`;

    // the front legs, under the front of each arm and beside the seat's front board
    s += `<path d="M${P([[-58, -64], [-50, -64], [-50, 0], [-58, 0]])} Z" fill="${d}"/>`;
    s += `<path d="M-57 -60 V-4" stroke="${l}" stroke-width="1.2" opacity=".6"/>`;
    s += `<path d="M${P([[46, -68], [54, -68], [54, -4], [46, -4]])} Z" fill="${d}"/>`;
    // small braces under the arms
    s += `<path d="M${P([[-58, -64], [-65, -64], [-58, -53]])} Z" fill="${dd}"/>`;
    s += `<path d="M${P([[54, -68], [61, -68], [54, -57]])} Z" fill="${dd}"/>`;

    // the wide, flat arms: narrow at the back post, widening toward the front, with thickness
    const arm = (backIn, backOut, frontOut, frontIn) =>
      `<path d="M${P([frontOut, frontIn, [frontIn[0], frontIn[1] + 5], [frontOut[0], frontOut[1] + 5]])} Z" fill="${d}"/>` +
      `<path d="M${P([backOut, frontOut, [frontOut[0], frontOut[1] + 5], [backOut[0], backOut[1] + 4]])} Z" fill="${dd}"/>` +
      `<path d="M${P([backIn, backOut, frontOut, frontIn])} Z" fill="${c}"/>` +
      `<path d="M${r1(backOut[0] + 1)} ${r1(backOut[1] + 1.5)} L${r1(frontOut[0] + 2)} ${r1(frontOut[1] + 1)}" stroke="${l}" stroke-width="1.4" opacity=".8"/>`;
    s += arm([-38, -85], [-47, -87], [-67, -68], [-45, -66]);
    s += arm([33, -90], [42, -92], [64, -72], [42, -70]);
    return s;
  }

  // ---- Painting the view from inside the rowboat --------------------------------------
  // The far shore and the near water are 3200 units wide, so they can pan past as you row.
  function paintBoatView() {
    let clouds = '';
    [[180, 120, 130, 22], [560, 70, 100, 18], [1000, 150, 150, 26], [1420, 90, 110, 20]].forEach(([x, y, rx, ry]) => {
      clouds += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/><ellipse cx="${x + rx * 0.4}" cy="${y - ry * 0.6}" rx="${rx * 0.55}" ry="${ry * 0.9}"/>`;
    });
    fill('lk-pov-clouds', clouds);

    let glint = '';
    for (let y = 478; y < 860; y += between(10, 20)) {
      const w = between(40, 110) * (0.4 + (y - 478) / 380);
      glint += `<rect x="${r1(980 - w / 2 + between(-16, 16))}" y="${r1(y)}" width="${r1(w)}" height="${r1(2 + (y - 478) / 120)}" rx="1.5"/>`;
    }
    fill('lk-pov-glint', glint);

    // the far shore: soft hills, pines, three little cottages with docks, and their reflections
    let shore = '<path d="M0 430 C300 404 600 420 900 410 C1200 398 1500 416 1800 404 C2100 394 2400 414 2700 404 C2950 396 3100 410 3200 404 L3200 474 L0 474 Z" fill="#b6c8c4"/>';
    let trees = '';
    for (let x = -10; x < 3220; x += between(10, 20)) {
      const h = between(34, 84);
      const w = h * 0.4;
      trees += `<path d="M${r1(x - w)} 474 L${r1(x - w * 0.5)} ${r1(474 - h * 0.45)} L${r1(x - w * 0.62)} ${r1(474 - h * 0.45)} L${r1(x)} ${r1(474 - h)} L${r1(x + w * 0.62)} ${r1(474 - h * 0.45)} L${r1(x + w * 0.5)} ${r1(474 - h * 0.45)} L${r1(x + w)} 474 Z" fill="${pick(['#6f8a7b', '#7d9585', '#64806f', '#87a08f'])}"/>`;
      if (random() < 0.2) trees += `<circle cx="${r1(x + between(4, 12))}" cy="${r1(474 - between(16, 30))}" r="${r1(between(14, 24))}" fill="${pick(['#8aa38c', '#97ae95'])}"/>`;
    }
    let cottages = '';
    [[620, '#b55a4c'], [1560, '#efe4cc'], [2480, '#9db08b']].forEach(([x, wall]) => {
      cottages += `<rect x="${x}" y="446" width="44" height="28" fill="${wall}"/><path d="M${x - 6} 448 L${x + 22} 426 L${x + 50} 448 Z" fill="#5e4630"/>` +
        `<rect x="${x + 8}" y="454" width="8" height="8" fill="#fbe7a8"/><rect x="${x + 28}" y="454" width="8" height="8" fill="#fbe7a8"/>` +
        `<path d="M${x + 40} 474 H${x + 96}" stroke="#8a6a4a" stroke-width="3"/>`;
    });
    shore += `<g filter="url(#blur-sm)">${trees}</g>` + cottages;
    shore += `<g transform="translate(0 948) scale(1 -1)" filter="url(#blur-md)" opacity=".22">${trees}${cottages}</g>`;
    shore += '<path d="M0 474 H3200" stroke="#ffffff" stroke-opacity=".55" stroke-width="2.4"/>';
    fill('lk-pov-far', shore);

    // the distant water: small lily pads and a little reed island far ahead
    // (the nearer pads pass by the boat on their own layer: see "Passing by" below)
    let near = '';
    const pads = [];
    for (let i = 0; i < 22; i++) {
      const y = between(540, 640);
      pads.push({ x: between(0, 3200), y, r: 8 + (y - 540) * 0.12 });
    }
    pads.sort((a, b) => a.y - b.y);
    pads.forEach((p) => {
      const ry = p.r * 0.34;
      const a = between(0, Math.PI * 2);
      const x1 = p.x + Math.cos(a) * p.r;
      const y1 = p.y + Math.sin(a) * ry;
      const x2 = p.x + Math.cos(a + 0.4) * p.r;
      const y2 = p.y + Math.sin(a + 0.4) * ry;
      near += `<path d="M${r1(p.x)} ${r1(p.y)} L${r1(x2)} ${r1(y2)} A${r1(p.r)} ${r1(ry)} 0 1 1 ${r1(x1)} ${r1(y1)} Z" fill="${pick(['#6f9a5a', '#7fa866', '#5f8a4a', '#86ad6c'])}"/>`;
      if (random() < 0.35) near += lilyFlower(p.x, p.y - ry * 0.3, p.r * 0.32, pick(['#fbe9ef', '#f6c9d4', '#fffaf2', '#efb3c4']));
    });
    near += '<ellipse cx="1760" cy="566" rx="90" ry="12" fill="#7f9a64"/><ellipse cx="1760" cy="570" rx="96" ry="8" fill="#3f6a5c" opacity=".25"/>';
    for (let i = 0; i < 16; i++) {
      const x = 1690 + between(0, 140);
      const h = between(50, 110);
      near += `<path d="M${r1(x)} 566 Q${r1(x + between(-6, 6))} ${r1(566 - h * 0.5)} ${r1(x + between(-10, 10))} ${r1(566 - h)}" stroke="#7f9a64" stroke-width="2.4" fill="none"/>`;
      if (random() < 0.6) near += `<rect x="${r1(x - 3.5)}" y="${r1(566 - h + 6)}" width="7" height="${r1(between(18, 26))}" rx="3.5" fill="${pick(['#7a5236', '#8a5e3c'])}"/>`;
    }
    fill('lk-pov-pads', near);

    let shimmer = '';
    for (let i = 0; i < 60; i++) {
      const y = between(480, 990);
      const w = between(16, 80) * (0.4 + (y - 480) / 500);
      shimmer += `<path d="M${r1(between(0, 1600))} ${r1(y)} h${r1(w)}" stroke-width="${r1(1 + (y - 480) / 300)}" stroke-opacity="${r1(between(0.25, 0.6) * 100) / 100}"/>`;
    }
    fill('lk-pov-shimmer', shimmer);

    document.getElementById('lk-pov-swan').innerHTML = `<span>${SWAN_SVG}</span>`;
    document.getElementById('lk-pov-ducks').innerHTML = `<span class="lk-duck lk-duck--mama">${duckSVG(false)}</span>` +
      [1, 2, 3].map(() => `<span class="lk-duck lk-duck--baby">${duckSVG(true)}</span>`).join('');
    document.getElementById('lk-pov-loon').innerHTML = `<span>${LOON_SVG}</span>`;
    document.getElementById('lk-pov-boat').innerHTML = POV_BOAT_SVG;

    // things to pass by: lily pads (some flowering), little reed clumps and ripples
    const PAD = (flower) => {
      const c = pick(['#6f9a5a', '#7fa866', '#5f8a4a', '#86ad6c']);
      return '<svg viewBox="0 0 200 80" aria-hidden="true">' +
        '<ellipse cx="100" cy="46" rx="96" ry="32" fill="#3f6a5c" opacity=".22"/>' +
        `<path d="M100 40 L178 30 A90 30 0 1 1 186 48 Z" fill="${c}"/>` +
        '<path d="M100 40 L40 50 M100 40 L150 58 M100 40 L120 18" stroke="#a9c58a" stroke-width="2" opacity=".6"/>' +
        (flower ? lilyFlower(96, 34, 24, pick(['#fbe9ef', '#f6c9d4', '#fffaf2', '#efb3c4'])) : '') + '</svg>';
    };
    const REEDS = () => {
      let s = '<svg viewBox="0 0 160 200" aria-hidden="true"><ellipse cx="80" cy="190" rx="70" ry="10" fill="#3f6a5c" opacity=".25"/>';
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * 12 + between(-4, 4);
        const h = between(90, 170);
        s += `<path d="M${r1(x)} 190 Q${r1(x + between(-8, 8))} ${r1(190 - h * 0.5)} ${r1(x + between(-14, 14))} ${r1(190 - h)}" stroke="${pick(['#7f9a64', '#6f8a58', '#86a169'])}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        if (i % 3 === 1) s += `<rect x="${r1(x - 5)}" y="${r1(196 - h)}" width="10" height="36" rx="5" fill="#7a5236"/>`;
      }
      return s + '</svg>';
    };
    const RIPPLE = '<svg viewBox="0 0 240 40" aria-hidden="true"><g fill="none" stroke="#ffffff" stroke-linecap="round">' +
      '<path d="M20 20 Q120 8 220 20" stroke-width="5" stroke-opacity=".55"/><path d="M60 30 Q120 22 180 30" stroke-width="4" stroke-opacity=".35"/></g></svg>';

    const passBox = document.getElementById('lk-pov-pass');
    passing = [];
    let html = '';
    for (let i = 0; i < 24; i++) {
      const kind = i % 4 === 3 ? 'reeds' : i % 2 ? 'ripple' : 'pad';
      const item = { kind, z: 1 + (i / 24) * PASS_DEPTH, x: sideFor(kind), w: kind === 'reeds' ? 150 : kind === 'ripple' ? 230 : 210 };
      passing.push(item);
      html += `<span class="lk-pass" style="--w:${item.w}">${kind === 'pad' ? PAD(random() < 0.45) : kind === 'reeds' ? REEDS() : RIPPLE}</span>`;
    }
    passBox.innerHTML = html;
    [...passBox.children].forEach((el, i) => { passing[i].el = el; });
    resetPassing();
  }

  // ---- Passing by: a simple perspective, so things far ahead sit near the horizon and grow
  // as they come alongside. Rowing forward moves everything closer by one "stretch" per stop.
  const HORIZON = 474;
  const VANISH_X = 800;
  const NEAR_DROP = 526;     // how far below the horizon something one step away appears
  const PASS_DEPTH = 13;     // how far ahead things are scattered
  const STRETCH = 3;         // how much closer everything comes on each leg of the ride
  let passing = [];

  // lily pads and reeds keep to the sides of the boat's path; ripples can be anywhere
  function sideFor(kind) {
    const side = Math.random() < 0.5 ? -1 : 1;
    return kind === 'ripple' ? between(-2.2, 2.2) : side * between(0.75, 2.6);
  }

  function placeItem(item) {
    const z = Math.max(item.z, 0.45);
    item.el.style.setProperty('--sx', r1(VANISH_X + item.x * NEAR_DROP / z));
    item.el.style.setProperty('--sy', r1(HORIZON + NEAR_DROP / z));
    item.el.style.setProperty('--k', r1(100 / z) / 100);
    // fade in far away, fade out as it passes the boat
    item.el.style.opacity = item.z < 0.8 || item.z > PASS_DEPTH - 0.6 ? 0 : 1;
  }

  function resetPassing() {
    passing.forEach((item, i) => {
      item.z = 1.2 + (i / passing.length) * PASS_DEPTH;
      item.el.classList.add('is-new');
      placeItem(item);
    });
    requestAnimationFrame(() => passing.forEach((item) => item.el.classList.remove('is-new')));
  }

  // row forward one stretch: everything glides closer, then gently slows to a stop
  function glideForward(seconds) {
    passing.forEach((item) => {
      item.el.style.setProperty('--glide', (calm.matches ? 0 : seconds) + 's');
      item.z -= STRETCH;
      placeItem(item);
    });
    // anything that has slipped past the boat goes back to the far water, unseen
    window.setTimeout(() => {
      passing.forEach((item) => {
        if (item.z >= 0.8) return;
        item.z += PASS_DEPTH;
        item.x = sideFor(item.kind);
        item.el.classList.add('is-new');
        placeItem(item);
      });
      requestAnimationFrame(() => requestAnimationFrame(() => passing.forEach((item) => item.el.classList.remove('is-new'))));
    }, calm.matches ? 0 : seconds * 1000 + 60);
  }

  function paint() {
    if (painted) return;
    painted = true;
    seed = 7331;   // the same lake every visit

    // clouds
    let clouds = '';
    [[220, 110, 120, 22], [520, 70, 90, 16], [980, 130, 140, 24], [1360, 80, 110, 18]].forEach(([x, y, rx, ry]) => {
      clouds += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/><ellipse cx="${x + rx * 0.4}" cy="${y - ry * 0.6}" rx="${rx * 0.55}" ry="${ry * 0.9}"/>`;
    });
    fill('lk-clouds', clouds);

    // the far shore: layered pines and rounded trees, mirrored softly in the water
    let trees = '';
    for (let x = -10; x < 1620; x += between(9, 18)) {
      const h = between(26, 64);
      const w = h * 0.42;
      trees += `<path d="M${r1(x - w)} 344 L${r1(x - w * 0.5)} ${r1(344 - h * 0.45)} L${r1(x - w * 0.62)} ${r1(344 - h * 0.45)} L${r1(x)} ${r1(344 - h)} L${r1(x + w * 0.62)} ${r1(344 - h * 0.45)} L${r1(x + w * 0.5)} ${r1(344 - h * 0.45)} L${r1(x + w)} 344 Z" fill="${pick(['#6f8a7b', '#7d9585', '#64806f', '#87a08f'])}"/>`;
      if (random() < 0.18) trees += `<circle cx="${r1(x + between(4, 10))}" cy="${r1(344 - between(14, 24))}" r="${r1(between(12, 20))}" fill="${pick(['#8aa38c', '#97ae95'])}"/>`;
    }
    fill('lk-treeline', `<g filter="url(#blur-sm)">${trees}</g>`);
    fill('lk-reflections', `<g transform="translate(0 688) scale(1 -1)" filter="url(#blur-md)">${trees}</g>`);

    // a golden glint on the water under the setting sun
    let glint = '';
    for (let y = 352; y < 640; y += between(10, 18)) {
      const w = between(30, 90) * (1 - (y - 352) / 420);
      glint += `<rect x="${r1(1185 - w / 2 + between(-14, 14))}" y="${r1(y)}" width="${r1(w)}" height="2.4" rx="1.2"/>`;
    }
    fill('lk-glint', glint);

    // a tiny red cottage and its dock on the far shore
    fill('lk-cottage',
      '<rect x="1272" y="324" width="30" height="20" fill="#b55a4c"/><path d="M1268 325 L1287 310 L1306 325 Z" fill="#5e4630"/>' +
      '<rect x="1278" y="330" width="6" height="6" fill="#fbe7a8"/><rect x="1291" y="330" width="6" height="6" fill="#fbe7a8"/>' +
      '<path d="M1300 344 H1336" stroke="#8a6a4a" stroke-width="2"/><path d="M1272 344 H1302" stroke="#5e4630" stroke-width="1" opacity=".5"/>');

    // lily pads and water lilies in the shallows
    let lilies = '';
    const pads = [];
    for (let i = 0; i < 26; i++) pads.push({ x: between(1080, 1580), y: between(770, 970), r: between(22, 46) });
    pads.sort((a, b) => a.y - b.y);
    padSpots = pads.filter((p) => p.r > 32).map((p) => [r1(p.x), r1(p.y)]);   // big enough for a frog
    pads.forEach((p) => {
      const ry = p.r * 0.36;
      const a = between(0, Math.PI * 2);
      const x1 = p.x + Math.cos(a) * p.r;
      const y1 = p.y + Math.sin(a) * ry;
      const x2 = p.x + Math.cos(a + 0.4) * p.r;
      const y2 = p.y + Math.sin(a + 0.4) * ry;
      lilies += `<ellipse cx="${r1(p.x)}" cy="${r1(p.y + 3)}" rx="${r1(p.r)}" ry="${r1(ry)}" fill="#3f6a5c" opacity=".25"/>`;
      lilies += `<path d="M${r1(p.x)} ${r1(p.y)} L${r1(x2)} ${r1(y2)} A${r1(p.r)} ${r1(ry)} 0 1 1 ${r1(x1)} ${r1(y1)} Z" fill="${pick(['#6f9a5a', '#7fa866', '#5f8a4a', '#86ad6c'])}"/>`;
      lilies += `<path d="M${r1(p.x)} ${r1(p.y)} L${r1(p.x - p.r * 0.6)} ${r1(p.y + ry * 0.3)} M${r1(p.x)} ${r1(p.y)} L${r1(p.x + p.r * 0.5)} ${r1(p.y - ry * 0.4)}" stroke="#a9c58a" stroke-width="1" opacity=".6"/>`;
      if (random() < 0.42) lilies += lilyFlower(p.x + between(-p.r * 0.3, p.r * 0.3), p.y - ry * 0.3, between(9, 14), pick(['#fbe9ef', '#f6c9d4', '#fffaf2', '#efb3c4']));
    });
    fill('lk-lilies', lilies);

    // the grassy bank by the dock, full of wildflowers
    let bank = '<path d="M0 846 C120 842 230 872 330 916 C392 944 436 976 462 1000 L0 1000 Z" fill="#8fa871"/>' +
      '<path d="M0 846 C120 842 230 872 330 916 C392 944 436 976 462 1000" fill="none" stroke="#6f8a58" stroke-width="3" opacity=".5"/>';
    for (let i = 0; i < 80; i++) {
      const x = between(0, 440);
      const yTop = 846 + (x / 462) * (x / 462) * 150;
      const y = between(yTop + 6, 1000);
      bank += `<path d="M${r1(x)} ${r1(y)} q${r1(between(-4, 4))} ${r1(-between(10, 24))} ${r1(between(-6, 6))} ${r1(-between(18, 34))}" stroke="${pick(['#6f8a58', '#7f9a64', '#93ad76'])}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 34; i++) {
      const x = between(10, 420);
      const yTop = 846 + (x / 462) * (x / 462) * 150;
      const y = between(yTop + 14, 990);
      const kind = pick(['daisy', 'daisy', 'cosmos', 'lupine', 'buttercup']);
      bank += `<path d="M${r1(x)} ${r1(y + 22)} L${r1(x)} ${r1(y)}" stroke="#6f8a58" stroke-width="1.6"/>`;
      if (kind === 'daisy') bank += `<use href="#bloom-daisy" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(between(1, 1.4))})"/>`;
      else if (kind === 'cosmos') bank += `<use href="#bloom-cosmos" transform="translate(${r1(x)} ${r1(y)}) scale(${r1(between(1, 1.3))})" style="color:${pick(['#efbcc4', '#e39aa8', '#f4d3d5'])}"/>`;
      else if (kind === 'buttercup') bank += `<circle cx="${r1(x)}" cy="${r1(y)}" r="4" fill="#f2d27a"/><circle cx="${r1(x)}" cy="${r1(y)}" r="1.5" fill="#d9a83a"/>`;
      else {
        const c = pick(['#b9a2cf', '#a28fbe', '#e39aa8']);
        for (let k = 0; k < 9; k++) bank += `<circle cx="${r1(x + between(-1.5, 1.5))}" cy="${r1(y - k * 4)}" r="${r1(3.4 - k * 0.25)}" fill="${c}"/>`;
      }
    }
    fill('lk-bank', bank);

    // the cottage dock: planks, posts, a ladder, two Muskoka chairs, the lantern post and a sign
    let dock = '';
    [44, 172, 300, 428].forEach((x) => {
      dock += `<rect x="${x}" y="726" width="14" height="${x > 300 ? 84 : 70}" fill="#7a5c40"/>`;
      dock += `<rect x="${x}" y="${x > 300 ? 810 : 796}" width="14" height="30" fill="#7a5c40" opacity=".25"/>`;
    });
    dock += '<path d="M0 702 L486 690 L500 714 L0 730 Z" fill="url(#lk-wood)"/>';
    for (let x = 30; x < 490; x += 30) dock += `<path d="M${x} ${r1(702 - x * 0.025)} L${x + 6} ${r1(729 - x * 0.03)}" stroke="#8c6a4a" stroke-width="1.4" opacity=".55"/>`;
    // soft wood grain running along the planks
    for (let i = 0; i < 14; i++) {
      const x = between(10, 440);
      const y = between(700, 724) - x * 0.025;
      dock += `<path d="M${r1(x)} ${r1(y)} q8 -1.6 16 0 t16 0" fill="none" stroke="#b48c62" stroke-width="1" opacity=".45"/>`;
    }
    dock += '<path d="M0 730 L500 714 L500 728 L0 746 Z" fill="#8c6a4a"/>';
    dock += '<path d="M472 714 V790 M494 714 V790 M472 734 H494 M472 754 H494 M472 774 H494" stroke="#6b4f3a" stroke-width="3"/>';
    // the hand-painted sign, up on taller posts so the chairs below are in full view
    dock += '<rect x="26" y="500" width="10" height="206" fill="#7a5c40"/><rect x="342" y="500" width="10" height="194" fill="#7a5c40"/>' +
      '<rect x="12" y="494" width="354" height="64" rx="7" fill="#d9bd94" stroke="#8c6a4a" stroke-width="3"/>' +
      '<rect x="20" y="501" width="338" height="50" rx="5" fill="none" stroke="#f3e3c2" stroke-width="1.4" stroke-dasharray="4 3"/>' +
      '<text x="189" y="535" text-anchor="middle" font-family="Caveat, cursive" font-size="28" font-weight="600" fill="#4f3b28" textLength="300" lengthAdjust="spacingAndGlyphs">a few thoughts from the lake ♡</text>';
    // two Muskoka chairs, sage and dusty pink, standing on the deck below the sign
    dock += `<g transform="translate(130 ${r1(712 - 130 * 0.025)})">${muskokaChair('#9db08b', '#82976e', '#6c8160', '#bccbb0')}</g>`;
    dock += `<g transform="translate(268 ${r1(712 - 268 * 0.025)})">${muskokaChair('#e3a9b0', '#c98f97', '#ad7680', '#f2c9ce')}</g>`;
    // a coil of rope, and a wooden cleat for the boat's line
    dock += '<g fill="none" stroke="#c9b48a" stroke-width="3"><ellipse cx="398" cy="702" rx="20" ry="6"/><ellipse cx="398" cy="701" rx="13.5" ry="4"/><ellipse cx="398" cy="700" rx="7" ry="2"/></g>' +
      '<path d="M418 702 q10 4 22 2" fill="none" stroke="#c9b48a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M398 704 q-14 4 -22 -1" fill="none" stroke="#b49c72" stroke-width="1" opacity=".6"/>';
    dock += '<rect x="436" y="700" width="26" height="4.5" rx="2" fill="#5e4630"/><rect x="445" y="696" width="8" height="6" rx="1.5" fill="#6b4f3a"/>';
    // the lantern post at the end of the dock (the lantern itself glows separately)
    dock += '<rect x="472" y="598" width="10" height="116" fill="#6b4f3a"/><path d="M477 600 H498" stroke="#6b4f3a" stroke-width="4"/>';
    // the rowboat's mooring line, from the cleat to the bow ring (it unties when the ride begins)
    dock += '<path class="lk-mooring" d="M449 701 Q500 760 552 752" fill="none" stroke="#c9b48a" stroke-width="3" stroke-linecap="round"/>';
    fill('lk-dock', dock);

    // cattails along the right shore and by the dock
    let cattails = '';
    function cattailClump(x0, base, count, height) {
      for (let i = 0; i < count; i++) {
        const x = x0 + between(-40, 40);
        const h = between(height * 0.7, height);
        const lean = between(-14, 14);
        cattails += `<path d="M${r1(x)} ${r1(base)} Q${r1(x + lean * 0.3)} ${r1(base - h * 0.5)} ${r1(x + lean)} ${r1(base - h)}" stroke="#7f9a64" stroke-width="2.6" fill="none"/>`;
        if (random() < 0.7) cattails += `<rect x="${r1(x + lean * 0.9 - 4.5)}" y="${r1(base - h + 8)}" width="9" height="${r1(between(30, 42))}" rx="4.5" fill="${pick(['#7a5236', '#8a5e3c', '#6b4a32'])}"/>`;
        cattails += `<path d="M${r1(x)} ${r1(base)} Q${r1(x + between(-30, 30))} ${r1(base - h * 0.6)} ${r1(x + between(-50, 50))} ${r1(base - h * between(0.5, 0.8))}" stroke="${pick(['#6f8a58', '#86a169'])}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      }
    }
    cattailClump(1555, 1000, 14, 300);
    cattailClump(1470, 990, 8, 230);
    cattailClump(420, 990, 7, 170);
    fill('lk-cattails', cattails);

    // light on the water
    let shimmer = '';
    for (let i = 0; i < 70; i++) {
      const y = between(360, 980);
      const w = between(10, 60) * (0.4 + (y - 360) / 620);
      const x = between(0, 1600);
      shimmer += `<path d="M${r1(x)} ${r1(y)} h${r1(w)}" stroke-width="${r1(0.8 + (y - 360) / 400)}" stroke-opacity="${r1(between(0.25, 0.6) * 100) / 100}"/>`;
    }
    fill('lk-shimmer', shimmer);

    // the ducks, loon, dragonflies and lantern
    document.getElementById('lk-ducks').innerHTML = `<span class="lk-duck lk-duck--mama">${duckSVG(false)}</span>` +
      [1, 2, 3, 4].map(() => `<span class="lk-duck lk-duck--baby">${duckSVG(true)}</span>`).join('');
    document.getElementById('lk-loon').innerHTML = LOON_SVG;
    document.querySelectorAll('.lk-dragonfly').forEach((el) => { el.innerHTML = DRAGONFLY_SVG; });
    document.getElementById('lk-lantern').innerHTML = LANTERN_SVG;
    document.getElementById('lk-boat-art').innerHTML = BOAT_SVG;
    document.getElementById('lk-bobber-art').innerHTML = BOBBER_SVG;
    document.getElementById('lk-bottle-art').innerHTML = BOTTLE_SVG;

    // the swan, and three frogs on lily pads well apart from each other
    document.getElementById('lk-swan').innerHTML = `<span>${SWAN_SVG}</span>`;
    const spots = frogPads().sort((a, b) => a[0] - b[0]);
    const chosen = [spots[0], spots[Math.floor(spots.length / 2)], spots[spots.length - 1]].filter(Boolean);
    document.getElementById('lk-frogs').innerHTML = chosen.map(([x, y]) =>
      `<button type="button" class="lk-frog" style="--x:${x}; --y:${y}" data-x="${x}" data-y="${y}" aria-label="A little green frog on a lily pad: say hello">` +
      `<span class="lk-frog__art" aria-hidden="true">${FROG_SVG}</span></button>`).join('');

    paintBoatView();

    // the "read the thoughts" list
    document.getElementById('lk-list').innerHTML = LAKE_THOUGHTS.map((t, i) =>
      `<li><div class="lk-list__fish" aria-hidden="true">${fishSVG(t.fish)}</div>` +
      `<div><p class="lk-list__no">catch 0${i + 1}</p><h3 class="lk-list__title hand">${t.title}</h3>` +
      `<p class="lk-card__thought">“${t.text}”</p></div></li>`).join('');
  }

  // ---- The rowboat at the dock --------------------------------------------------------------
  // Tied by its bow to the cleat. It only moves to push off, and to come home after the ride.
  const DOCK = [652, 818];
  const scaleAt = (y) => 0.42 + (y - 450) * 0.0016;   // a little smaller further out
  const GLIDE = 3.2;
  let boatAt = DOCK;
  let dir = -1;   // the bow faces the dock while moored

  function unit() { return scene.clientWidth / 1600; }

  // keep the boat in view on narrow screens
  function follow(x) {
    const left = x * unit() - viewport.clientWidth / 2;
    viewport.scrollTo({ left, behavior: calm.matches ? 'auto' : 'smooth' });
  }

  function placeBoat(point, seconds, facing) {
    const [x, y] = point;
    if (facing) dir = facing;
    else if (x !== boatAt[0]) dir = x > boatAt[0] ? 1 : -1;
    boat.style.setProperty('--glide', (calm.matches ? 0 : seconds) + 's');
    boat.style.setProperty('--bx', x);
    boat.style.setProperty('--by', y);
    boat.style.setProperty('--bs', r1(scaleAt(y) * 100) / 100);
    boat.style.setProperty('--dir', dir);
    boatAt = point;
    follow(x);
  }

  // ---- Fishing from inside the boat ------------------------------------------------------------
  // In the boat view's own units (1600 × 1000, looking out over the bow): the rod tip, where
  // the line lands at each stop, and how far along the lake each stop is.
  const pov = document.getElementById('lk-pov');
  const povScene = document.getElementById('lk-pov-scene');
  const panLayers = [document.querySelector('.lk-pov__far'), document.getElementById('lk-pov-near')];
  const ROD_TIP = [884, 556];
  // in open water: clear of the bow's pennant and the rod, and within a phone's view (x 570–1030)
  const CASTS = [[700, 652], [652, 672], [858, 712], [684, 694], [748, 708]];
  const PANS = [260, 560, 860, 1140, 1400];
  const BOB_SIZE = 1.8;
  let castAt = CASTS[0];

  // row along: the far shore and the near water glide past, then gently slow
  function setPan(pan, seconds) {
    panLayers.forEach((el) => {
      el.style.setProperty('--glide', (calm.matches ? 0 : seconds) + 's');
      el.style.setProperty('--pan', pan);
    });
  }

  function ring(x, y, s, where) {
    const el = document.createElement('span');
    el.className = 'lk-ring';
    el.style.cssText = `--x:${r1(x)}; --y:${r1(y)}; --s:${r1(s * 100) / 100}`;
    (where || povScene).appendChild(el);
    window.setTimeout(() => el.remove(), 1700);
  }

  // ---- The ride: a little state machine that can always be cancelled -----------------------
  const CANCELLED = Symbol('cancelled');
  let token = 0;
  const waiting = new Set();
  let onBobber = null;
  let onCatchClosed = null;

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, calm.matches ? Math.min(ms, 120) : ms));
  async function step(t, ms) {
    await wait(ms);
    if (t !== token) throw CANCELLED;
  }
  // wait for the visitor (tap the bobber, close a card); cancelling rejects it
  function until(register) {
    return new Promise((resolve, reject) => {
      waiting.add(reject);
      register(() => { waiting.delete(reject); resolve(); });
    });
  }

  function say(text) { status.textContent = text; }

  function setControls(state) {
    rideButton.hidden = state === 'riding';
    skipButton.hidden = state !== 'riding';
    rideButton.textContent = state === 'done' ? 'ride again ♡' : 'take a little ride ♡';
  }

  function hideFishing() {
    bobber.hidden = true;
    bobber.classList.remove('is-tugged', 'is-biting');
    line.classList.remove('is-cast');
    jump.className = 'lk-jump';
  }

  function cancel() {
    token++;
    onBobber = null;
    onCatchClosed = null;
    waiting.forEach((reject) => reject(CANCELLED));
    waiting.clear();
    if (catchCard.open) catchCard.close();
    hideFishing();
  }

  // the line whispers out from the rod tip and the bobber plops into the water ahead
  async function castLine(t, i) {
    const [tx, ty] = ROD_TIP;
    const [bx, by] = castAt = CASTS[i];
    linePath.setAttribute('d', `M${tx} ${ty} Q${r1((tx + bx) / 2)} ${r1(Math.max(ty, by) + 24)} ${bx} ${r1(by - 16)}`);
    line.classList.remove('is-cast');
    void line.getBoundingClientRect();   // restart the cast
    line.classList.add('is-cast');
    sfx('cast');
    await step(t, 520);
    bobber.style.cssText = `--x:${bx}; --y:${by}; --s:${BOB_SIZE}`;
    bobber.classList.remove('is-tugged', 'is-biting');
    bobber.hidden = false;
    ring(bx, by, BOB_SIZE);
  }

  async function reelIn(t, thought) {
    const [bx, by] = castAt;
    bobber.classList.remove('is-biting');
    bobber.classList.add('is-tugged');
    ring(bx, by, BOB_SIZE * 1.2);
    jump.innerHTML = fishSVG(thought.fish);
    jump.style.cssText = `--x:${bx}; --y:${by}; --s:2; --dir:-1`;
    jump.className = 'lk-jump is-jumping';
    sfx('catch');
    await step(t, 900);
    bobber.hidden = true;
    line.classList.remove('is-cast');
  }

  async function letItSwim(t, thought) {
    const [bx, by] = castAt;
    jump.innerHTML = fishSVG(thought.fish);
    jump.className = 'lk-jump';
    void jump.getBoundingClientRect();
    jump.style.cssText = `--x:${bx}; --y:${by}; --s:2; --dir:1`;
    jump.className = 'lk-jump is-swimming';
    sfx('release');
    await step(t, 650);
    ring(bx, by, BOB_SIZE);
    await step(t, 350);
    jump.className = 'lk-jump';
  }

  function openCard(card, focusEl) {
    if (typeof card.showModal === 'function') card.showModal();
    else card.setAttribute('open', '');
    (focusEl || card.querySelector('button')).focus({ preventScroll: true });
  }
  function closeCard(card) {
    if (!card.open) return;
    if (typeof card.close === 'function') card.close();
    else { card.removeAttribute('open'); card.dispatchEvent(new Event('close')); }
  }

  function showCatch(i) {
    const thought = LAKE_THOUGHTS[i];
    document.getElementById('lk-catch-fish').innerHTML = fishSVG(thought.fish);
    document.getElementById('lk-catch-no').textContent = 'catch 0' + (i + 1);
    document.getElementById('lk-catch-title').textContent = thought.title;
    document.getElementById('lk-catch-text').textContent = '“' + thought.text + '”';
    openCard(catchCard, document.getElementById('lk-release'));
  }

  // The message in a bottle drifts in from the open lake, out near the far shore, and comes
  // to rest beside the boat: in open water, clear of the swan's lane and the controls below.
  // It stays, bobbing, until the visitor opens it or rides again.
  const BOTTLE_FROM = [1240, 420];
  const BOTTLE_REST = [880, 700];
  const BOTTLE_DRIFT = 4600;

  // where the bottle meets the water right now, in lake units (for the ripples it leaves)
  function bottleWaterline() {
    const r = bottle.getBoundingClientRect();
    const s = scene.getBoundingClientRect();
    return [(r.left + r.width / 2 - s.left) / unit(), (r.top + r.height * 0.78 - s.top) / unit()];
  }

  async function bringBottle(t) {
    bottle.classList.remove('is-landed', 'is-drifting');
    bottle.style.setProperty('--x', BOTTLE_FROM[0]);
    bottle.style.setProperty('--y', BOTTLE_FROM[1]);
    bottle.style.setProperty('--bs', 0.4);
    bottle.hidden = false;
    void bottle.getBoundingClientRect();
    follow(BOTTLE_REST[0]);   // on a phone, turn to where it will come to rest
    bottle.classList.add('is-drifting');
    bottle.style.setProperty('--x', BOTTLE_REST[0]);
    bottle.style.setProperty('--y', BOTTLE_REST[1]);
    bottle.style.setProperty('--bs', 1);
    say('look! something’s drifting your way ♡');
    // little ripples trail behind it as it comes closer
    for (let i = 0; i < 4 && !calm.matches; i++) {
      await step(t, BOTTLE_DRIFT / 5);
      const [x, y] = bottleWaterline();
      ring(x, y, 0.45 + i * 0.15, scene);
    }
    await step(t, BOTTLE_DRIFT / 5);
    bottle.classList.add('is-landed');   // it settles and bobs, with a glimmer and its label
    ring(BOTTLE_REST[0], BOTTLE_REST[1] + 6, 1.3, scene);
    sfx('bottle');
    say('open your little message ♡');
    bottle.focus({ preventScroll: true });
    await step(t, 450);
    ring(BOTTLE_REST[0], BOTTLE_REST[1] + 6, 1.8, scene);
  }

  // untie the rope, push away from the dock, and settle into the boat
  async function pushOff(t) {
    say('untying the rope…');
    sfx('seed');
    room.classList.add('is-untied');
    await step(t, 700);
    say('pushing away from the dock…');
    sfx('row');
    placeBoat([820, 792], 1.8);
    await step(t, 1200);
    setPan(0, 0);
    if (passing.length) resetPassing();
    pov.classList.remove('is-gliding');
    pov.hidden = false;
    void pov.offsetWidth;
    room.classList.add('is-pov');          // the view from inside the boat fades in
    await step(t, 1100);
    room.classList.add('pov-settled');     // ...and the dock scene behind it rests
  }

  // back to the dock scene: the boat rows home and is tied up again
  async function comeHome(t, quick) {
    say('rowing back to the dock…');
    sfx('row');
    hideFishing();
    pov.classList.remove('is-gliding');
    room.classList.remove('pov-settled');
    placeBoat([1180, 772], 0, -1);         // out on the water, already heading home
    void boat.getBoundingClientRect();
    room.classList.remove('is-pov');
    await step(t, 1000);
    pov.hidden = true;
    const glide = quick ? 2 : GLIDE;
    placeBoat(DOCK, glide, -1);
    await step(t, glide * 1000 + 100);
    room.classList.remove('is-untied');
    sfx('seed');
    say('all tied up at the dock ♡');
    room.classList.remove('is-riding');
    await step(t, 600);
  }

  async function ride() {
    if (room.classList.contains('is-riding')) return;   // already out on the water
    cancel();
    const t = token;
    setControls('riding');
    room.classList.add('is-riding');
    bottle.hidden = true;
    closeCard(noteCard);
    try {
      await pushOff(t);
      for (let i = 0; i < LAKE_THOUGHTS.length; i++) {
        const thought = LAKE_THOUGHTS[i];
        say(i === 0 ? 'gliding out onto the lake…' : 'rowing on to another quiet spot…');
        sfx('row');
        // row forward: the nearby water passes the boat and the far shore drifts a little,
        // then everything gently slows until the boat is almost still for fishing
        pov.classList.add('is-gliding');
        setPan(PANS[i], GLIDE + 0.8);
        glideForward(GLIDE);
        await step(t, GLIDE * 650);
        pov.classList.remove('is-gliding');   // the bow wave fades as the boat slows
        await step(t, GLIDE * 350 + 200);
        say('casting out…');
        await castLine(t, i);
        say('waiting for a nibble…');
        bobber.focus({ preventScroll: true });
        // a fish bites after a moment (the bobber can be tapped any time: no timing needed)
        const bite = window.setTimeout(() => {
          if (t !== token || bobber.hidden) return;
          bobber.classList.add('is-biting');
          say('a little nibble! tap the bobber ♡');
        }, calm.matches ? 0 : 1000);
        await until((done) => { onBobber = done; });
        window.clearTimeout(bite);
        await reelIn(t, thought);
        showCatch(i);
        await until((done) => { onCatchClosed = done; });
        await letItSwim(t, thought);
        say(`${i + 1} of ${LAKE_THOUGHTS.length} thoughts caught ♡`);
        await step(t, 600);
      }
      await comeHome(t, false);
      setControls('done');
      await bringBottle(t);
    } catch (error) {
      if (error !== CANCELLED) throw error;
    }
  }

  // skip straight to the ending: home to the dock, and the bottle
  async function skip() {
    const outOnTheWater = room.classList.contains('is-pov');
    cancel();
    const t = token;
    setControls('done');
    try {
      if (outOnTheWater) {
        await comeHome(t, true);
      } else {   // still pushing off: simply drift back and tie up
        pov.hidden = true;
        room.classList.remove('is-pov', 'pov-settled');
        placeBoat(DOCK, 1, -1);
        await step(t, 1000);
        room.classList.remove('is-untied', 'is-riding');
      }
      await bringBottle(t);
    } catch (error) {
      if (error !== CANCELLED) throw error;
    }
  }

  function resetRide() {
    cancel();
    closeCard(noteCard);
    closeCard(listCard);
    room.classList.remove('is-pov', 'pov-settled', 'is-untied', 'is-riding');
    pov.hidden = true;
    setPan(0, 0);
    placeBoat(DOCK, 0, -1);
    bottle.hidden = true;
    setControls('idle');
    say('the rowboat is waiting at the dock ♡');
  }

  // ---- The frogs: blink and puff on their own; a click brings a croak and a hop ---------------
  const frogsBox = document.getElementById('lk-frogs');
  let frogTimer;

  function hopFrog(frog) {
    const here = [parseFloat(frog.dataset.x), parseFloat(frog.dataset.y)];
    const taken = [...frogsBox.children].map((f) => f.dataset.x + ',' + f.dataset.y);
    const nearby = frogPads().filter(([x, y]) => !taken.includes(x + ',' + y) && Math.hypot(x - here[0], (y - here[1]) * 2) < 300);
    frog.classList.remove('is-hopping');
    void frog.offsetWidth;
    frog.classList.add('is-hopping');
    if (!nearby.length) return;   // no free pad close by: a little hop on the spot
    const [x, y] = nearby[Math.floor(Math.random() * nearby.length)];
    frog.dataset.x = x;
    frog.dataset.y = y;
    frog.style.setProperty('--x', x);
    frog.style.setProperty('--y', y);
  }

  // a click: "rib-bit", the throat puffing with each syllable, then the usual hop once it's sung
  frogsBox.addEventListener('click', (event) => {
    const frog = event.target.closest('.lk-frog');
    if (!frog || frog.classList.contains('is-croaking')) return;
    sfx('croak');
    frog.classList.add('is-croaking');
    window.setTimeout(() => { frog.classList.remove('is-croaking'); hopFrog(frog); }, 640);
  });

  // now and then, one of the frogs hops to another pad on its own (only while the dock is in view)
  function frogsWander() {
    window.clearTimeout(frogTimer);
    frogTimer = window.setTimeout(() => {
      const frogs = frogsBox.children;
      if (!room.hidden && !calm.matches && !room.classList.contains('pov-settled') && frogs.length) {
        hopFrog(frogs[Math.floor(Math.random() * frogs.length)]);
      }
      if (!room.hidden) frogsWander();
    }, 9000 + Math.random() * 6000);
  }

  // ---- Stepping in and out (like the greenhouse) ---------------------------------------------
  let enteredFromGarden = false;
  let closeTimer;
  let settleTimer;

  function enter() {
    if (!room.hidden && room.classList.contains('is-open')) return;
    window.clearTimeout(closeTimer);
    paint();
    room.hidden = false;
    body.classList.add('at-lake');
    gardenViewport.inert = true;
    instructionBar.inert = true;
    resetRide();
    frogsWander();
    // start with the end of the dock, its chairs and the moored boat in view on narrow screens
    viewport.scrollLeft = 545 * unit() - viewport.clientWidth / 2;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => body.classList.add('lake-settled'), 1300);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      room.classList.add('is-open');
      rideButton.focus({ preventScroll: true });
    }));
  }

  function leave() {
    if (room.hidden) return;
    cancel();
    window.clearTimeout(frogTimer);
    closeCard(noteCard);
    closeCard(listCard);
    window.clearTimeout(settleTimer);
    body.classList.remove('lake-settled');
    room.classList.remove('is-open');
    body.classList.remove('at-lake');
    gardenViewport.inert = false;
    instructionBar.inert = false;
    closeTimer = window.setTimeout(() => { room.hidden = true; }, 600);
    if (location.hash === '#garden' || location.hash === '') peek.focus({ preventScroll: true });
  }

  function sync() {
    if (location.hash === '#lake') enter();
    else leave();
  }

  function goBack() {
    if (enteredFromGarden) { enteredFromGarden = false; history.back(); }
    else location.hash = 'garden';
  }

  // a click on the swan: she gently dips her head to the water, or ruffles her wing, with a soft call
  const swan = document.getElementById('lk-swan');
  swan.addEventListener('click', () => {
    if (swan.classList.contains('is-dipping') || swan.classList.contains('is-ruffling')) return;
    sfx('swan');
    const move = Math.random() < 0.6 ? 'is-dipping' : 'is-ruffling';
    swan.classList.add(move);
    window.setTimeout(() => swan.classList.remove(move), 1700);
  });

  // a click on the duck family brings a little quack
  const ducks = document.getElementById('lk-ducks');
  ducks.addEventListener('click', () => {
    sfx('quack');
    ducks.classList.remove('is-quacking');
    void ducks.offsetWidth;
    ducks.classList.add('is-quacking');
  });

  peek.addEventListener('click', () => {
    sfx('release');
    enteredFromGarden = true;
    location.hash = 'lake';
  });
  backButton.addEventListener('click', goBack);
  rideButton.addEventListener('click', ride);
  boat.addEventListener('click', ride);   // the rowboat itself: "take a little ride ♡"
  skipButton.addEventListener('click', skip);
  readButton.addEventListener('click', () => { paint(); sfx('pageFlip'); openCard(listCard); });

  bobber.addEventListener('click', () => {
    if (!onBobber) return;
    const done = onBobber;
    onBobber = null;
    done();
  });
  document.getElementById('lk-release').addEventListener('click', () => closeCard(catchCard));
  catchCard.addEventListener('close', () => {
    if (!onCatchClosed) return;
    const done = onCatchClosed;
    onCatchClosed = null;
    done();
  });
  bottle.addEventListener('click', () => openCard(noteCard, document.getElementById('lk-again')));
  document.getElementById('lk-again').addEventListener('click', () => { closeCard(noteCard); ride(); });
  document.getElementById('lk-home').addEventListener('click', () => { closeCard(noteCard); goBack(); });

  [catchCard, noteCard, listCard].forEach((card) => {
    card.querySelectorAll('[data-lk-close]').forEach((button) => button.addEventListener('click', () => closeCard(card)));
    card.addEventListener('click', (event) => { if (event.target === card) closeCard(card); });
    // Escape closes only the card, never the whole lake
    card.addEventListener('keydown', (event) => { if (event.key === 'Escape') event.stopPropagation(); });
  });
  noteCard.addEventListener('close', () => { if (!room.hidden && !bottle.hidden) bottle.focus({ preventScroll: true }); });
  listCard.addEventListener('close', () => { if (!room.hidden) readButton.focus({ preventScroll: true }); });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !room.hidden && !catchCard.open && !noteCard.open && !listCard.open) goBack();
  });

  window.addEventListener('hashchange', sync);
  sync();
})();
