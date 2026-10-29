/* ==========================================================================
   A Day in Bloom · Daytime / Golden Hour
   Golden Hour adds warm sunset layers on top of the garden (styles in
   css/golden-hour.css). The choice is remembered for this visit only.
   ========================================================================== */
(function () {
  'use strict';

  const KEY = 'aDayInBloom.mode';
  const buttons = document.querySelectorAll('.mode-toggle [data-mode]');

  function setMode(mode) {
    document.body.classList.toggle('mode-golden', mode === 'golden');
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    try { sessionStorage.setItem(KEY, mode); } catch (error) { /* storage blocked: still works for this page */ }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      const changed = document.body.classList.contains('mode-golden') !== (mode === 'golden');
      setMode(mode);
      // a tiny chime when the light changes (js/sound.js; silent unless sound is on)
      if (changed && window.GardenSound) window.GardenSound.play(mode === 'golden' ? 'golden' : 'day');
    });
  });

  // Restore the visitor's choice instantly (no 2-second fade on arrival)
  let saved = 'day';
  try { saved = sessionStorage.getItem(KEY) || 'day'; } catch (error) { /* ignore */ }
  if (saved === 'golden') {
    document.body.classList.add('mode-instant');
    setMode('golden');
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('mode-instant')));
  }
})();
