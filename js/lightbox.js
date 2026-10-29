/* ==========================================================================
   A Day in Bloom · click to enlarge (the project pages)
   Every project image (renderings, floor plans, sections, material boards and
   samples) can be opened large in a soft cream lightbox, at the image's full
   quality and never cropped, with its caption below.
     · open: click or tap the image (or Tab to it, then Enter / Space);
       a little magnifying glass appears on hover
     · zoom: mouse wheel or trackpad pinch, pinch on a phone, double-click or
       double-tap, or the + / − buttons and keys; drag to look around
     · move between images: the arrows, or ← → keys
     · close: the ×, Esc, or a click on the cream space outside the image
   Modunest's interactive plan opens as its plain labelled drawing; the colour
   legend beside it works exactly as before. Styles: css/lightbox.css.
   ========================================================================== */
(function () {
  'use strict';

  const main = document.querySelector('main.project');
  if (!main) return;
  const root = document.documentElement;

  const MAGNIFIER = '<span class="lb-badge" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">' +
    '<circle cx="10.2" cy="10.2" r="5.6" fill="#fffaf0" stroke="#5f7357" stroke-width="1.7"/>' +
    '<path d="M14.4 14.4 L19 19" stroke="#5f7357" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M10.2 7.8 V12.6 M7.8 10.2 H12.6" stroke="#d98c9c" stroke-width="1.5" stroke-linecap="round"/></svg></span>';

  // ---- The images that can be enlarged, in page order ---------------------------------------------
  const items = [];
  main.querySelectorAll('.project-figure img, .material-samples img').forEach((img) => {
    const plan = img.closest('.aura-plan');
    let frame;
    if (plan) {
      frame = plan.querySelector('.aura-plan__frame');   // Modunest's plan: its own frame opens it
    } else {
      frame = document.createElement('span');            // a frame exactly the image's size, for the magnifier
      frame.className = 'lb-frame';
      img.replaceWith(frame);
      frame.appendChild(img);
    }
    const figure = img.closest('figure');
    const sample = img.closest('.material-samples li');
    const caption = figure && figure.querySelector('figcaption') ? figure.querySelector('figcaption').textContent.trim()
      : sample && sample.querySelector('span') ? sample.querySelector('span').textContent.trim() : '';
    frame.classList.add('lb-trigger');
    frame.setAttribute('role', 'button');
    frame.tabIndex = 0;
    frame.setAttribute('aria-label', 'Enlarge image: ' + (caption || img.alt));
    frame.insertAdjacentHTML('beforeend', MAGNIFIER);
    const index = items.length;
    items.push({ img, caption });
    frame.addEventListener('click', () => open(index, frame));
    frame.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(index, frame); }
    });
  });
  if (!items.length) return;

  // ---- The lightbox ---------------------------------------------------------------------------------
  const arrow = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const box = document.createElement('dialog');
  box.className = 'lightbox';
  box.setAttribute('aria-label', 'Enlarged image');
  box.innerHTML = '<div class="lightbox__stage"><img class="lightbox__img" alt="" draggable="false"></div>' +
    '<div class="lightbox__bar"><p class="lightbox__caption"></p><p class="lightbox__count" aria-live="polite"></p></div>' +
    '<div class="lightbox__tools">' +
    `<button class="lightbox__button" type="button" data-zoom="out" aria-label="Zoom out">${arrow('M7 12 H17')}</button>` +
    `<button class="lightbox__button" type="button" data-zoom="in" aria-label="Zoom in">${arrow('M7 12 H17 M12 7 V17')}</button></div>` +
    `<button class="lightbox__button lightbox__close" type="button" aria-label="Close">${arrow('M7 7.4 C10 10.2 13.6 13.8 17 16.8 M16.8 7 C13.8 10.4 10.4 13.6 7.2 17')}</button>` +
    `<button class="lightbox__button lightbox__arrow lightbox__arrow--prev" type="button" aria-label="Previous image">${arrow('M14.5 6 L8.5 12 L14.5 18')}</button>` +
    `<button class="lightbox__button lightbox__arrow lightbox__arrow--next" type="button" aria-label="Next image">${arrow('M9.5 6 L15.5 12 L9.5 18')}</button>`;
  document.body.appendChild(box);
  const stage = box.querySelector('.lightbox__stage');
  const picture = box.querySelector('.lightbox__img');
  const captionEl = box.querySelector('.lightbox__caption');
  const countEl = box.querySelector('.lightbox__count');
  box.classList.toggle('is-single', items.length < 2);

  let current = 0;
  let opener = null;
  let scale = 1;
  let tx = 0;
  let ty = 0;

  function show(index) {
    current = (index + items.length) % items.length;
    const { img, caption } = items[current];
    // the page shows a lighter copy of each picture; here the full original opens (data-full), at full quality
    picture.src = full(img);
    picture.alt = img.alt;
    captionEl.textContent = caption;
    captionEl.hidden = !caption;
    countEl.textContent = items.length > 1 ? `${current + 1} / ${items.length}` : '';
    reset(false);
    // the neighbours load quietly, so the arrows feel instant
    [current - 1, current + 1].forEach((n) => { new Image().src = full(items[(n + items.length) % items.length].img); });
  }
  const full = (img) => (img.dataset.full ? new URL(img.dataset.full, document.baseURI).href : img.currentSrc || img.src);
  function open(index, from) {
    opener = from;
    show(index);
    if (typeof box.showModal === 'function') box.showModal(); else box.setAttribute('open', '');
    root.classList.add('has-lightbox');
    box.querySelector('.lightbox__close').focus();
  }
  function close() {
    if (typeof box.close === 'function') box.close(); else { box.removeAttribute('open'); box.dispatchEvent(new Event('close')); }
  }
  box.addEventListener('close', () => {
    root.classList.remove('has-lightbox');
    picture.removeAttribute('src');
    if (opener) opener.focus({ preventScroll: true });
  });

  // ---- Zooming and looking around ---------------------------------------------------------------
  // The picture is fitted whole first (scale 1); zooming enlarges it around the point you're looking
  // at, and it can be dragged around, but never further than its own edges.
  const maxScale = () => Math.max(4, picture.naturalWidth / Math.max(1, picture.offsetWidth) * 2);
  function apply() {
    const w = picture.offsetWidth * scale;
    const h = picture.offsetHeight * scale;
    const mx = Math.max(0, (w - stage.clientWidth) / 2);
    const my = Math.max(0, (h - stage.clientHeight) / 2);
    tx = Math.max(-mx, Math.min(mx, tx));
    ty = Math.max(-my, Math.min(my, ty));
    picture.style.transform = scale === 1 && !tx && !ty ? '' : `translate(${tx}px, ${ty}px) scale(${scale})`;
    box.classList.toggle('is-zoomed', scale > 1.01);
  }
  // zoom to s, keeping the point (px, py) (measured from the stage's centre) still under the pointer
  function zoomTo(s, px, py) {
    const next = Math.max(1, Math.min(maxScale(), s));
    tx = px - (px - tx) * (next / scale);
    ty = py - (py - ty) * (next / scale);
    scale = next;
    if (scale === 1) { tx = 0; ty = 0; }
    apply();
  }
  function reset(animate) {
    box.classList.toggle('is-gesturing', !animate);
    scale = 1; tx = 0; ty = 0;
    apply();
  }
  const fromCentre = (x, y) => {
    const r = stage.getBoundingClientRect();
    return [x - (r.left + r.width / 2), y - (r.top + r.height / 2)];
  };

  box.querySelectorAll('[data-zoom]').forEach((button) => button.addEventListener('click', () => {
    box.classList.remove('is-gesturing');
    zoomTo(button.dataset.zoom === 'in' ? scale * 1.6 : scale / 1.6, 0, 0);
  }));
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    box.classList.add('is-gesturing');
    zoomTo(scale * Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0018)), ...fromCentre(event.clientX, event.clientY));
  }, { passive: false });

  // dragging, pinching and double-tapping (mouse, touch and pen alike)
  const pointers = new Map();
  let gesture = null;
  let moved = 0;
  let lastTap = 0;
  let onPicture = false;   // did this press start on the picture itself (rather than the cream around it)?
  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    box.classList.add('is-gesturing');
    if (pointers.size === 1) { moved = 0; onPicture = event.target === picture; }
    begin();
  });
  function begin() {
    const pts = [...pointers.values()];
    if (pts.length >= 2) {
      const [a, b] = pts;
      gesture = { pinch: true, dist: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, scale, tx, ty, mid: fromCentre((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
    } else if (pts.length === 1) {
      gesture = { pinch: false, x: pts[0][0], y: pts[0][1], tx, ty };
    } else gesture = null;
  }
  stage.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    const last = pointers.get(event.pointerId);
    moved += Math.abs(event.clientX - last[0]) + Math.abs(event.clientY - last[1]);
    pointers.set(event.pointerId, [event.clientX, event.clientY]);
    const pts = [...pointers.values()];
    if (gesture.pinch && pts.length >= 2) {
      const [a, b] = pts;
      const s = Math.max(1, Math.min(maxScale(), gesture.scale * Math.hypot(a[0] - b[0], a[1] - b[1]) / gesture.dist));
      const mid = fromCentre((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      // the point that was under the fingers stays under them as they move apart and drift
      tx = mid[0] - (gesture.mid[0] - gesture.tx) * (s / gesture.scale);
      ty = mid[1] - (gesture.mid[1] - gesture.ty) * (s / gesture.scale);
      scale = s;
      apply();
    } else if (!gesture.pinch && scale > 1) {
      tx = gesture.tx + (event.clientX - gesture.x);
      ty = gesture.ty + (event.clientY - gesture.y);
      apply();
    }
  });
  const lift = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    begin();   // a pinch that becomes one finger carries on as a drag
    if (pointers.size) return;
    // a quick double tap (touch or pen) zooms in, or back out
    if (event.type === 'pointerup' && event.pointerType !== 'mouse' && moved < 10) {
      const now = Date.now();
      if (now - lastTap < 320) { lastTap = 0; tapZoomed = now; toggleZoom(event.clientX, event.clientY); return; }
      lastTap = now;
    }
  };
  stage.addEventListener('pointerup', lift);
  stage.addEventListener('pointercancel', lift);
  function toggleZoom(x, y) {
    box.classList.remove('is-gesturing');
    if (scale > 1.01) zoomTo(1, 0, 0);
    else zoomTo(2.5, ...fromCentre(x, y));
  }
  // (a phone also sends its own double-click after a double tap, which has already been handled)
  let tapZoomed = 0;
  stage.addEventListener('dblclick', (event) => { if (Date.now() - tapZoomed > 600) toggleZoom(event.clientX, event.clientY); });

  // a click on the cream space around the image closes it (but not a click on the image, or the end of a drag)
  box.addEventListener('click', (event) => {
    if (event.target === stage && (moved > 6 || onPicture)) return;
    if (event.target === stage || event.target === box) close();
  });

  // ---- Buttons and keys ----------------------------------------------------------------------------
  box.querySelector('.lightbox__close').addEventListener('click', close);
  box.querySelector('.lightbox__arrow--prev').addEventListener('click', () => show(current - 1));
  box.querySelector('.lightbox__arrow--next').addEventListener('click', () => show(current + 1));
  box.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && items.length > 1) { event.preventDefault(); show(current - 1); }
    else if (event.key === 'ArrowRight' && items.length > 1) { event.preventDefault(); show(current + 1); }
    else if (event.key === '+' || event.key === '=') { box.classList.remove('is-gesturing'); zoomTo(scale * 1.6, 0, 0); }
    else if (event.key === '-' || event.key === '_') { box.classList.remove('is-gesturing'); zoomTo(scale / 1.6, 0, 0); }
    else if (event.key === '0') reset(true);
  });
  // the picture keeps fitting the window as it changes size
  window.addEventListener('resize', () => { if (box.open) apply(); });
})();
