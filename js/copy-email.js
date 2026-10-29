/* ==========================================================================
   A Day in Bloom · copy email ♡ (the Contact panel)
   The little copy button beside the email address copies it, and a tiny
   handwritten "copied ♡" appears. If the browser won't allow copying,
   the address is selected instead, with a note to copy it by hand. The email
   itself stays a normal link. Styles: css/panels.css.
   ========================================================================== */
(function () {
  'use strict';

  document.querySelectorAll('.copy-email__button').forEach((button) => {
    const box = button.closest('.copy-email');
    const note = box.querySelector('.copy-email__note');
    const link = box.querySelector('a');
    const address = button.dataset.copy;
    let timer = 0;

    function say(text, ok) {
      note.textContent = text;
      box.classList.toggle('is-copied', ok);
      box.classList.toggle('is-failed', !ok);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => { box.classList.remove('is-copied', 'is-failed'); note.textContent = ''; }, ok ? 2400 : 5000);
    }
    // the older way, for browsers (or pages opened from a file) that don't offer the clipboard directly
    function copyTheOldWay() {
      const field = document.createElement('textarea');
      field.value = address;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed; top:0; left:0; opacity:0; pointer-events:none';
      document.body.appendChild(field);
      field.select();
      let done = false;
      try { done = document.execCommand('copy'); } catch (error) { done = false; }
      field.remove();
      return done;
    }
    function failed() {
      // select the address, so it's ready to copy by hand
      const range = document.createRange();
      range.selectNodeContents(link);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      say('couldn’t copy, so it’s selected for you ♡', false);
    }

    button.addEventListener('click', () => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(address).then(() => say('copied ♡', true), () => (copyTheOldWay() ? say('copied ♡', true) : failed()));
      } else if (copyTheOldWay()) say('copied ♡', true);
      else failed();
    });
  });
})();
