/* ==========================================================================
   A Day in Bloom · living project pages (projects/*.html)
   Each project page grows its own small world as you scroll, switched on with
   attributes on <body>:
     data-bloom="snapdragon | ranunculus | cosmos"
         a vine grows down the page as you scroll, unfurling leaves, buds and
         that project's flower. On wide screens it climbs the outside margin;
         on phones and tablets it fits within the page's own edge.
     data-theme="fire | aurora | sun"
         fire    LumiEdge: a little flame ignites on each section divider and
                 travels along it, leaving a warm glow; embers drift up; small
                 flames flicker along the vine; the page warms by the final
                 renderings; and (only if sound is on) a quiet fireplace crackle
         aurora  Modunest: aurora ribbons draw themselves along the dividers,
                 soft aurora light drifts behind the page, and each space glows
                 gently as it arrives
         sun     Lucy's Cottage: fine pencil lines draw themselves along the
                 dividers, little sketches settle beside the floor plan and the
                 design approach, sunlight drifts across, and petals fall now
                 and then
   Headings and images also fade softly into place. Everything happens once as
   it arrives (a quick jump down the page never leaves anything hidden), sits
   outside or behind the content so it never covers text, images or
   navigation, and with reduced motion simply appears. The project images are
   never altered. Styles: css/project-bloom.css. No libraries.
   ========================================================================== */
