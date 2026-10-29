/* ==========================================================================
   A Day in Bloom · behind the bloom ♡
   Tiny hand-drawn icons (a sprig, a pencil, a bloom, a ranunculus or a cosmos:
   each button's data-icon) under a few headings open scrapbook-style designer's
   notes. Used on LumiEdge, Modunest (where the icons glow with the aurora) and
   Lucy's Cottage (where the cosmos sway, and a few petals drift as a note opens). The notes' words live in the project page itself (each one is a
   <dialog class="bloom-note">, opened by the button whose aria-controls names
   it); this file only adds the pressed flowers and washi tape, and opens and
   closes the notes with a gentle paper unfolding.
     · open: tap or click the flower (or Enter / Space)
     · close: the × , the Esc key, or a tap outside the note
   If the visitor has sound on, the paper rustles softly (the page's own sound,
   in js/project-bloom.js, listens for "pb:paper"). Styles: css/behind-bloom.css.
   With reduced motion, the notes simply fade in and out.
   ========================================================================== */
(function () {
  'use strict';

  const seeds = [...document.querySelectorAll('.behind-bloom__seed')];
  if (!seeds.length) return;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---- The little hand-drawn icons (24 x 24), chosen by each button's data-icon ----------------
  const icon = (art) => `<svg class="behind-bloom__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${art}</svg>`;
  const ICONS = {
    // a snapdragon sprig
    sprig: icon('<path d="M12.6 22 C12.2 16 12.8 10 11.6 3.2" fill="none" stroke="#6f8a58" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M12.4 17.5 C9.6 16.8 7.6 14.6 7 12.4 C9.6 13 11.6 14.8 12.4 17.5Z" fill="#9db584"/>' +
      '<path d="M12.6 14.6 C15 14 16.8 12.2 17.4 10.2 C15 10.7 13.2 12.3 12.6 14.6Z" fill="#8fa871"/>' +
      '<ellipse cx="10.4" cy="11.2" rx="2.3" ry="1.8" fill="#e3a9b0"/><ellipse cx="13.6" cy="9" rx="2.1" ry="1.7" fill="#f1c9c8"/>' +
      '<ellipse cx="10.6" cy="6.8" rx="1.9" ry="1.5" fill="#d98c9c"/><ellipse cx="13" cy="4.9" rx="1.5" ry="1.2" fill="#f1c9c8"/>' +
      '<ellipse cx="11.4" cy="2.8" rx=".9" ry="1.2" fill="#c9d6a8"/>'),
    // a pencil, mid-sketch, with a little graphite line
    pencil: icon('<path d="M4.2 20.6 C7 19.6 9.6 20.4 12.2 19.5" fill="none" stroke="#8a7f72" stroke-width=".9" stroke-linecap="round"/>' +
      '<path d="M7.4 16.4 L17.6 6.2 L20.2 8.8 L10 19 Z" fill="#e9c47c" stroke="#b58c4a" stroke-width=".6" stroke-linejoin="round"/>' +
      '<path d="M17.6 6.2 L18.9 4.9 C19.3 4.5 20 4.5 20.4 4.9 L21.5 6 C21.9 6.4 21.9 7.1 21.5 7.5 L20.2 8.8 Z" fill="#e3a9b0" stroke="#b7707f" stroke-width=".6"/>' +
      '<path d="M16.6 7.2 L19.2 9.8" stroke="#c9d6a8" stroke-width="1.2"/>' +
      '<path d="M7.4 16.4 L10 19 L5.6 20.8 Z" fill="#f5e6c8" stroke="#b58c4a" stroke-width=".6" stroke-linejoin="round"/>' +
      '<path d="M6.3 19.1 L7.3 20.1 L5.6 20.8 Z" fill="#4a4540"/>'),
    // a small open bloom with a bud and a leaf
    bloom: icon('<path d="M12 21.5 C12.3 18 11.6 15.4 12 12.6" fill="none" stroke="#6f8a58" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M12.1 18.6 C9.4 18.4 7.6 16.8 7 14.8 C9.4 15 11.4 16.4 12.1 18.6Z" fill="#9db584"/>' +
      '<path d="M12 21 C13.6 19.6 15.6 19.2 17.4 19.6" fill="none" stroke="#6f8a58" stroke-width=".9" stroke-linecap="round"/><ellipse cx="17.8" cy="18.8" rx="1.3" ry="1.8" fill="#e3a9b0" transform="rotate(40 17.8 18.8)"/>' +
      [0, 72, 144, 216, 288].map((a) => `<ellipse cx="12" cy="5.6" rx="2.6" ry="3.4" fill="${a % 144 ? '#f1c9c8' : '#e3a9b0'}" stroke="#c98490" stroke-opacity=".45" stroke-width=".5" transform="rotate(${a} 12 9.4)"/>`).join('') +
      '<circle cx="12" cy="9.4" r="1.7" fill="#e2b546"/>'),
    // a ranunculus (Modunest): butter-yellow and peach ruffled rings on a short stem
    ranunculus: icon('<path d="M12 22 C12.4 19 11.6 17 12 14.6" fill="none" stroke="#6f8a58" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M12 19.6 C9.6 19.6 7.8 18.4 7 16.6 C9.4 16.6 11.2 17.6 12 19.6Z" fill="#9db584"/>' +
      ruffle(12, 9.6, 6.4, '#f1d27f', '#c9a14a', 9, 0) + ruffle(12, 9.6, 4.4, '#f3bb98', '#c98466', 7, 0.4) +
      ruffle(12, 9.6, 2.5, '#f8e6b0', '#c9a14a', 6, 0.9) + '<circle cx="12" cy="9.6" r=".9" fill="#b9c27a"/>'),
    // a blush-pink cosmos (Lucy's Cottage) with sage leaves and a tiny bud
    cosmos: icon('<path d="M12 22 C12.6 18.6 11.4 15.6 12 12" fill="none" stroke="#6f8a58" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M12.1 19.2 C9.4 19 7.6 17.4 7 15.4 C9.4 15.6 11.4 17 12.1 19.2Z" fill="#9db584"/>' +
      '<path d="M12 21 C14 19.8 15.8 18 16.4 16" fill="none" stroke="#6f8a58" stroke-width=".8" stroke-linecap="round"/>' +
      '<ellipse cx="16.6" cy="15.2" rx="1.1" ry="1.6" fill="#e8a7b3" transform="rotate(25 16.6 15.2)"/><path d="M15.7 16.2 Q16.5 17 17.4 16.1" fill="#9db584"/>' +
      '<g class="behind-bloom__petals">' + cosmosPetals(12, 8.6, 1, ['#f1c0c8', '#e7a1b0']) + '</g>' +
      '<circle cx="12" cy="8.6" r="1.6" fill="#e2b546"/><circle cx="12" cy="8.6" r=".7" fill="#b98a2c"/>')
  };
  // eight notched cosmos petals around (x, y), alternating two shades (k: size)
  function cosmosPetals(x, y, k, shades) {
    let out = '';
    for (let p = 0; p < 8; p++) {
      out += `<path d="M0 -1.2 C-2.4 -2.8 -2.7 -6.8 -1.6 -8.4 L-.8 -7.7 L0 -8.8 L.8 -7.7 L1.6 -8.4 C2.7 -6.8 2.4 -2.8 0 -1.2Z" ` +
        `fill="${shades[p % 2]}" transform="translate(${x} ${y}) rotate(${p * 45}) scale(${k * 0.78})"/>`;
    }
    return out;
  }
  // a ring of ruffled ranunculus petals around (x, y)
  function ruffle(x, y, r, fill, edge, n, turn) {
    let out = `<circle cx="${x}" cy="${y}" r="${(r * 0.74).toFixed(2)}" fill="${fill}"/>`;
    for (let p = 0; p < n; p++) {
      const a = p / n * Math.PI * 2 + turn;
      out += `<circle cx="${(x + Math.cos(a) * r * 0.6).toFixed(2)}" cy="${(y + Math.sin(a) * r * 0.6).toFixed(2)}" r="${(r * 0.42).toFixed(2)}" fill="${fill}" stroke="${edge}" stroke-opacity=".35" stroke-width=".4"/>`;
    }
    return out;
  }

  // a pressed snapdragon stem, flattened and a little faded, as if dried between pages (60 x 130)
  function pressedStem(shades) {
    let florets = '';
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const y = 92 - t * 78;
      const x = 30 + Math.sin(t * 2.4) * 3;
      const side = i % 2 ? 1 : -1;
      const s = 1 - t * 0.45;
      florets += `<ellipse cx="${(x + side * 4.6 * s).toFixed(1)}" cy="${y.toFixed(1)}" rx="${(5.6 * s).toFixed(1)}" ry="${(4.3 * s).toFixed(1)}" ` +
        `fill="${shades[i % shades.length]}" stroke="#b7707f" stroke-opacity=".28" stroke-width=".5" transform="rotate(${side * 18} ${(x + side * 4.6 * s).toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return '<svg class="bloom-note__pressed" viewBox="0 0 60 130" aria-hidden="true" focusable="false">' +
      '<path d="M31 128 C29 100 33 60 29 10" fill="none" stroke="#7f9a64" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M30.5 112 C22 108 15 100 13 90 C21 93 28 101 30.5 112Z" fill="#9db584"/><path d="M30.5 112 L16 93" stroke="#f8f3e7" stroke-opacity=".4" stroke-width=".6"/>' +
      '<path d="M31 104 C39 101 45 94 47 85 C40 88 33 95 31 104Z" fill="#8fa871"/><path d="M31 104 L45 87" stroke="#f8f3e7" stroke-opacity=".4" stroke-width=".6"/>' +
      florets + '<ellipse cx="29.6" cy="9" rx="1.8" ry="3" fill="#c9d6a8"/></svg>';
  }
  // a pressed ranunculus (Modunest): its ruffled head flattened open, on a stem with two leaves (60 x 130)
  const RANUNCULUS_SHADES = [['#f1d27f', '#f3bb98', '#f8e6b0'], ['#f3bb98', '#f6c98c', '#fbe5c3'], ['#f6c98c', '#f1d27f', '#fdf5dc']];
  function pressedRanunculus(shades) {
    return '<svg class="bloom-note__pressed" viewBox="0 0 60 130" aria-hidden="true" focusable="false">' +
      '<path d="M31 128 C28 100 33 70 30 34" fill="none" stroke="#7f9a64" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M30.5 108 C22 104 15 96 13 86 C21 89 28 97 30.5 108Z" fill="#9db584"/><path d="M30.5 108 L16 89" stroke="#f8f3e7" stroke-opacity=".4" stroke-width=".6"/>' +
      '<path d="M31 92 C39 89 45 82 47 73 C40 76 33 83 31 92Z" fill="#8fa871"/><path d="M31 92 L45 75" stroke="#f8f3e7" stroke-opacity=".4" stroke-width=".6"/>' +
      ruffle(30, 24, 19, shades[0], '#b98a4c', 11, 0) + ruffle(30, 24, 13, shades[1], '#b98a4c', 9, 0.3) +
      ruffle(30, 24, 7.5, shades[2], '#b98a4c', 7, 0.8) + '<circle cx="30" cy="24" r="2.2" fill="#b9c27a"/></svg>';
  }
  // a pressed cosmos (Lucy's Cottage): one open bloom and a bud on a slender stem with fine leaves (60 x 130)
  const COSMOS_SHADES = [['#f1c0c8', '#e3a1ae'], ['#f6d4d9', '#e8b0ba'], ['#eaa9b6', '#f3c9cf']];
  function pressedCosmos(shades) {
    return '<svg class="bloom-note__pressed" viewBox="0 0 60 130" aria-hidden="true" focusable="false">' +
      '<path d="M31 128 C28 100 34 70 30 32" fill="none" stroke="#7f9a64" stroke-width="1.5" stroke-linecap="round"/>' +
      '<path d="M30.5 96 C38 88 41 78 46 70" fill="none" stroke="#7f9a64" stroke-width="1.1" stroke-linecap="round"/>' +
      '<ellipse cx="46.6" cy="67" rx="3" ry="4.6" fill="#e8a7b3" transform="rotate(22 46.6 67)"/><path d="M44.2 70 Q46.6 72.4 49 69.4" fill="#9db584"/>' +
      '<path d="M30.6 112 C24 108 19 101 16 92 M30.6 112 C27 103 26 96 21 88 M30.4 104 C36 100 40 94 41 86" fill="none" stroke="#9db584" stroke-width="1.2" stroke-linecap="round"/>' +
      cosmosPetals(30, 26, 2.7, shades) + '<circle cx="30" cy="26" r="4" fill="#e2b546"/><circle cx="30" cy="26" r="1.8" fill="#b98a2c"/></svg>';
  }
  const ranunculusPage = document.body.dataset.bloom === 'ranunculus';
  const cosmosPage = document.body.dataset.bloom === 'cosmos';
  // Lucy's Cottage: a few soft pink petals drift out from the paper as a note opens
  function petalPuff(paper) {
    if (calm.matches) return;
    const colours = ['#f1c0c8', '#f6d4d9', '#e7a1b0', '#fbe3e6'];
    for (let n = 0; n < 9; n++) {
      const p = document.createElement('span');
      p.className = 'bloom-note__petal';
      p.setAttribute('aria-hidden', 'true');
      const a = Math.random() * Math.PI * 2;
      const d = 70 + Math.random() * 90;
      p.style.cssText = `left:${(10 + Math.random() * 80).toFixed(1)}%; top:${(15 + Math.random() * 60).toFixed(1)}%; background:${colours[n % 4]}; ` +
        `--dx:${Math.round(Math.cos(a) * d)}px; --dy:${Math.round(Math.sin(a) * d * 0.6 + 40)}px; --spin:${Math.round(-260 + Math.random() * 520)}deg; ` +
        `--size:${(7 + Math.random() * 6).toFixed(1)}px; animation-delay:${Math.round(120 + n * 40)}ms`;
      p.addEventListener('animationend', () => p.remove(), { once: true });
      paper.appendChild(p);
    }
  }
  // a single pressed leaf and a loose floret, tucked under the tape
  const PRESSED_LEAF = '<svg class="bloom-note__leaf" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<path d="M6 34 C8 20 18 9 34 6 C31 21 21 31 6 34Z" fill="#a3bd88"/><path d="M6 34 C15 25 23 16 33 7" fill="none" stroke="#f8f3e7" stroke-opacity=".5" stroke-width=".8"/>' +
    '<ellipse cx="30" cy="30" rx="4.6" ry="3.6" fill="#f1c9c8" stroke="#b7707f" stroke-opacity=".25" stroke-width=".5" transform="rotate(-24 30 30)"/></svg>';
  const SHADES = [['#e3a9b0', '#f1c9c8', '#d98c9c'], ['#f1c9c8', '#e8b4bd', '#f6dcd9'], ['#d98c9c', '#e3a9b0', '#f1c9c8']];
  const CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7.4 C10 10.2 13.6 13.8 17 16.8 M16.8 7 C13.8 10.4 10.4 13.6 7.2 17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

  // the paper rustles (only if the visitor has the page's sound on; see js/project-bloom.js)
  const rustle = (open) => document.dispatchEvent(new CustomEvent('pb:paper', { detail: { open } }));

  // ---- Each note ----------------------------------------------------------------------------
  seeds.forEach((seed, i) => {
    const note = document.getElementById(seed.getAttribute('aria-controls'));
    if (!note) return;
    seed.insertAdjacentHTML('afterbegin', ICONS[seed.dataset.icon] || ICONS.sprig);
    seed.setAttribute('aria-expanded', 'false');

    // dress the note: washi tape, a pressed leaf, a pressed flower of the page's own kind (a snapdragon
    // for LumiEdge, a ranunculus for Modunest, a cosmos for Lucy's Cottage), and the little × to close it
    const paper = note.querySelector('.bloom-note__paper');
    if (!paper.querySelector('.bloom-note__tape')) {
      paper.insertAdjacentHTML('afterbegin', '<span class="bloom-note__tape bloom-note__tape--sage" aria-hidden="true"></span>' +
        '<span class="bloom-note__tape bloom-note__tape--blush" aria-hidden="true"></span>' + PRESSED_LEAF);
      paper.insertAdjacentHTML('beforeend', ranunculusPage ? pressedRanunculus(RANUNCULUS_SHADES[i % 3])
        : cosmosPage ? pressedCosmos(COSMOS_SHADES[i % 3]) : pressedStem(SHADES[i % SHADES.length]));
      note.querySelector('.bloom-note__close').innerHTML = CLOSE;
    }

    let closing = false;
    const open = () => {
      if (note.open) return;
      closing = false;
      note.classList.remove('is-closing');
      if (typeof note.showModal === 'function') note.showModal(); else note.setAttribute('open', '');
      document.documentElement.classList.add('has-bloom-note');
      seed.setAttribute('aria-expanded', 'true');
      note.querySelector('.bloom-note__inner').scrollTop = 0;
      note.querySelector('.bloom-note__close').focus();
      rustle(true);
      if (cosmosPage) petalPuff(paper);
    };
    // the paper folds away, then the note closes
    const close = () => {
      if (!note.open || closing) return;
      closing = true;
      rustle(false);
      const done = () => {
        if (!closing) return;
        closing = false;
        note.classList.remove('is-closing');
        if (typeof note.close === 'function') note.close(); else note.removeAttribute('open');
      };
      if (calm.matches) { done(); return; }
      note.classList.add('is-closing');
      // (only the paper's own fold counts, not a petal finishing its drift)
      const folded = (event) => { if (event.target === paper) { paper.removeEventListener('animationend', folded); done(); } };
      paper.addEventListener('animationend', folded);
      window.setTimeout(done, 400);   // in case the animation doesn't run
    };

    seed.addEventListener('click', open);
    note.querySelector('.bloom-note__close').addEventListener('click', close);
    // the Esc key folds the paper away too, instead of snapping it shut
    note.addEventListener('cancel', (event) => { event.preventDefault(); close(); });
    // a tap or click outside the paper (on the dimmed page) closes it
    note.addEventListener('click', (event) => { if (event.target === note) close(); });
    note.addEventListener('close', () => {
      document.documentElement.classList.remove('has-bloom-note');
      seed.setAttribute('aria-expanded', 'false');
      seed.focus({ preventScroll: true });
    });
  });
})();
