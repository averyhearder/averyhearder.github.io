/* ==========================================================================
   A Day in Bloom · "Little Things" notebook page
   - the pink record opens a "choose your player" pop-up
   - the recipe card flips over to show the recipe
   ========================================================================== */

/* ✿ YOUR PLAYLISTS ✿
   Paste each playlist link between the quotes, for example:
     const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/your-playlist-id';
   Any link left empty shows "coming soon ♡" in the pop-up instead. */
const SPOTIFY_PLAYLIST_URL = 'https://open.spotify.com/playlist/1npoX13uZRTx5bzmcNyqMf?si=e398d4ecc000450b';
const APPLE_MUSIC_PLAYLIST_URL = 'https://music.apple.com/ca/playlist/a-little-background-music/pl.u-DdAN8PNT0q5qJJE';
const YOUTUBE_PLAYLIST_URL = 'https://youtube.com/playlist?list=PLWm0NIk7W8gQ&si=SfU9CAlbjjtsjjyr';

(function () {
  'use strict';

  // ---- The music pop-up ------------------------------------------------------
  const PLAYERS = [
    {
      name: 'Spotify', url: SPOTIFY_PLAYLIST_URL, tone: 'sage',
      icon: '<path d="M7 10.2 C11.5 8.6 16.6 9 20.6 11.4 M8 13.8 C11.6 12.6 15.6 12.9 18.8 14.8 M9 17.2 C11.8 16.3 14.6 16.5 17 17.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
    },
    {
      name: 'Apple Music', url: APPLE_MUSIC_PLAYLIST_URL, tone: 'blush',
      icon: '<path d="M11 18.5 V8.5 L19 7 V16.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="9.2" cy="18.6" rx="2.3" ry="1.8" fill="currentColor"/><ellipse cx="17.2" cy="16.6" rx="2.3" ry="1.8" fill="currentColor"/>'
    },
    {
      name: 'YouTube', url: YOUTUBE_PLAYLIST_URL, tone: 'butter',
      icon: '<rect x="5.5" y="8" width="17" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11.2 L17 14 L12 16.8 Z" fill="currentColor"/>'
    }
  ];

  const record = document.getElementById('lt-record');
  const dialog = document.getElementById('music-dialog');
  const options = document.getElementById('music-options');

  // a link only counts once it's a real web address
  const isReady = (url) => /^https?:\/\//i.test((url || '').trim());

  options.innerHTML = PLAYERS.map((player) => {
    const icon = `<span class="music-option__icon music-option__icon--${player.tone}" aria-hidden="true"><svg viewBox="0 0 28 28">${player.icon}</svg></span>`;
    if (isReady(player.url)) {
      return `<li><a class="music-option" href="${player.url.trim()}" target="_blank" rel="noopener">` +
        `${icon}<span class="music-option__name">${player.name}</span>` +
        `<span class="music-option__meta hand">listen ↗</span></a></li>`;
    }
    return `<li><span class="music-option is-soon" aria-disabled="true">` +
      `${icon}<span class="music-option__name">${player.name}</span>` +
      `<span class="music-option__meta hand">coming soon ♡</span></span></li>`;
  }).join('');

  const eyebrow = dialog.querySelector('.music-card__eyebrow');
  const RECORD_EYEBROW = eyebrow.textContent;
  let opener = record;   // where focus returns when the card closes

  // also opened by the little speaker in the greenhouse (js/greenhouse.js)
  function openMusic(from, eyebrowText) {
    opener = from instanceof Element ? from : record;
    eyebrow.textContent = typeof eyebrowText === 'string' ? eyebrowText : RECORD_EYEBROW;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const first = dialog.querySelector('a.music-option') || dialog.querySelector('.music-card__close');
    first.focus({ preventScroll: true });
  }
  window.MusicCard = { open: openMusic };

  function closeMusic() {
    if (!dialog.open) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  record.addEventListener('click', () => openMusic(record));
  dialog.querySelectorAll('[data-music-close]').forEach((button) => button.addEventListener('click', closeMusic));
  dialog.addEventListener('close', () => opener.focus({ preventScroll: true }));

  // clicking the dimmed area around the card closes it
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeMusic();
  });

  // Escape closes only the pop-up, not the whole notebook
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') event.stopPropagation();
  });

  // leaving the notebook closes the pop-up too
  window.addEventListener('hashchange', closeMusic);

  // ---- The recipe card --------------------------------------------------------
  // Front: title. Back: page 1 = ingredients, page 2 = instructions.
  const card = document.getElementById('recipe-card');
  const front = card.querySelector('.recipe-card__front');
  const back = card.querySelector('.recipe-card__back');
  const pages = card.querySelector('.recipe-pages');
  const flipButton = card.querySelector('.recipe-flip');

  function showRecipePage(number) {
    pages.dataset.page = number;
    pages.querySelectorAll('.recipe-page').forEach((page) => {
      page.inert = !page.classList.contains('recipe-page--' + number);   // only the visible page is readable
    });
  }

  function setFlipped(flipped) {
    card.classList.toggle('is-flipped', flipped);
    flipButton.setAttribute('aria-expanded', String(flipped));
    front.inert = flipped;                         // only the visible side can be clicked or read
    back.inert = !flipped;
    if (flipped) {
      showRecipePage('1');
      pages.querySelector('.recipe-page--1 .recipe-page-turn').focus({ preventScroll: true });
    } else {
      flipButton.focus({ preventScroll: true });
    }
  }

  // a light cardstock flip, and a softer page for the recipe's second side (js/sound.js;
  // silent unless the visitor turned sound on)
  const sfx = (name) => { if (window.GardenSound) window.GardenSound.play(name); };

  flipButton.addEventListener('click', () => { sfx('cardFlip'); setFlipped(true); });
  card.querySelectorAll('.recipe-flip-back').forEach((button) => {
    button.addEventListener('click', () => { sfx('cardFlip'); setFlipped(false); });
  });
  card.querySelectorAll('[data-recipe-page]').forEach((button) => {
    button.addEventListener('click', () => {
      if (pages.dataset.page !== button.dataset.recipePage) sfx('pageFlip');
      showRecipePage(button.dataset.recipePage);
      pages.querySelector(`.recipe-page--${button.dataset.recipePage} .recipe-page-turn`).focus({ preventScroll: true });
    });
  });
})();