(function () {
  'use strict';

  const body = document.body;
  const main = document.querySelector('main.project');
  if (!main) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const r1 = (n) => Math.round(n * 10) / 10;
  const sections = [...main.querySelectorAll('.project-section')];
  const theme = body.dataset.theme || '';
  let uid = 0;

  // ---- Things that appear once as they arrive ------------------------------------------------
  // (or as soon as they've been scrolled past). A tiny, throttled check of the few that are still
  // waiting, which stops listening once they've all appeared.
  const waiting = [];
  let waitFrame = 0;
  function arrive() {
    waitFrame = 0;
    const line = window.innerHeight * 0.88;
    for (let i = waiting.length - 1; i >= 0; i--) {
      const [el, then] = waiting[i];
      if (el.getBoundingClientRect().top < line) {
        waiting.splice(i, 1);
        then(el);
      }
    }
    if (!waiting.length) window.removeEventListener('scroll', onScroll);
  }
  function onScroll() { if (!waitFrame) waitFrame = window.requestAnimationFrame(arrive); }
  function whenArrived(el, then) {
    if (calm.matches) { then(el); return; }
    if (!waiting.length) window.addEventListener('scroll', onScroll, { passive: true });
    waiting.push([el, then]);
  }
  const addClass = (name) => (el) => el.classList.add(name);

  // a note for the garden: the visitor has been looking at a project, so its grown flowers can give a
  // little nod when they come back (js/game.js); kept only for this visit
  try { sessionStorage.setItem('aDayInBloom.fromProject', '1'); } catch (error) { /* storage blocked */ }

  // ---- 1. Headings and images fade softly into place --------------------------------------------
  if (!calm.matches) {
    main.querySelectorAll('.project-section h2, .behind-bloom__seed, .project-section .project-figure, .material-samples li').forEach((el) => {
      el.classList.add('pb-reveal');
      if (el.matches('.material-samples li')) el.style.transitionDelay = ([...el.parentNode.children].indexOf(el) * 70) + 'ms';
      whenArrived(el, addClass('is-in'));
    });
  } else {
    main.querySelectorAll('.project-section .project-figure').forEach((el) => el.classList.add('is-in'));
  }

  // ---- 1b. A fine pencil line under each section heading ---------------------------------------
  // Like a drafting detail: a slightly uneven graphite stroke that overshoots its ends a touch, with a
  // tiny tick at each end. It draws itself once as the heading arrives, sized to the heading's text.
  main.querySelectorAll('.project-section h2').forEach((h2, i) => {
    const wobble = (n) => (Math.sin(i * 7.3 + n) * 0.5).toFixed(2);
    h2.insertAdjacentHTML('beforeend', '<svg class="pb-underline" viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      `<path class="pb-underline__line" pathLength="1" d="M-3 ${4 + +wobble(1)} C50 ${3.4 + +wobble(2)} 110 ${4.6 + +wobble(3)} 150 ${3.8 + +wobble(4)} S192 ${4.2 + +wobble(5)} 203 ${3.9 + +wobble(6)}"/>` +
      '<path class="pb-underline__tick" d="M0 1.6 L0 6.4 M200 1.8 L200 6.2"/></svg>');
    const line = h2.lastElementChild;
    // as wide as the words themselves (headings can wrap, or sit in a wide column)
    const fit = () => {
      const range = document.createRange();
      range.selectNodeContents(h2.firstChild || h2);
      const rects = [...range.getClientRects()];
      const box = h2.getBoundingClientRect();
      const right = rects.length ? Math.max(...rects.map((r) => r.right)) : box.right;
      line.style.width = Math.max(40, Math.round(right - box.left + 6)) + 'px';
    };
    fit();
    window.addEventListener('resize', fit, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    whenArrived(h2, () => window.setTimeout(() => line.classList.add('is-drawn'), calm.matches ? 0 : 350));
  });

  // ---- 2. The flowers -------------------------------------------------------------------------
  const pick = (list, i) => list[Math.abs(i) % list.length];
  const leaf = (len, colour) => `<path d="M0 0 C${r1(len * 0.22)} ${r1(-len * 0.25)} ${r1(len * 0.22)} ${r1(-len * 0.7)} 0 ${r1(-len)} C${r1(-len * 0.22)} ${r1(-len * 0.7)} ${r1(-len * 0.22)} ${r1(-len * 0.25)} 0 0Z" fill="${colour}"/>`;
  const LEAVES = ['#8fa871', '#a3bd88', '#9db584', '#b5c99a', '#86a06a'];

  // each flower is drawn about 20 units tall/wide around 0,0 (stalks grow upward from 0,0)
  const FLOWERS = {
    snapdragon: {
      shades: [['#de8ea3', '#e8a3b4', '#f2c6d0'], ['#e57f9a', '#ef9fb3', '#f7cdd6'], ['#d9879d', '#f0b3c2', '#fbe0e6'], ['#e996ad', '#f4b8c6', '#fce4ea']],
      bloom(i) {
        const [a, b, c] = pick(this.shades, i);
        let out = '<path d="M0 0 Q1.6 -20 0 -40" fill="none" stroke="#7f9a64" stroke-width="1.3" stroke-linecap="round"/>';
        // each floret opens in turn, from the bottom of the stalk to the tip
        for (let k = 0; k < 7; k++) {
          const t = 0.16 + k * 0.12;
          const s = 1 - t * 0.5;
          const side = k % 2 ? 1 : -1;
          out += `<g class="pb-flo" style="--k:${k}"><ellipse cx="${r1(side * 2.2 * s + t)}" cy="${r1(-40 * t)}" rx="${r1(3.2 * s)}" ry="${r1(2.5 * s)}" fill="${k > 4 ? c : k % 2 ? b : a}"/>` +
            `<ellipse cx="${r1(side * 3.4 * s + t)}" cy="${r1(-40 * t + 1.1 * s)}" rx="${r1(1.8 * s)}" ry="${r1(1.3 * s)}" fill="#fbe3e9"/></g>`;
        }
        return out + '<ellipse cx=".6" cy="-41" rx="1.3" ry="2" fill="#c9d6a8"/>';
      },
      size: 40,
      width: 12,   // a tall, slim stalk: on narrow screens it's sized to fit by its width
      bud: ['#e8a3b4', '#de8ea3', '#f2c6d0']
    },
    ranunculus: {
      shades: [['#f1d27f', '#f8e6b0', '#c9a14a'], ['#f3bb98', '#f9dcc6', '#c98466'], ['#f6c98c', '#fbe5c3', '#c99a5a'], ['#f4e3b0', '#fdf5dc', '#c9b07a']],
      bloom(i) {
        const [fill, light, edge] = pick(this.shades, i);
        let out = '';
        // its rings of petals open one after another, from the outside in
        [[10, fill, 8, 0], [7, light, 7, 0.4], [4.4, fill, 6, 0.9]].forEach(([r, col, n, turn], ring) => {
          out += `<g class="pb-flo" style="--k:${ring * 2}"><circle r="${r1(r * 0.74)}" fill="${col}"/>`;
          for (let p = 0; p < n; p++) {
            const a = p / n * Math.PI * 2 + turn;
            out += `<circle cx="${r1(Math.cos(a) * r * 0.6)}" cy="${r1(Math.sin(a) * r * 0.6)}" r="${r1(r * 0.42)}" fill="${col}" stroke="${edge}" stroke-opacity=".3" stroke-width=".6"/>`;
          }
          out += '</g>';
        });
        return `<g transform="translate(0 -12)"><path d="M0 12 L0 4" stroke="#7f9a64" stroke-width="1.3"/>${out}<circle r="1.2" fill="#b9c27a"/></g>`;
      },
      size: 24,
      bud: ['#f1d27f', '#f3bb98', '#f6c98c']
    },
    cosmos: {
      shades: [['#f0b9c4', '#e39aa8'], ['#f6d2d8', '#eab0bb'], ['#ea9fb0', '#d9809a'], ['#fbe1e5', '#f0bcc6']],
      bloom(i) {
        const [petal, deep] = pick(this.shades, i);
        let out = '';
        // its eight petals unfold one after another, around the flower
        for (let p = 0; p < 8; p++) {
          out += `<g class="pb-flo" style="--k:${p}"><path d="M0 -1.5 C-3 -3.5 -3.4 -8.5 -2 -10.5 L-1 -9.6 L0 -11 L1 -9.6 L2 -10.5 C3.4 -8.5 3 -3.5 0 -1.5Z" fill="${p % 2 ? petal : deep}" fill-opacity=".95" transform="rotate(${p * 45})"/></g>`;
        }
        return `<g transform="translate(0 -12)"><path d="M0 12 Q-1 7 0 3" fill="none" stroke="#7f9a64" stroke-width="1.2"/>${out}<circle r="2.2" fill="#e2b546"/><circle r="1" fill="#b98a2c"/></g>`;
      },
      size: 24,
      bud: ['#f0b9c4', '#e39aa8', '#f6d2d8']
    }
  };
  const kind = FLOWERS[body.dataset.bloom];
  const budArt = (i) => `<ellipse rx="2.2" ry="3.2" fill="${pick(kind.bud, i)}"/><path d="M-2 1.5 Q0 4 2 1.5" fill="#9db584"/>`;
  // a tiny flame, for LumiEdge's vine (base at 0,0)
  const tinyFlame = '<g class="pb-vflame__body"><path d="M0 0 C-5 -1 -5.5 -6 -3.5 -9 C-3 -7 -2 -6.5 -1.5 -7 C-2.5 -10 -1 -14 2 -17 C1.5 -13 4 -11 5 -8 C6 -5 5 -1 0 0Z" fill="#f08a3c"/>' +
    '<path d="M0 -.5 C-3 -1 -3 -4 -1.5 -6.5 C-1 -5 -.5 -5 0 -5.5 C-.3 -8 1 -10 2.5 -11.5 C2.5 -9 4 -7.5 4 -5 C4 -2 2.5 -.6 0 -.5Z" fill="#f6b347"/>' +
    '<path d="M0 -1 C-1.5 -1.4 -1.5 -3 -.6 -4.2 C0 -3.4 .6 -3.6 .9 -4.4 C1.3 -3.4 2 -2.8 1.9 -2 C1.8 -1.2 1 -.9 0 -1Z" fill="#ffe7a3"/></g>';

  if (kind) {
    const vine = document.createElementNS(NS, 'svg');
    vine.setAttribute('class', 'pb-vine');
    vine.setAttribute('aria-hidden', 'true');
    main.appendChild(vine);
    let vineTop = 0;
    let vineHeight = 1;
    let marks = [];
    let reached = 0;

    function drawVine() {
      const wide = window.innerWidth >= 1290;
      const hero = main.querySelector('.project-hero');
      const pager = main.querySelector('.project-pager');
      const padding = parseFloat(getComputedStyle(main).paddingLeft) || 16;
      // on wide screens it climbs the margin; otherwise it fits the page's own left edge
      const W = wide ? 72 : Math.max(12, Math.round(padding - 3));
      const k = wide ? 1 : Math.min(1, W / 40);   // how much smaller everything is drawn on narrow screens
      vine.classList.toggle('pb-vine--narrow', !wide);
      vineTop = hero ? hero.offsetTop : 0;
      vineHeight = Math.max(200, (pager ? pager.offsetTop : main.offsetHeight) - vineTop);
      vine.style.top = vineTop + 'px';
      vine.style.width = W + 'px';
      vine.setAttribute('viewBox', `0 0 ${W} ${Math.round(vineHeight)}`);
      vine.setAttribute('height', String(Math.round(vineHeight)));
      const mid = wide ? 40 : W / 2 - 0.5;
      const swing = wide ? 13 : Math.max(1.5, W * 0.12);
      const xAt = (y) => mid + Math.sin(y / 150) * swing + Math.sin(y / 47) * swing * 0.25;
      let d = `M${r1(xAt(0))} 0`;
      for (let y = 12; y <= vineHeight; y += 12) d += ` L${r1(xAt(y))} ${y}`;
      let art = `<path class="pb-vine__stem" pathLength="1" d="${d}" fill="none" stroke="#7f9a64" stroke-width="${wide ? 2 : 1.5}" stroke-linecap="round"/>`;
      const at = (y) => Math.min(1, r1(y / vineHeight * 1000) / 1000);
      const bit = (y, x, rot, inner, cls) => `<g class="pb-bit${cls ? ' ' + cls : ''}" data-at="${at(y)}" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})"><g class="pb-bit__grow">${inner}</g></g>`;

      // LumiEdge's, Modunest's and Lucy's Cottage's vines are full: flowers often in twos, plenty of buds and leaves
      const lush = theme === 'fire' || theme === 'aurora' || theme === 'sun';
      // leaves all the way down: plenty of them, a little irregular in size, shade and angle
      for (let y = 26, i = 0; y < vineHeight - 16; y += (lush ? (wide ? 26 : 20) : (wide ? 34 : 26)) + ((i * 37) % (wide ? 26 : 16)), i++) {
        const side = i % 2 ? 1 : -1;
        const len = wide ? 17 + (i * 7) % 9 : W * (0.34 + ((i * 7) % 9) / 70);   // narrow: always within the page's edge
        art += bit(y, xAt(y), side * (50 + (i * 13) % 30), leaf(len, pick(LEAVES, i)));
      }
      // blossoms and buds along the way, in varied sizes, shades and directions
      const flowerAt = (y, i, big) => {
        const vary = ((i * 29) % 40) / 100;
        const s = wide ? (big ? 1.5 : 0.95 + vary) : Math.min(1, (W - 2) / (kind.width || kind.size)) * (big ? 1.1 : 0.85 + vary * 0.5);
        const lean = ((i * 47) % 50) - 25;
        return bit(y, xAt(y) + (wide ? ((i % 3) - 1) * 6 : 0), lean, `<g transform="scale(${r1(s * 100) / 100})">${kind.bloom(i)}</g>`, 'pb-bit--flower');
      };
      for (let y = 110, i = 0; y < vineHeight - 40; y += (lush ? (wide ? 80 : 66) : (wide ? 150 : 120)) + ((i * 53) % (lush ? 50 : 90)), i++) {
        art += flowerAt(y, i + 3, false);
        if (lush && i % 3 !== 2 && y + 22 < vineHeight - 20) {
          art += bit(y + 22, xAt(y + 22) + (wide ? (i % 2 ? 9 : -9) : 0), (i % 2 ? 1 : -1) * (14 + (i * 17) % 20),
            `<g transform="scale(${r1((wide ? 0.85 + ((i * 13) % 30) / 100 : Math.min(1, (W - 2) / (kind.width || kind.size)) * 0.8) * 100) / 100})">${kind.bloom(i + 11)}</g>`, 'pb-bit--flower');
        }
        art += bit(y + 34, xAt(y + 34) + (i % 2 ? -5 : 5) * k, (i % 2 ? 1 : -1) * 20, `<g transform="scale(${r1((wide ? 1.3 : 0.9) * 100) / 100})">${budArt(i)}</g>`);
        art += bit(y + 70, xAt(y + 70) + (i % 2 ? 6 : -6) * k, (i % 2 ? -1 : 1) * 25, `<g transform="scale(${r1((wide ? 1 : 0.75) * 100) / 100})">${budArt(i + 1)}</g>`);
      }
      // a bigger bloom beside each section's heading (and, for LumiEdge, a little flame)
      const anchors = [hero, ...sections.map((s) => s.querySelector('h2'))].filter(Boolean);
      const mainTop = main.getBoundingClientRect().top + window.scrollY;
      anchors.forEach((el, i) => {
        const y = Math.min(vineHeight - 10, Math.max(30, el.getBoundingClientRect().top + window.scrollY - mainTop - vineTop + 20));
        art += flowerAt(y, i, true);
        if (theme === 'fire' && i > 0) {
          const fy = Math.max(20, y - 40);
          art += `<g class="pb-bit pb-vflame" data-at="${at(fy)}" transform="translate(${r1(xAt(fy) + (wide ? 12 : 0))} ${r1(fy)}) scale(${wide ? 1.3 : Math.min(1, W / 16)})"><g class="pb-bit__grow">` +
            `<circle class="pb-vflame__glow" r="9" cy="-5" fill="url(#pb-vflame-glow)"/>${tinyFlame}</g></g>`;
        }
      });
      if (theme === 'fire') {
        art = '<defs><radialGradient id="pb-vflame-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#f08a3c" stop-opacity="0"/></radialGradient></defs>' + art;
      }
      vine.innerHTML = art;
      marks = [...vine.querySelectorAll('.pb-bit')].map((el) => [el, parseFloat(el.dataset.at)]);
      reached = 0;
      growVine();
    }

    // the vine reaches a little ahead of what you're reading; it only ever grows
    let frame = 0;
    function growVine() {
      frame = 0;
      if (!vine.getClientRects().length) return;
      const docTop = main.getBoundingClientRect().top + window.scrollY + vineTop;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const p = calm.matches || atBottom ? 1 : Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.75 - docTop) / vineHeight));
      if (p <= reached) return;
      reached = p;
      vine.querySelector('.pb-vine__stem').style.strokeDashoffset = String(1 - p);
      marks.forEach(([el, mark]) => { if (mark <= p) el.classList.add('is-open'); });
    }
    window.addEventListener('scroll', () => { if (!frame) frame = window.requestAnimationFrame(growVine); }, { passive: true });
    // re-measure when the page changes height (images arriving) or the window is resized
    let redraw = 0;
    let lastWidth = window.innerWidth;
    const later = () => { window.clearTimeout(redraw); redraw = window.setTimeout(() => { lastWidth = window.innerWidth; drawVine(); }, 200); };
    if ('ResizeObserver' in window) new ResizeObserver(later).observe(main);
    window.addEventListener('resize', () => { if (window.innerWidth !== lastWidth) later(); });
    drawVine();

    // on narrower screens: a little sprig of the same flower lying along each divider
    const sprig = (i) => `<svg class="pb-sprig" viewBox="0 0 96 34" aria-hidden="true">` +
      '<path d="M96 3 C78 4 62 2 44 6 C34 8 26 7 18 10" fill="none" stroke="#7f9a64" stroke-width="1.3" stroke-linecap="round"/>' +
      `<g class="pb-bit__grow" style="transition-delay:.1s"><g transform="translate(78 4) rotate(150)">${leaf(13, '#8fa871')}</g></g>` +
      `<g class="pb-bit__grow" style="transition-delay:.18s"><g transform="translate(58 4) rotate(30)">${leaf(11, '#a3bd88')}</g></g>` +
      `<g class="pb-bit__grow" style="transition-delay:.26s"><g transform="translate(40 ${kind.size > 30 ? 7 : 20}) rotate(${kind.size > 30 ? (i % 2 ? 150 : 140) : 0}) scale(${kind.size > 30 ? 0.62 : 0.85})">${kind.bloom(i)}</g></g>` +
      `<g class="pb-bit__grow" style="transition-delay:.34s"><g transform="translate(20 10)">${budArt(i)}</g></g></svg>`;
    sections.forEach((s, i) => {
      if (s.hasAttribute('data-sketch')) return;   // (Lucy's sketches sit there instead)
      s.insertAdjacentHTML('afterbegin', sprig(i));
      whenArrived(s.querySelector('.pb-sprig'), addClass('is-open'));
    });
  }

  // ---- 3. The section dividers come alive ---------------------------------------------------
  // Each divider plays once, as it arrives.
  let ignite = () => {};

  // LumiEdge's flames: three palettes of the same stylized flame, each with a soft glow at its base
  let flameDefsReady = false;
  function flameDefs() {
    if (flameDefsReady) return;
    flameDefsReady = true;
    const flame = (id, outer, middle, core) => `<g id="${id}"><ellipse cy="-7" rx="11" ry="10" fill="url(#pb-flame-glow)"/>` +
      `<path d="M0 0 C-9 -2 -10 -10 -6 -16 C-5 -12 -3 -11 -2 -12 C-4 -18 -2 -25 3 -30 C2 -24 6 -21 8 -16 C10 -11 9 -2 0 0Z" fill="${outer}"/>` +
      `<path d="M0 -1 C-6 -2.5 -6 -8 -3 -13 C-2 -10 -1 -9.5 0 -10.5 C-1 -15 1 -20 4 -23 C4 -18 6.5 -15 6.5 -11 C6.5 -5 4.5 -1.5 0 -1Z" fill="${middle}"/>` +
      `<path d="M0 -1.5 C-3 -2.5 -3 -5.5 -1.5 -8 C-.5 -6.5 .5 -7 1 -8.5 C1.5 -6.5 3 -5.5 2.8 -4 C2.6 -2.4 1.4 -1.4 0 -1.5Z" fill="${core}"/></g>`;
    body.insertAdjacentHTML('beforeend', '<svg class="pb-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      '<radialGradient id="pb-flame-glow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#f08a3c" stop-opacity="0"/></radialGradient>' +
      flame('pb-flame-a', '#f08a3c', '#f6b347', '#ffe7a3') +
      flame('pb-flame-b', '#f6a53c', '#ffd36b', '#fff2c2') +
      flame('pb-flame-c', '#e5692c', '#f39a3d', '#ffd98a') + '</defs></svg>');
  }

  // a row of flames along the whole line, each catching as the leading flame passes it
  const TRAVEL = 1900;
  function fillFlames(line, rtl, low) {
    const row = line.querySelector('.pb-fire__row');
    const width = line.clientWidth || 300;
    const phone = window.innerWidth < 600;
    const gap = low ? 20 : phone ? 22 : 28;
    const n = Math.max(6, Math.floor(width / gap));
    let html = '';
    for (let k = 0; k < n; k++) {
      const f = (k + 0.3 + ((k * 37) % 40) / 100) / n;
      const h = low ? 8 + (k * 7) % 5 : (phone ? 14 : 16) + (k * 13) % (phone ? 12 : 16);
      html += `<span class="pb-flm" style="left:${r1(f * 100)}%; --h:${h}px; --d:${Math.round((rtl ? 1 - f : f) * TRAVEL * 0.92)}ms">` +
        `<span class="pb-flm__size"><svg class="pb-flm__body" viewBox="-12 -32 24 33" style="--fd:${(0.13 + ((k * 7) % 13) / 100).toFixed(2)}s; --fo:-${((k * 11) % 9) / 10}s">` +
        `<use href="#pb-flame-${'abcab'[k % 5]}"/></svg></span></span>`;
    }
    row.innerHTML = html;
  }

  // the flames burn on while their divider is in view, and die down when you scroll away
  const burning = new Set();
  const burnWatch = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => {
    entry.target.classList.toggle('is-burning', entry.isIntersecting);
    sparkLoop();
  }), { rootMargin: '15% 0px 15% 0px' }) : null;

  // now and then, an ember lifts off a burning line (only while one is in view)
  let sparkTimer = 0;
  function sparkLoop() {
    if (sparkTimer || calm.matches) return;
    const tick = () => {
      const lit = [...burning].filter((l) => l.classList.contains('is-burning'));
      if (!lit.length || document.hidden) { sparkTimer = 0; return; }
      lit.forEach((l) => {
        if (l.querySelectorAll('.pb-fire__spark').length > 7) return;
        const s = document.createElement('i');
        s.className = 'pb-fire__spark';
        s.style.cssText = `left:${(4 + Math.random() * 92).toFixed(1)}%; --rise:${Math.round(22 + Math.random() * 22)}px; --drift:${Math.round(-10 + Math.random() * 20)}px`;
        s.addEventListener('animationend', () => s.remove(), { once: true });
        l.appendChild(s);
      });
      sparkTimer = window.setTimeout(tick, 260 + Math.random() * 420);
    };
    sparkTimer = window.setTimeout(tick, 400);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sparkLoop(); });
  sections.forEach((section, i) => {
    const first = !section.previousElementSibling || !section.previousElementSibling.matches('.project-section');
    const line = document.createElement('div');
    line.setAttribute('aria-hidden', 'true');
    if (theme === 'fire') {
      // The divider catches fire: a leading flame races along the whole line, and a row of flames
      // catches behind it, then keeps flickering (with warm light and the odd ember) while it's in
      // view, dying down to glowing embers when you scroll away. The ignition plays once.
      flameDefs();
      line.className = 'pb-line pb-fire' + (i % 2 ? ' pb-fire--rtl' : '') + (first ? ' pb-fire--low' : '');
      line.innerHTML = '<span class="pb-fire__light"></span><span class="pb-fire__trail"></span><span class="pb-fire__row"></span>' +
        '<span class="pb-fire__flame"><svg viewBox="-12 -32 24 33"><use href="#pb-flame-a"/></svg></span>';
      section.appendChild(line);
      fillFlames(line, i % 2 === 1, first);
      whenArrived(line, (el) => {
        el.classList.add('is-lit', 'is-burning');
        ignite();
        burning.add(el);
        if (burnWatch) burnWatch.observe(el);
        sparkLoop();
      });
    } else if (theme === 'aurora') {
      // aurora ribbons draw themselves along the line, then settle into a soft glow
      line.className = 'pb-line pb-aurora-line' + (first ? ' pb-aurora-line--low' : '');
      const id = 'pb-au' + (uid++);
      line.innerHTML = `<svg viewBox="0 0 1000 28" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" x2="1">` +
        '<stop offset="0" stop-color="#9db584"/><stop offset=".35" stop-color="#8fd3bd"/><stop offset=".68" stop-color="#b6a3dc"/><stop offset="1" stop-color="#93bde6"/></linearGradient></defs>' +
        `<path class="pb-au pb-au--glow" pathLength="1" d="M0 15 C160 4 320 26 500 14 S840 4 1000 15" stroke="url(#${id})" vector-effect="non-scaling-stroke"/>` +
        `<path class="pb-au pb-au--main" pathLength="1" d="M0 15 C160 4 320 26 500 14 S840 4 1000 15" stroke="url(#${id})" vector-effect="non-scaling-stroke"/>` +
        `<path class="pb-au pb-au--echo" pathLength="1" d="M0 11 C200 23 380 3 560 13 S860 23 1000 10" stroke="url(#${id})" vector-effect="non-scaling-stroke"/></svg>`;
      section.appendChild(line);
      whenArrived(line, addClass('is-drawn'));
      // a soft light settles behind each space as you reach it
      const lumen = document.createElement('span');
      lumen.className = 'pb-lumen';
      lumen.setAttribute('aria-hidden', 'true');
      lumen.style.setProperty('--glow', pick(['rgba(143, 211, 189, .32)', 'rgba(182, 163, 220, .3)', 'rgba(147, 189, 230, .3)', 'rgba(157, 181, 132, .3)'], i));
      section.prepend(lumen);
      whenArrived(section.querySelector('h2') || section, () => lumen.classList.add('is-lit'));
    } else if (theme === 'sun') {
      // a fine pencil line draws itself along the divider, with a few ruler ticks
      line.className = 'pb-line pb-pencil';
      let ticks = '';
      for (let t = 1; t < 10; t++) ticks += `<path class="pb-pencil__tick" style="--n:${t}" d="M${t * 100} ${t % 5 ? 11 : 8} L${t * 100} 13" vector-effect="non-scaling-stroke"/>`;
      line.innerHTML = '<svg viewBox="0 0 1000 16" preserveAspectRatio="none">' +
        '<path class="pb-pencil__line" pathLength="1" d="M1 13 L180 12.6 L420 13.3 L640 12.7 L860 13.2 L999 12.9" vector-effect="non-scaling-stroke"/>' +
        '<path class="pb-pencil__tick pb-pencil__end" d="M1 6 L1 16 M999 6 L999 16" vector-effect="non-scaling-stroke"/>' + ticks + '</svg>' +
        '<span class="pb-pencil__tip"><i></i></span>';   // a little pencil drawing the line as it goes
      section.appendChild(line);
      whenArrived(line, addClass('is-drawn'));
    }
  });

  // Lucy's Cottage: little architectural sketches settle beside the floor plan and design approach
  if (theme === 'sun') {
    const SKETCH = {
      plan: '<circle class="pb-sk" cx="26" cy="26" r="15" pathLength="1"/><path class="pb-sk" pathLength="1" d="M26 14 L31 33 L26 29 L21 33 Z"/><path class="pb-sk" pathLength="1" d="M23.5 6 L23.5 1 L28.5 6 L28.5 1"/>' +
        '<path class="pb-sk" pathLength="1" d="M60 92 L60 52 L140 52"/><path class="pb-sk" pathLength="1" d="M60 70 A22 22 0 0 1 82 92"/><path class="pb-sk" pathLength="1" d="M60 70 L82 70"/>' +
        '<path class="pb-sk pb-sk--dim" pathLength="1" d="M60 104 L140 104 M60 99 L60 109 M140 99 L140 109"/>',
      elevation: '<path class="pb-sk" pathLength="1" d="M30 100 L30 30 L110 30 L110 100"/><path class="pb-sk" pathLength="1" d="M42 42 L98 42 L98 80 L42 80 Z M70 42 L70 80 M42 61 L98 61"/>' +
        '<path class="pb-sk" pathLength="1" d="M20 100 L122 100"/><path class="pb-sk" pathLength="1" d="M118 100 L116 86 Q122 80 128 86 L126 100"/><path class="pb-sk" pathLength="1" d="M122 82 Q120 72 126 66 M122 82 Q128 74 134 74"/>' +
        '<path class="pb-sk pb-sk--dim" pathLength="1" d="M144 30 L144 100 M139 30 L149 30 M139 100 L149 100"/>'
    };
    sections.filter((s) => s.hasAttribute('data-sketch')).forEach((section) => {
      const svg = `<svg class="pb-sketch" viewBox="0 0 156 114" aria-hidden="true">${SKETCH[section.dataset.sketch] || SKETCH.plan}</svg>`;
      section.insertAdjacentHTML('beforeend', svg);
      const el = section.querySelector('.pb-sketch');
      el.querySelectorAll('.pb-sk').forEach((p, n) => p.style.setProperty('--n', n));
      // (below the "behind the bloom" icon too, when the heading has one: js/behind-bloom.js)
      const h2 = section.querySelector('.behind-bloom') || section.querySelector('h2');
      // under the heading, sized to the room the section actually has (two-column layouts only;
      // in one column it sits small at the top right, see the stylesheet)
      const place = () => {
        if (window.innerWidth <= 760) { el.removeAttribute('style'); return; }
        const top = h2.offsetTop + h2.offsetHeight + 18;
        const room = Math.min(114, section.clientHeight - top - 14);
        el.style.cssText = `top:${top}px; height:${Math.max(0, room)}px; width:${Math.round(Math.max(0, room) * 156 / 114)}px;` + (room < 48 ? ' display:none;' : '');
      };
      place();
      window.addEventListener('resize', place);
      whenArrived(el, addClass('is-drawn'));
    });
  }
  arrive();   // anything already in view appears straight away

  // ---- 4. The atmosphere behind the page ------------------------------------------------------
  const layer = (className, html) => {
    const el = document.createElement('div');
    el.className = className;
    el.setAttribute('aria-hidden', 'true');
    if (html) el.innerHTML = html;
    body.prepend(el);
    return el;
  };
  // something drifting now and then (embers rising, petals falling); paused while the tab is hidden
  function drift(container, every, most, make) {
    let timer = 0;
    const spawn = () => {
      timer = window.setTimeout(spawn, every[0] + Math.random() * (every[1] - every[0]));
      if (document.hidden || container.childElementCount >= most) return;
      const el = make();
      el.addEventListener('animationend', () => el.remove(), { once: true });
      container.appendChild(el);
    };
    spawn();
    document.addEventListener('visibilitychange', () => { window.clearTimeout(timer); if (!document.hidden) spawn(); });
  }

  if (theme === 'fire') {
    layer('pb-warmth');
    // the page warms a little once the final renderings come into view
    const warmFrom = main.querySelector('[data-warm]');
    if (warmFrom && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => entries.forEach((entry) => {
        const below = entry.boundingClientRect.top > window.innerHeight * 0.5;
        body.classList.toggle('is-warm', entry.isIntersecting || !below);
      }), { rootMargin: '0px 0px -35% 0px' }).observe(warmFrom);
    }
    if (!calm.matches) {
      const embers = layer('pb-embers');
      drift(embers, [600, 1600], 10, () => {
        const e = document.createElement('i');
        const size = 2.2 + Math.random() * 2.8;
        e.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%; width:${size.toFixed(1)}px; height:${size.toFixed(1)}px; ` +
          `--rise:${Math.round(160 + Math.random() * 240)}px; --sway:${Math.round(-30 + Math.random() * 60)}px; --dur:${(4.5 + Math.random() * 3).toFixed(1)}s`;
        return e;
      });
    }
  }

  if (theme === 'aurora') {
    // Aurora curtains behind the page: soft, striated veils of sage, icy cyan, violet and warm amber,
    // each rising and falling, folding, flowing and brightening at its own slow pace
    layer('pb-aurora', [1, 2, 3, 4, 5].map((n) => `<i class="pb-curtain pb-curtain--${n}"></i>`).join(''));
    // a dusky twilight band behind the Concept section, where the aurora glows most vividly
    main.querySelectorAll('[data-twilight]').forEach((s) => {
      s.insertAdjacentHTML('afterbegin', '<div class="pb-twilight" aria-hidden="true">' +
        [1, 2, 3, 4].map((n) => `<i class="pb-curtain pb-curtain--t${n}"></i>`).join('') + '<span class="pb-twilight__stars"></span></div>');
    });

    // the floor plan's aura zones flow while the plan is in view; choosing a colour in the legend
    // (hover, tap or keyboard) lights up its zones on the plan
    const plan = document.getElementById('aura-plan');
    if (plan) {
      if (!calm.matches && 'IntersectionObserver' in window) {
        new IntersectionObserver((entries) => entries.forEach((entry) => plan.classList.toggle('is-live', entry.isIntersecting))).observe(plan);
      }
      const keys = [...document.querySelectorAll('.aura-key')];
      let chosen = '';
      const focusZone = (zone) => { if (zone) plan.dataset.focus = zone; else delete plan.dataset.focus; };
      keys.forEach((key) => {
        key.addEventListener('click', () => {
          chosen = chosen === key.dataset.zone ? '' : key.dataset.zone;
          keys.forEach((k) => k.setAttribute('aria-pressed', String(k.dataset.zone === chosen)));
          focusZone(chosen);
        });
        key.addEventListener('mouseenter', () => focusZone(key.dataset.zone));
        key.addEventListener('mouseleave', () => focusZone(chosen));
      });
      // on phones the plan is shown large enough to read: start with its middle in view
      const scroller = plan.querySelector('.aura-plan__scroll');
      const centre = () => { if (scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2; };
      const planImg = plan.querySelector('img');
      if (planImg.complete) centre(); else planImg.addEventListener('load', centre, { once: true });
    }
  }
  if (theme === 'sun') {
    // warm sunlight slanting across and dappling the page, drifting slowly
    layer('pb-sunlight', '<i></i><i></i><i></i><i></i><b class="pb-dapple"></b><b class="pb-dapple"></b><b class="pb-dapple"></b>');
    if (!calm.matches) {
      // cosmos petals (blush, dusty pink, pale rose) drifting down on the breeze, behind the page so
      // they never cover the writing, renderings or menu. Each petal is three layers: one falls, one
      // drifts sideways (mostly one way, sometimes the other), and one flutters, tumbles and flips.
      const petals = layer('pb-petals');
      const COLOURS = [['#f6d2d8', '#e3a1ae'], ['#f1bcc5', '#d48795'], ['#fadfe3', '#ebb1bc'], ['#e8aab5', '#c97b8b'], ['#f4cdd0', '#dc96a0']];
      const phone = () => window.innerWidth < 640;
      const most = () => (phone() ? 16 : 30);   // how many drift at once (a gust may add a few more)
      let breeze = 1;   // which way the breeze blows; it changes now and then
      const petal = (gust, already) => {
        const p = document.createElement('i');
        const near = !gust && Math.random() < 0.12;   // now and then one close by: larger, softly out of focus
        const scale = phone() ? 0.8 : 1;
        const size = (near ? 26 + Math.random() * 14 : 10 + Math.random() * 11) * scale;
        const way = gust || Math.random() < 0.72 ? breeze : -breeze;
        const across = (gust ? 30 + Math.random() * 30 : 10 + Math.random() * 30) * way;   // vw
        const dur = gust ? 7 + Math.random() * 4 : near ? 8 + Math.random() * 4 : 12 + Math.random() * 9;
        const [light, deep] = COLOURS[Math.floor(Math.random() * COLOURS.length)];
        p.className = near ? 'is-near' : '';
        p.style.cssText = `left:${(Math.random() * 110 - 5 - across * 0.4).toFixed(1)}%; width:${size.toFixed(1)}px; height:${(size * 0.7).toFixed(1)}px; ` +
          `--dur:${dur.toFixed(1)}s; --delay:${already ? -(Math.random() * dur * 0.8).toFixed(1) : 0}s; --o:${near ? 0.55 : (0.78 + Math.random() * 0.2).toFixed(2)}; ` +
          `--across:${across.toFixed(1)}vw; --sway:${Math.round(10 + Math.random() * 40) * (Math.random() < 0.5 ? -1 : 1)}px; ` +
          `--spin:${Math.round((120 + Math.random() * 420) * (Math.random() < 0.5 ? -1 : 1))}deg; --c1:${light}; --c2:${deep}; ` +
          `--flip:${(0.9 + Math.random() * 1.8).toFixed(1)}s; --tilt:${Math.round(20 + Math.random() * 40)}deg`;
        p.innerHTML = '<span><b></b></span>';
        p.addEventListener('animationend', (e) => { if (e.target === p) p.remove(); });
        return p;
      };
      // the page opens with petals already on the air
      for (let n = 0; n < most() * 0.6; n++) petals.appendChild(petal(0, true));
      let timer = 0;
      const steady = () => {
        timer = window.setTimeout(steady, phone() ? 800 + Math.random() * 700 : 450 + Math.random() * 550);
        if (!document.hidden && petals.childElementCount < most()) petals.appendChild(petal(0));
      };
      steady();
      document.addEventListener('visibilitychange', () => { window.clearTimeout(timer); if (!document.hidden) steady(); });
      // a fuller gust as you scroll into a new section (now and then, never all at once)
      let lastGust = 0;
      const gust = () => {
        const now = Date.now();
        if (document.hidden || now - lastGust < 5000) return;
        lastGust = now;
        if (Math.random() < 0.35) breeze = -breeze;
        const extra = Math.min(phone() ? 8 : 14, most() + (phone() ? 6 : 12) - petals.childElementCount);
        for (let n = 0; n < extra; n++) window.setTimeout(() => petals.appendChild(petal(breeze)), n * 90 + Math.random() * 120);
      };
      sections.forEach((s) => whenArrived(s.querySelector('h2') || s, gust));
    }
  }

  // ---- 4b. Sections rest while they're out of sight ---------------------------------------------
  // Each section's own little animations (divider glows, curtains and stars, legend orbs, the
  // "behind the bloom" flowers) pause while the section is well off screen, and pick up again just
  // before it scrolls back into view. (One-off effects still wait for the section to arrive.)
  if ('IntersectionObserver' in window) {
    const rest = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle('pb-asleep', !entry.isIntersecting);
    }), { rootMargin: '200px 0px' });
    sections.forEach((section) => rest.observe(section));
  }

  // ---- 5. Quiet ambience (only if the visitor has sound on) -----------------------------------
  // LumiEdge: a soft fireplace crackle. Modunest: airy wind, a slow, soft pad and shimmering bells.
  // It follows the garden's own sound setting (kept for this visit); the speaker in the header turns
  // it on or off for the whole site. It never starts without a click or key press.
  const AC = window.AudioContext || window.webkitAudioContext;
  const SOUND_KEY = 'aDayInBloom.sound';   // the garden's own sound setting, kept for this visit
  const header = document.querySelector('.site-header');
  if ((theme === 'fire' || theme === 'aurora') && AC && header) {
    const fire = theme === 'fire';
    const KEY = SOUND_KEY;
    let on = false;
    try { on = sessionStorage.getItem(KEY) === 'on'; } catch (error) { /* storage blocked */ }
    let ctx = null;
    let master = null;
    let noise = null;
    let crackleTimer = 0;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pb-sound';
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M4.2 9.4 L7.6 9.3 L11.7 5.6 C12 5.4 12.3 5.6 12.3 5.9 L12.4 18 C12.4 18.4 12 18.6 11.7 18.3 L7.6 14.8 L4.3 14.7 C3.9 14.7 3.7 14.4 3.7 14.1 L3.6 10 C3.6 9.7 3.9 9.4 4.2 9.4 Z" fill="#efe3c8"/>' +
      '<g class="pb-sound__waves"><path d="M15.2 9.2 C16.4 10.6 16.5 13.3 15.3 14.8"/><path d="M17.7 6.9 C20.2 9.6 20.3 14.4 17.8 17.1"/></g>' +
      '<g class="pb-sound__hush"><path d="M15.6 9.8 L20 14.3 M20.1 9.7 L15.7 14.2"/></g></svg>';
    header.appendChild(btn);
    const show = () => {
      const name = fire ? 'fireplace' : 'aurora';
      const label = on ? `Turn the ${name} sound off` : `Turn the ${name} sound on`;
      btn.dataset.sound = on ? 'on' : 'off';
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.setAttribute('aria-pressed', String(on));
    };
    show();

    function build() {
      if (ctx) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {   // a soft brownish noise for the fire's breath
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        data[i] = last * 3.5;
      }
      noise = buffer;
      if (!fire) { buildAurora(); return; }
      // the steady, low roar of the flames, breathing slowly
      const bed = ctx.createBufferSource();
      bed.buffer = noise;
      bed.loop = true;
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 420;
      const bedLevel = ctx.createGain();
      bedLevel.gain.value = 0.16;
      const breath = ctx.createOscillator();
      breath.frequency.value = 0.13;
      const breathDepth = ctx.createGain();
      breathDepth.gain.value = 0.05;
      breath.connect(breathDepth).connect(bedLevel.gain);
      bed.connect(low).connect(bedLevel).connect(master);
      bed.start();
      breath.start();
    }

    // Modunest's sky: wind that breathes and moves across the room, and a slow, soft pad beneath it
    function buildAurora() {
      const wind = ctx.createBufferSource();
      wind.buffer = noise;
      wind.loop = true;
      const air = ctx.createBiquadFilter();
      air.type = 'bandpass';
      air.Q.value = 0.7;
      air.frequency.value = 520;
      const sweep = ctx.createOscillator();   // the wind's colour drifts slowly
      sweep.frequency.value = 0.05;
      const sweepDepth = ctx.createGain();
      sweepDepth.gain.value = 260;
      sweep.connect(sweepDepth).connect(air.frequency);
      const windLevel = ctx.createGain();
      windLevel.gain.value = 0.22;
      const gust = ctx.createOscillator();     // ...and swells and settles
      gust.frequency.value = 0.09;
      const gustDepth = ctx.createGain();
      gustDepth.gain.value = 0.1;
      gust.connect(gustDepth).connect(windLevel.gain);
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
      if (pan.pan) {
        const roam = ctx.createOscillator();    // moving slowly from side to side
        roam.frequency.value = 0.035;
        const roamDepth = ctx.createGain();
        roamDepth.gain.value = 0.6;
        roam.connect(roamDepth).connect(pan.pan);
        roam.start();
      }
      wind.connect(air).connect(windLevel).connect(pan).connect(master);
      // a soft, low pad: two gentle tones a fifth apart, breathing slowly
      const pad = ctx.createGain();
      pad.gain.value = 0.035;
      const swell = ctx.createOscillator();
      swell.frequency.value = 0.07;
      const swellDepth = ctx.createGain();
      swellDepth.gain.value = 0.02;
      swell.connect(swellDepth).connect(pad.gain);
      [[146.8, -4], [220, 3], [293.7, 6]].forEach(([f, detune]) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(pad);
        o.start();
      });
      pad.connect(master);
      [wind, sweep, gust, swell].forEach((n) => n.start());
    }

    // now and then, a shimmer: a few soft, high bell tones like light catching the sky
    function shimmer() {
      if (!ctx || ctx.state !== 'running' || Math.random() < 0.45) return;
      const notes = [1174.7, 1318.5, 1568, 1760, 2093, 2349.3];
      const t = ctx.currentTime + 0.05;
      for (let k = 0, n = 2 + Math.floor(Math.random() * 3); k < n; k++) {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
        const g = ctx.createGain();
        const at = t + k * (0.18 + Math.random() * 0.25);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.05, at + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 2.6);
        o.connect(g).connect(master);
        o.start(at);
        o.stop(at + 2.7);
      }
    }

    // the crackles: tiny bright snaps and the odd deeper pop, in irregular little clusters
    function crackle() {
      if (!fire) { shimmer(); return; }
      if (!ctx || ctx.state !== 'running') return;
      const now = ctx.currentTime;
      let t = now + 0.05;
      while (t < now + 0.45) {
        const pop = Math.random() < 0.18;
        const src = ctx.createBufferSource();
        src.buffer = noise;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass';
        band.frequency.value = pop ? 500 + Math.random() * 900 : 1800 + Math.random() * 3600;
        band.Q.value = pop ? 2 : 1.2;
        const g = ctx.createGain();
        const peak = pop ? 0.5 + Math.random() * 0.5 : 0.12 + Math.random() * 0.4;
        const len = pop ? 0.03 + Math.random() * 0.05 : 0.004 + Math.random() * 0.018;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        src.connect(band).connect(g).connect(master);
        src.start(t, Math.random() * 1.8, len + 0.05);
        t += Math.random() < 0.3 ? 0.02 + Math.random() * 0.06 : 0.12 + Math.random() * 0.5;
      }
    }

    // as a divider catches: a soft rush of air and a few bright pops (only while the crackle is playing)
    if (fire) ignite = () => {
      if (!on || !ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime + 0.02;
      for (let p = 0; p < 5; p++) {
        const at = t + 0.18 + p * (0.12 + Math.random() * 0.18);
        const pop = ctx.createBufferSource();
        pop.buffer = noise;
        const ring = ctx.createBiquadFilter();
        ring.type = 'bandpass';
        ring.frequency.value = 1400 + Math.random() * 2600;
        const pg = ctx.createGain();
        pg.gain.setValueAtTime(0.0001, at);
        pg.gain.exponentialRampToValueAtTime(0.35 + Math.random() * 0.35, at + 0.002);
        pg.gain.exponentialRampToValueAtTime(0.0001, at + 0.02 + Math.random() * 0.03);
        pop.connect(ring).connect(pg).connect(master);
        pop.start(at, Math.random() * 1.5, 0.08);
      }
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.value = 0.8;
      band.frequency.setValueAtTime(260, t);
      band.frequency.exponentialRampToValueAtTime(1300, t + 0.35);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      src.connect(band).connect(g).connect(master);
      src.start(t, Math.random(), 0.8);
    };

    // behind the bloom (js/behind-bloom.js): the designer's note's paper rustles (see paperRustle below)
    document.addEventListener('pb:paper', (event) => {
      if (!on || document.hidden) return;
      build();
      const play = () => paperRustle(ctx, !!(event.detail && event.detail.open));
      if (ctx.state === 'running') play(); else ctx.resume().then(play).catch(() => { /* not yet allowed */ });
    });

    function start() {
      if (!on || document.hidden) return;
      build();
      const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
      resumed.then(() => {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(fire ? 0.11 : 0.13, ctx.currentTime, 0.8);   // quiet, in the background
        window.clearInterval(crackleTimer);
        crackleTimer = window.setInterval(crackle, fire ? 400 : 1500);
        crackle();
      }).catch(() => { /* the browser said not yet: it'll start on the next click */ });
    }
    function stop(seconds) {
      window.clearInterval(crackleTimer);
      crackleTimer = 0;
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, seconds / 3);
      window.setTimeout(() => { if (ctx && ctx.state === 'running' && !crackleTimer) ctx.suspend(); }, seconds * 1000 + 100);
    }

    btn.addEventListener('click', () => {
      on = !on;
      try { sessionStorage.setItem(KEY, on ? 'on' : 'off'); } catch (error) { /* ignore */ }
      show();
      if (on) start();
      else stop(0.6);
    });
    // sound was already on in the garden: browsers only allow it to begin after a click or key press,
    // so the crackle fades in on the visitor's first one
    const firstTouch = (event) => {
      if (event.target.closest && event.target.closest('.pb-sound')) return;
      if (on && (!ctx || ctx.state !== 'running')) start();
    };
    ['pointerdown', 'keydown', 'touchend'].forEach((type) => document.addEventListener(type, firstTouch, true));
    // quiet whenever the page is hidden or left
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(0.3); else if (on && ctx) start(); });
    window.addEventListener('pagehide', () => stop(0.1));
    window.addEventListener('pageshow', (event) => { if (event.persisted && on && ctx) start(); });
  } else if (AC) {
    // pages without an ambience of their own (Lucy's Cottage): a designer's note's paper still rustles,
    // following the garden's own sound setting (kept for this visit), and only when it's on
    let ctx = null;
    document.addEventListener('pb:paper', (event) => {
      let on = false;
      try { on = sessionStorage.getItem(SOUND_KEY) === 'on'; } catch (error) { /* storage blocked */ }
      if (!on || document.hidden) return;
      if (!ctx) ctx = new AC();
      const play = () => paperRustle(ctx, !!(event.detail && event.detail.open));
      if (ctx.state === 'running') play(); else ctx.resume().then(play).catch(() => { /* not yet allowed */ });
    });
    window.addEventListener('pagehide', () => { if (ctx && ctx.state === 'running') ctx.suspend(); });
  }

  // behind the bloom: a note's paper rustles softly as it unfolds (a quick sweep of airy noise and a
  // few tiny crinkles), and a shorter rustle as it folds away
  function paperRustle(ctx, opening) {
    const t = ctx.currentTime + 0.01;
    if (!ctx.paperNoise) {
      ctx.paperNoise = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const data = ctx.paperNoise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const level = ctx.createGain();
    level.gain.value = 0.5;
    level.connect(ctx.destination);
    const sweep = ctx.createBufferSource();
    sweep.buffer = ctx.paperNoise;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.9;
    const len = opening ? 0.42 : 0.26;
    band.frequency.setValueAtTime(opening ? 900 : 3200, t);
    band.frequency.exponentialRampToValueAtTime(opening ? 3600 : 1100, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    sweep.connect(band).connect(g).connect(level);
    sweep.start(t, 0, len + 0.05);
    for (let k = 0, n = opening ? 6 : 3; k < n; k++) {
      const at = t + Math.random() * len * 0.85;
      const crinkle = ctx.createBufferSource();
      crinkle.buffer = ctx.paperNoise;
      const high = ctx.createBiquadFilter();
      high.type = 'highpass';
      high.frequency.value = 2600 + Math.random() * 2400;
      const cg = ctx.createGain();
      const d = 0.012 + Math.random() * 0.03;
      cg.gain.setValueAtTime(0.0001, at);
      cg.gain.exponentialRampToValueAtTime(0.03 + Math.random() * 0.05, at + 0.003);
      cg.gain.exponentialRampToValueAtTime(0.0001, at + d);
      crinkle.connect(high).connect(cg).connect(level);
      crinkle.start(at, Math.random() * 0.5, d + 0.02);
    }
  }
})();
