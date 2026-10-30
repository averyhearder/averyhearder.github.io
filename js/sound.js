/* ==========================================================================
   A Day in Bloom · garden sounds
   A soft summer soundscape: the lake lapping at the shore, wind in the
   willow, songbirds by day and faint crickets at golden hour, plus gentle
   effects for the gardening steps.

   Every sound is drawn live with the Web Audio API (no audio files), so
   nothing needs downloading and there are no links that can break.

   Sound is OFF until the visitor turns it on with the little speaker by the
   Daytime / Golden Hour toggle. The choice is remembered for the visit.
   Other scripts ask for an effect with:  window.GardenSound.play('water')
   ========================================================================== */
(function () {
  'use strict';

  const KEY = 'aDayInBloom.sound';
  const VOLUME = 0.8;            // overall loudness when on (kept gentle)
  const AMBIENCE_LEVEL = 0.18;   // the background sits well under the effects
  const EFFECTS_LEVEL = 1;

  const AC = window.AudioContext || window.webkitAudioContext;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

  // ---- Building blocks ------------------------------------------------------
  // Loopable noise. The extra tail is blended into the start, so the loop has no seam.
  function makeNoise(ctx, seconds, colour) {
    const rate = ctx.sampleRate;
    const length = Math.floor(seconds * rate);
    const blend = Math.floor(0.5 * rate);
    const raw = new Float32Array(length + blend);
    let last = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < raw.length; i++) {
      const white = Math.random() * 2 - 1;
      if (colour === 'brown') {
        last = (last + 0.02 * white) / 1.02;
        raw[i] = last * 3.5;
      } else if (colour === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;    b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;    b5 = -0.7616 * b5 - white * 0.016898;
        raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        raw[i] = white;
      }
    }
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);
    data.set(raw.subarray(0, length));
    for (let i = 0; i < blend; i++) {
      const k = i / blend;
      data[i] = raw[i] * Math.sqrt(k) + raw[length + i] * Math.sqrt(1 - k);
    }
    return buffer;
  }

  // a small, soft "outdoor" reverb made from decaying noise
  function makeSpace(ctx) {
    const rate = ctx.sampleRate;
    const length = Math.floor(2.2 * rate);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let smooth = 0;
      for (let i = 0; i < length; i++) {
        smooth = smooth * 0.6 + (Math.random() * 2 - 1) * 0.4;   // softens the highs
        data[i] = smooth * Math.exp(-3.2 * i / rate);
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  const noiseCache = new WeakMap();
  function noise(ctx, colour) {
    if (!noiseCache.has(ctx)) noiseCache.set(ctx, {});
    const store = noiseCache.get(ctx);
    if (!store[colour]) store[colour] = makeNoise(ctx, colour === 'white' ? 3 : 9, colour);
    return store[colour];
  }

  function noiseSource(ctx, colour, t, duration) {
    const source = ctx.createBufferSource();
    source.buffer = noise(ctx, colour);
    source.loop = true;
    source.start(t, rand(0, 2));
    if (duration) source.stop(t + duration + 0.05);
    return source;
  }

  function filter(ctx, type, frequency, q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    if (q !== undefined) f.Q.value = q;
    return f;
  }

  function panner(ctx, value) {
    if (!ctx.createStereoPanner) return ctx.createGain();
    const p = ctx.createStereoPanner();
    p.pan.value = value;
    return p;
  }

  // a gain that swells to `peak` in `attack` seconds, then fades away over `decay`
  function envelope(ctx, t, attack, peak, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  // a single soft tone; `to` bends the pitch over its length
  function tone(ctx, dest, type, freq, t, attack, peak, decay, to) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay * 0.6);
    const g = envelope(ctx, t, attack, peak, decay);
    osc.connect(g).connect(dest);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
    return g;
  }

  // a bell-like note: a sine with a quiet overtone, partly sent to the reverb
  function bell(ctx, io, freq, t, peak, decay, pan) {
    const p = panner(ctx, pan || 0);
    p.connect(io.out);
    const send = ctx.createGain();
    send.gain.value = 0.5;
    p.connect(send).connect(io.space);
    tone(ctx, p, 'sine', freq, t, 0.006, peak, decay);
    tone(ctx, p, 'sine', freq * 2.01, t, 0.004, peak * 0.18, decay * 0.5);
  }

  // ---- Effects ------------------------------------------------------------------
  // Each recipe draws its sound at time t and returns how long it lasts.
  function pageTurn(ctx, io, t, level, speed) {
    const tilt = rand(0.88, 1.12);   // every page sounds a little different, so repeats stay gentle
    const source = noiseSource(ctx, 'white', t, 0.6 / speed);
    const band = filter(ctx, 'bandpass', 1200, 0.7);
    band.frequency.setValueAtTime(1100 * tilt, t);
    band.frequency.linearRampToValueAtTime(3600 * tilt, t + 0.18 / speed);
    band.frequency.linearRampToValueAtTime(1700 * tilt, t + 0.4 / speed);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1 * level, t + 0.12 / speed);
    g.gain.exponentialRampToValueAtTime(0.16 * level, t + 0.24 / speed);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.44 / speed);
    source.connect(band).connect(g).connect(io.out);
    // the page settling down
    const flap = noiseSource(ctx, 'white', t + 0.3 / speed, 0.2);
    flap.connect(filter(ctx, 'lowpass', 520, 0.7)).connect(envelope(ctx, t + 0.3 / speed, 0.003, 0.22 * level, 0.09)).connect(io.out);
    return 0.55 / speed;
  }

  function rustle(ctx, io, t, level) {
    for (let k = 0; k < 4; k++) {
      const s = t + k * 0.045 + rand(0, 0.015);
      const source = noiseSource(ctx, 'white', s, 0.12);
      source.connect(filter(ctx, 'bandpass', rand(2600, 5200), 0.9))
        .connect(envelope(ctx, s, 0.004, 0.2 * level * (1 - k * 0.18), rand(0.05, 0.08)))
        .connect(io.out);
    }
    return 0.3;
  }

  // a soft, padded thump: a book cover settling, or a little door swinging to
  function thump(ctx, io, t, level, pitch) {
    noiseSource(ctx, 'white', t, 0.25).connect(filter(ctx, 'lowpass', 300 * pitch, 0.7)).connect(envelope(ctx, t, 0.006, 0.5 * level, 0.14)).connect(io.out);
    tone(ctx, io.out, 'sine', 120 * pitch, t, 0.004, 0.16 * level, 0.12, 70 * pitch);
  }

  // a small vintage latch: a muted click with a short, soft ring (kept low so it's never harsh)
  function latch(ctx, io, t, level) {
    noiseSource(ctx, 'white', t, 0.06).connect(filter(ctx, 'bandpass', 2000, 3)).connect(envelope(ctx, t, 0.001, 0.09 * level, 0.025)).connect(io.out);
    const ring = filter(ctx, 'lowpass', 2200, 0.5);
    ring.connect(io.out);
    tone(ctx, ring, 'sine', 640, t + 0.004, 0.002, 0.03 * level, 0.14);
    tone(ctx, ring, 'sine', 1490, t + 0.004, 0.002, 0.016 * level, 0.08);
  }

  const SOUNDS = {
    // ---- the mailbox and its letter ----
    // opening: the latch lifts, the little door swings down, and the letter rustles out
    mailbox(ctx, io, t) {
      latch(ctx, io, t, 1);
      thump(ctx, io, t + 0.16, 0.45, 1.3);
      rustle(ctx, io, t + 0.3, 0.55);
      return 0.75;
    },
    // closing: the letter tucked away, then a quieter latch
    mailboxClose(ctx, io, t) {
      rustle(ctx, io, t, 0.3);
      thump(ctx, io, t + 0.12, 0.3, 1.3);
      latch(ctx, io, t + 0.2, 0.55);
      return 0.45;
    },

    // ---- the About Me notebook ----
    // opening: the cover lifts and settles, and the pages shift
    bookOpen(ctx, io, t) {
      thump(ctx, io, t, 0.55, 0.9);
      pageTurn(ctx, io, t + 0.08, 0.5, 1.3);
      rustle(ctx, io, t + 0.26, 0.3);
      return 0.65;
    },
    // turning to another spread: one delicate page
    pageFlip: (ctx, io, t) => pageTurn(ctx, io, t, 0.5, 1.45),
    // closing: the pages fall together, then the soft cover
    bookClose(ctx, io, t) {
      rustle(ctx, io, t, 0.3);
      thump(ctx, io, t + 0.1, 0.4, 0.85);
      noiseSource(ctx, 'white', t + 0.1, 0.12).connect(filter(ctx, 'bandpass', 900, 0.8)).connect(envelope(ctx, t + 0.1, 0.004, 0.04, 0.08)).connect(io.out);
      return 0.4;
    },

    // ---- down at the lake ----
    // a couple of slow oar strokes as the boat glides off
    row(ctx, io, t) {
      [0, 0.9].forEach((delay) => {
        const s = t + delay;
        const source = noiseSource(ctx, 'pink', s, 0.8);
        const band = filter(ctx, 'bandpass', 500, 0.8);
        band.frequency.setValueAtTime(380, s);
        band.frequency.linearRampToValueAtTime(900, s + 0.35);
        band.frequency.linearRampToValueAtTime(450, s + 0.7);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(0.12, s + 0.25);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.75);
        source.connect(band).connect(g).connect(io.out);
        for (let i = 0; i < 3; i++) tone(ctx, io.out, 'sine', rand(500, 800), s + 0.5 + rand(0, 0.3), 0.002, 0.02, 0.06, rand(900, 1300));
      });
      return 1.7;
    },
    // casting: the line whispers out, then the bobber plops into the water
    cast(ctx, io, t) {
      const source = noiseSource(ctx, 'white', t, 0.4);
      const band = filter(ctx, 'bandpass', 2400, 1.4);
      band.frequency.setValueAtTime(3600, t);
      band.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
      source.connect(band).connect(envelope(ctx, t, 0.05, 0.06, 0.3)).connect(io.out);
      const plop = t + 0.5;
      tone(ctx, io.out, 'sine', 420, plop, 0.002, 0.1, 0.12, 900);
      noiseSource(ctx, 'white', plop, 0.2).connect(filter(ctx, 'lowpass', 1200, 0.7)).connect(envelope(ctx, plop, 0.003, 0.08, 0.12)).connect(io.out);
      return 0.75;
    },
    // a catch: a happy little splash with droplets and a sparkle
    catch(ctx, io, t) {
      noiseSource(ctx, 'white', t, 0.4).connect(filter(ctx, 'bandpass', 1400, 0.7)).connect(envelope(ctx, t, 0.01, 0.12, 0.3)).connect(io.out);
      for (let i = 0; i < 8; i++) tone(ctx, io.out, 'sine', rand(700, 1400), t + rand(0.05, 0.5), 0.002, 0.035, 0.06, rand(1500, 2400));
      [1318.5, 1760].forEach((f, i) => bell(ctx, io, f, t + 0.3 + i * 0.09, 0.04, 0.7, i ? 0.2 : -0.2));
      return 0.9;
    },
    // letting it swim: a soft plop and a few bubbles
    release(ctx, io, t) {
      tone(ctx, io.out, 'sine', 300, t, 0.003, 0.09, 0.14, 650);
      noiseSource(ctx, 'white', t, 0.2).connect(filter(ctx, 'lowpass', 900, 0.7)).connect(envelope(ctx, t, 0.004, 0.06, 0.12)).connect(io.out);
      for (let i = 0; i < 4; i++) tone(ctx, io.out, 'sine', rand(500, 900), t + 0.15 + i * 0.09, 0.002, 0.018, 0.05, rand(1100, 1600));
      return 0.6;
    },
    // a mama duck's soft double quack
    quack(ctx, io, t) {
      [0, 0.2].forEach((delay, i) => {
        const s = t + delay;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420 - i * 30, s);
        osc.frequency.exponentialRampToValueAtTime(300, s + 0.13);
        osc.connect(filter(ctx, 'bandpass', 1150, 4)).connect(envelope(ctx, s, 0.01, 0.08, 0.12)).connect(io.out);
        osc.start(s);
        osc.stop(s + 0.16);
      });
      return 0.4;
    },
    // a little green frog's "rib-bit": a lower, longer "rib" and a quick, higher "bit", each a rattle
    // of tiny pulses (the second lands as the frog's throat puffs again, see css/lake.css)
    croak(ctx, io, t) {
      [[0, 118, 104, 6], [0.3, 152, 140, 4]].forEach(([delay, from, to, pulses]) => {
        const s = t + delay;
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(from, s);
        osc.frequency.linearRampToValueAtTime(to, s + pulses * 0.022);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, s);
        for (let p = 0; p < pulses; p++) {   // the rattle of a croak: quick little pulses
          g.gain.exponentialRampToValueAtTime(0.06 * (1 - p * 0.06), s + p * 0.022 + 0.005);
          g.gain.exponentialRampToValueAtTime(0.002, s + p * 0.022 + 0.018);
        }
        g.gain.exponentialRampToValueAtTime(0.0001, s + pulses * 0.022 + 0.04);
        osc.connect(filter(ctx, 'bandpass', 650, 2.5)).connect(g).connect(io.out);
        osc.start(s);
        osc.stop(s + pulses * 0.022 + 0.06);
      });
      return 0.55;
    },
    // the swan: a soft, low, breathy "hoo-oo", two gentle notes with a little echo off the water
    swan(ctx, io, t) {
      [[0, 340, 300, 0.32], [0.46, 300, 270, 0.42]].forEach(([delay, from, to, length]) => {
        const s = t + delay;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(from, s);
        osc.frequency.exponentialRampToValueAtTime(to, s + length);
        const voice = filter(ctx, 'bandpass', 820, 1.4);
        const soft = filter(ctx, 'lowpass', 1600, 0.6);
        const g = envelope(ctx, s, 0.06, 0.05, length);
        osc.connect(voice).connect(soft).connect(g);
        g.connect(io.out);
        const echo = ctx.createGain();
        echo.gain.value = 0.6;
        g.connect(echo).connect(io.space);
        osc.start(s);
        osc.stop(s + length + 0.12);
        // a little breath through the beak
        noiseSource(ctx, 'pink', s, length).connect(filter(ctx, 'bandpass', 1300, 0.9)).connect(envelope(ctx, s, 0.05, 0.014, length * 0.8)).connect(io.out);
      });
      return 1.1;
    },
    // a chickadee splashing in the birdbath: a soft spray and a few tiny droplets plinking back in
    splash(ctx, io, t) {
      noiseSource(ctx, 'white', t, 0.3).connect(filter(ctx, 'highpass', 2400)).connect(envelope(ctx, t, 0.01, 0.035, 0.18)).connect(io.out);
      noiseSource(ctx, 'pink', t + 0.18, 0.3).connect(filter(ctx, 'bandpass', 1800, 1)).connect(envelope(ctx, t + 0.18, 0.01, 0.025, 0.16)).connect(io.out);
      for (let i = 0, n = 4 + Math.floor(rand(0, 3)); i < n; i++) {
        const s = t + 0.08 + i * rand(0.06, 0.12);
        const f = rand(900, 1500);
        tone(ctx, io.out, 'sine', f, s, 0.002, rand(0.018, 0.032), 0.05, f * rand(1.6, 2.1));   // a rising "plink", like a little bubble
      }
      return 0.8;
    },
    // a hummingbird's tiny, high "chip" notes
    hummingbird(ctx, io, t) {
      for (let i = 0, n = 2 + Math.floor(rand(0, 2)); i < n; i++) {
        const s = t + i * rand(0.08, 0.13);
        tone(ctx, io.out, 'sine', rand(5600, 6400), s, 0.003, 0.02, 0.035, rand(4600, 5200));
      }
      return 0.4;
    },
    // a wish tied onto the willow: a soft leafy rustle and three gentle, rising bells
    wish(ctx, io, t) {
      rustle(ctx, io, t, 0.35);
      [1318.5, 1661.2, 1975.5].forEach((f, i) => bell(ctx, io, f, t + 0.12 + i * 0.16, 0.045, 1.4, (i - 1) * 0.25));
      return 1.6;
    },
    // a message in a bottle: a little glassy clink as it bumps the dock
    bottle(ctx, io, t) {
      [2093, 3136].forEach((f, i) => bell(ctx, io, f, t + i * 0.12, 0.04, 0.9, i ? 0.15 : -0.15));
      tone(ctx, io.out, 'sine', 4186, t, 0.001, 0.012, 0.3);
      tone(ctx, io.out, 'sine', 360, t + 0.02, 0.003, 0.05, 0.1, 700);
      return 1;
    },

    // ---- the recipe card: stiffer cardstock, a quick swish and a light tap ----
    cardFlip(ctx, io, t) {
      const source = noiseSource(ctx, 'white', t, 0.25);
      const band = filter(ctx, 'bandpass', 1500, 1.1);
      band.frequency.setValueAtTime(1400, t);
      band.frequency.linearRampToValueAtTime(2900, t + 0.12);
      source.connect(band).connect(envelope(ctx, t, 0.04, 0.1, 0.1)).connect(io.out);
      noiseSource(ctx, 'white', t + 0.15, 0.05).connect(filter(ctx, 'bandpass', 3200, 4)).connect(envelope(ctx, t + 0.15, 0.001, 0.05, 0.02)).connect(io.out);
      thump(ctx, io, t + 0.16, 0.2, 1.6);
      return 0.32;
    },


    // picking up a seed packet: a tiny paper rustle
    seed: (ctx, io, t) => rustle(ctx, io, t, 1),

    // planting: soft pats of soil
    plant(ctx, io, t) {
      [[0, 1], [0.19, 0.8], [0.33, 0.45]].forEach(([delay, level]) => {
        const s = t + delay;
        noiseSource(ctx, 'white', s, 0.2).connect(filter(ctx, 'lowpass', 420, 0.7)).connect(envelope(ctx, s, 0.003, 0.55 * level, 0.12)).connect(io.out);
        tone(ctx, io.out, 'sine', 140, s, 0.002, 0.22 * level, 0.12, 60);
        noiseSource(ctx, 'white', s, 0.1).connect(filter(ctx, 'bandpass', 1800, 1.5)).connect(envelope(ctx, s, 0.002, 0.05 * level, 0.05)).connect(io.out);
      });
      return 0.6;
    },

    // watering: a gentle pour with little splashes and drips
    water(ctx, io, t) {
      const length = 1.5;
      const source = noiseSource(ctx, 'white', t, length + 0.2);
      const band = filter(ctx, 'bandpass', 1600, 2.2);
      for (let s = 0; s < length; s += 0.03) band.frequency.setTargetAtTime(rand(900, 2600), t + s, 0.012);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.18);
      g.gain.setValueAtTime(0.2, t + 1.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + length);
      source.connect(band).connect(g).connect(io.out);
      const body = noiseSource(ctx, 'white', t, length + 0.2);
      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.0001, t);
      bodyGain.gain.exponentialRampToValueAtTime(0.07, t + 0.25);
      bodyGain.gain.setValueAtTime(0.07, t + 1.1);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      body.connect(filter(ctx, 'lowpass', 700, 0.6)).connect(bodyGain).connect(io.out);
      for (let i = 0; i < 9; i++) {
        const s = t + rand(0.2, length + 0.1);
        const f = rand(700, 1300);
        const p = panner(ctx, rand(-0.4, 0.4));
        p.connect(io.out);
        tone(ctx, p, 'sine', f, s, 0.002, 0.05, 0.07, f * 1.9);
      }
      return length + 0.2;
    },

    // sunshine: a warm, delicate chime
    sun(ctx, io, t) {
      [784, 988, 1175, 1568].forEach((f, i) => bell(ctx, io, f, t + i * 0.09, 0.09, 1.6, (i - 1.5) * 0.2));
      const pad = ctx.createGain();
      pad.gain.setValueAtTime(0.0001, t);
      pad.gain.exponentialRampToValueAtTime(0.03, t + 0.3);
      pad.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      pad.connect(filter(ctx, 'lowpass', 1200)).connect(io.out);
      [392, 587].forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.connect(pad);
        osc.start(t);
        osc.stop(t + 1.9);
      });
      return 2.2;
    },

    // a flower blooming: a tiny rising sparkle
    bloom(ctx, io, t) {
      [1568, 1760, 2093, 2349, 2637, 3136, 3520].forEach((f, i) => {
        bell(ctx, io, f, t + i * 0.055 + rand(0, 0.015), 0.055 * (1 - i * 0.06), 0.35, i % 2 ? 0.3 : -0.3);
      });
      noiseSource(ctx, 'white', t, 0.6).connect(filter(ctx, 'highpass', 6000)).connect(envelope(ctx, t, 0.05, 0.02, 0.5)).connect(io.space);
      return 1.2;
    },

    // entering the garden: the first cosmos opens with a delicate, rising chime
    introBloom(ctx, io, t) {
      [1046.5, 1318.5, 1568, 2093].forEach((f, i) => bell(ctx, io, f, t + i * 0.09, 0.04 * (1 - i * 0.12), 1.3, (i - 1.5) * 0.18));
      noiseSource(ctx, 'white', t, 0.8).connect(filter(ctx, 'highpass', 6500)).connect(envelope(ctx, t + 0.1, 0.08, 0.012, 0.6)).connect(io.space);
      return 1.6;
    },

    // ...then the garden grows in around you: leaves rustling as they rise, a warm swelling hum,
    // and soft bells as the flowers open
    introGrow(ctx, io, t) {
      const leaves = noiseSource(ctx, 'pink', t, 1.7);
      const band = filter(ctx, 'bandpass', 500, 0.6);
      band.frequency.setValueAtTime(450, t);
      band.frequency.exponentialRampToValueAtTime(3000, t + 1.2);
      const swell = ctx.createGain();
      swell.gain.setValueAtTime(0.0001, t);
      swell.gain.exponentialRampToValueAtTime(0.06, t + 0.9);
      swell.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      leaves.connect(band).connect(swell).connect(io.out);
      [[196, 262], [247, 330]].forEach(([from, to]) => tone(ctx, io.out, 'sine', from, t, 0.5, 0.02, 1, to));
      [784, 988, 1175, 1568, 1976].forEach((f, i) => bell(ctx, io, f, t + 0.35 + i * 0.13, 0.028, 1.1, i % 2 ? 0.35 : -0.35));
      return 1.8;
    },

    // opening a project: a soft page turn
    page: (ctx, io, t) => pageTurn(ctx, io, t, 1, 1),

    // opening the greenhouse sketchbook: a quieter page, a touch slower
    sketchbook(ctx, io, t) {
      rustle(ctx, io, t, 0.4);
      return pageTurn(ctx, io, t + 0.08, 0.7, 0.85) + 0.08;
    },

    // stepping into the greenhouse: a gentle wooden creak and a soft latch
    door(ctx, io, t) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.linearRampToValueAtTime(122, t + 0.22);
      osc.frequency.linearRampToValueAtTime(104, t + 0.45);
      osc.frequency.linearRampToValueAtTime(132, t + 0.72);
      // stick-slip: the wood catches and releases many times a second
      const grain = ctx.createGain();
      grain.gain.value = 0.5;
      const flutter = ctx.createOscillator();
      flutter.type = 'square';
      flutter.frequency.setValueAtTime(24, t);
      flutter.frequency.linearRampToValueAtTime(34, t + 0.75);
      const depth = ctx.createGain();
      depth.gain.value = 0.45;
      flutter.connect(depth).connect(grain.gain);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.12);
      g.gain.setValueAtTime(0.09, t + 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
      osc.connect(grain).connect(filter(ctx, 'bandpass', 760, 3)).connect(filter(ctx, 'lowpass', 2400)).connect(g).connect(io.out);
      const send = ctx.createGain();
      send.gain.value = 0.25;
      g.connect(send).connect(io.space);
      [osc, flutter].forEach((o) => { o.start(t); o.stop(t + 0.9); });
      // the latch
      const s = t + 0.92;
      noiseSource(ctx, 'white', s, 0.1).connect(filter(ctx, 'bandpass', 2200, 2)).connect(envelope(ctx, s, 0.001, 0.08, 0.04)).connect(io.out);
      tone(ctx, io.out, 'sine', 180, s, 0.002, 0.12, 0.08, 120);
      return 1.1;
    },

    // the willow's rope swing: two soft, slow creaks of rope on the branch, and a whisper of leaves
    swing(ctx, io, t) {
      [[0, 82, 104, 0.05], [0.95, 92, 78, 0.032]].forEach(([delay, from, to, level]) => {
        const s = t + delay;
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(from, s);
        osc.frequency.linearRampToValueAtTime(to, s + 0.5);
        const grain = ctx.createGain();   // stick-slip, like the greenhouse door but slower and softer
        grain.gain.value = 0.5;
        const flutter = ctx.createOscillator();
        flutter.type = 'square';
        flutter.frequency.setValueAtTime(18, s);
        flutter.frequency.linearRampToValueAtTime(26, s + 0.5);
        const depth = ctx.createGain();
        depth.gain.value = 0.45;
        flutter.connect(depth).connect(grain.gain);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, s);
        g.gain.exponentialRampToValueAtTime(level, s + 0.16);
        g.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
        osc.connect(grain).connect(filter(ctx, 'bandpass', 640, 3)).connect(filter(ctx, 'lowpass', 1800)).connect(g).connect(io.out);
        const send = ctx.createGain();
        send.gain.value = 0.3;
        g.connect(send).connect(io.space);
        [osc, flutter].forEach((o) => { o.start(s); o.stop(s + 0.65); });
      });
      rustle(ctx, io, t + 0.3, 0.22);
      return 1.6;
    },

    // adding a stem to the bouquet: a leafy swish and a soft pluck
    stem(ctx, io, t) {
      const source = noiseSource(ctx, 'white', t, 0.3);
      const band = filter(ctx, 'bandpass', 1800, 1.2);
      band.frequency.setValueAtTime(1500, t);
      band.frequency.linearRampToValueAtTime(3200, t + 0.18);
      source.connect(band).connect(envelope(ctx, t, 0.05, 0.09, 0.16)).connect(io.out);
      bell(ctx, io, pickOne([1046.5, 1174.7, 1318.5, 1568]), t + 0.08, 0.035, 0.5, rand(-0.3, 0.3));
      return 0.6;
    },

    // the little speaker powering on: a soft click and a gentle rising hum
    power(ctx, io, t) {
      noiseSource(ctx, 'white', t, 0.05).connect(filter(ctx, 'bandpass', 2600, 2)).connect(envelope(ctx, t, 0.001, 0.08, 0.03)).connect(io.out);
      const hum = ctx.createOscillator();
      hum.type = 'triangle';
      hum.frequency.setValueAtTime(220, t + 0.05);
      hum.frequency.exponentialRampToValueAtTime(330, t + 0.45);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.025, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      hum.connect(filter(ctx, 'lowpass', 900)).connect(g).connect(io.out);
      hum.start(t + 0.05);
      hum.stop(t + 0.65);
      bell(ctx, io, 1318.5, t + 0.4, 0.04, 0.8, 0.1);
      return 1;
    },

    // switching the light: a tiny bright chime by day, a warmer falling one at golden hour
    day(ctx, io, t) {
      bell(ctx, io, 1318.5, t, 0.06, 1.1, -0.15);
      bell(ctx, io, 1760, t + 0.11, 0.06, 1.3, 0.15);
      return 1.4;
    },
    golden(ctx, io, t) {
      bell(ctx, io, 880, t, 0.065, 1.5, 0.15);
      bell(ctx, io, 659.25, t + 0.14, 0.065, 1.8, -0.15);
      return 1.9;
    }
  };

  // ---- The ambience: lake, wind, birds and crickets ----------------------------------
  function createAmbience(ctx, out, space) {
    // the lake: low rolling water with a soft wash as each little wave arrives
    // (the water has its own level, so it can come closer when the visitor is down at the lake)
    const water = ctx.createGain();
    water.connect(out);
    const lake = ctx.createGain();
    lake.gain.value = 0.16;
    noiseSource(ctx, 'brown').connect(filter(ctx, 'lowpass', 380, 0.5)).connect(lake).connect(water);
    const wash = ctx.createGain();
    wash.gain.value = 0;
    noiseSource(ctx, 'pink').connect(filter(ctx, 'bandpass', 900, 0.6)).connect(wash).connect(water);

    // each place has its own gentle mix (see setPlace): these levels crossfade as you move around
    const windMix = ctx.createGain();
    windMix.connect(out);
    const leafMix = ctx.createGain();
    leafMix.connect(out);
    const birdMix = ctx.createGain();
    birdMix.connect(out);

    // the wind, and leaves rustling in the willow and flowers
    const windBand = filter(ctx, 'bandpass', 500, 0.6);
    const wind = ctx.createGain();
    wind.gain.value = 0.15;
    noiseSource(ctx, 'pink').connect(windBand).connect(wind).connect(windMix);
    const leaves = ctx.createGain();
    leaves.gain.value = 0.04;
    noiseSource(ctx, 'white').connect(filter(ctx, 'highpass', 2800)).connect(filter(ctx, 'lowpass', 7000)).connect(leaves).connect(leafMix);

    // birds and crickets each have their own level, so the light can crossfade them
    const birds = ctx.createGain();
    birds.connect(birdMix);
    const birdSend = ctx.createGain();
    birdSend.gain.value = 0.35;
    birds.connect(birdSend).connect(space);

    // down at the lake: water lapping against the dock and, now and then, a loon far across the water
    // (heard only there: this level is silent everywhere else, and fades in and out as you come and go)
    const lakeLife = ctx.createGain();
    lakeLife.gain.value = 0;
    lakeLife.connect(out);
    const loonEcho = ctx.createGain();
    loonEcho.gain.value = 0.9;
    loonEcho.connect(space);
    const crickets = ctx.createGain();
    crickets.gain.value = 0;
    crickets.connect(filter(ctx, 'lowpass', 5200)).connect(out);

    const chirpers = [[4350, -0.55], [4720, 0.5]].map(([freq, pan]) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      const pulse = ctx.createGain();
      pulse.gain.value = 0;
      osc.connect(pulse).connect(panner(ctx, pan)).connect(crickets);
      osc.start();
      return { pulse, next: 0 };
    });

    let golden = false;
    let nextLap = 0;
    let nextGust = 0;
    let nextBird = 0;
    let place = 'garden';
    let nextLapping = 0;
    let nextLoon = 0;
    let hushUntil = 0;   // a clicked sound is playing: the loon waits for it to finish

    // a little wave clucking against the dock's posts
    function lap(t) {
      const source = noiseSource(ctx, 'pink', t, 0.25);
      source.connect(filter(ctx, 'bandpass', rand(420, 900), 2.2)).connect(envelope(ctx, t, 0.006, rand(0.12, 0.22), rand(0.07, 0.14))).connect(panner(ctx, rand(-0.5, 0.5))).connect(lakeLife);
    }

    // a common loon, far across the lake: the long, rising wail (or, now and then, its soft
    // tremolo "laugh"), mostly heard as an echo off the water
    function loon(t) {
      const voice = ctx.createGain();
      const across = panner(ctx, rand(-0.6, 0.6));   // somewhere across the water
      voice.connect(filter(ctx, 'lowpass', 2200, 0.6)).connect(across);
      across.connect(lakeLife);
      across.connect(loonEcho);
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      const vibrato = ctx.createOscillator();
      vibrato.frequency.value = 5;
      const depth = ctx.createGain();
      depth.gain.value = 6;
      vibrato.connect(depth).connect(osc.frequency);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      let end;
      if (Math.random() < 0.75) {
        // the wail: a soft first note that slides up, a pause in the voice, then a higher, held note falling away
        const base = rand(560, 620);
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.linearRampToValueAtTime(base * 1.3, t + 0.6);
        osc.frequency.setValueAtTime(base * 1.3, t + 1.6);
        osc.frequency.linearRampToValueAtTime(base * 1.55, t + 2.0);
        osc.frequency.linearRampToValueAtTime(base * 1.4, t + 3.4);
        g.gain.exponentialRampToValueAtTime(0.11, t + 0.35);
        g.gain.setTargetAtTime(0.07, t + 0.9, 0.3);
        g.gain.setTargetAtTime(0.012, t + 1.55, 0.05);
        g.gain.setTargetAtTime(0.11, t + 1.75, 0.12);
        g.gain.setTargetAtTime(0.0001, t + 2.8, 0.35);
        end = t + 4.4;
      } else {
        // the tremolo: a quick, wavering laugh
        const base = rand(820, 900);
        osc.frequency.setValueAtTime(base, t);
        osc.frequency.linearRampToValueAtTime(base * 1.08, t + 1.2);
        const flutter = ctx.createOscillator();
        flutter.frequency.value = 9;
        const amount = ctx.createGain();
        amount.gain.value = 0.04;
        flutter.connect(amount).connect(g.gain);
        g.gain.exponentialRampToValueAtTime(0.06, t + 0.15);
        g.gain.setTargetAtTime(0.0001, t + 1.1, 0.2);
        flutter.start(t);
        flutter.stop(t + 2);
        end = t + 2;
      }
      osc.connect(g).connect(voice);
      osc.start(t);
      vibrato.start(t);
      osc.stop(end);
      vibrato.stop(end);
    }

    const MIX = {   // water, wind, leaves, birds (1 = as in the garden), and the lake's own sounds
      garden: [1, 1, 1, 1, 0],
      lake: [1.9, 0.9, 0.7, 0.65, 1],          // the water close by; the trees and birds further off
      greenhouse: [0.8, 0.8, 0.8, 0.9, 0],     // (the glass also muffles everything: see followRoom)
      willow: [0.75, 1.15, 1.6, 1, 0]          // under the branches: the leaves all around
    };
    // moving between places: everything eases to the new mix over a few seconds
    function setPlace(name, instant) {
      if (!MIX[name] || (name === place && !instant)) return;
      const now = ctx.currentTime;
      const ease = instant ? 0.01 : 1.1;
      const [w, wi, l, b, life] = MIX[name];
      [[water, w], [windMix, wi], [leafMix, l], [birdMix, b], [lakeLife, life]].forEach(([node, level]) => {
        node.gain.cancelScheduledValues(now);
        node.gain.setTargetAtTime(level, now, name === 'lake' && node === lakeLife ? ease * 1.5 : ease);
      });
      if (name === 'lake' && place !== 'lake') nextLoon = now + rand(7, 14);   // the first loon soon after arriving
      place = name;
    }
    function hush(until) { hushUntil = Math.max(hushUntil, until); }

    // birdsong: a few different singers, each somewhere in the trees
    const SONGS = [
      // "fee-bee": two clear whistles, like a chickadee
      (dest, t) => {
        tone(ctx, dest, 'sine', 3950, t, 0.03, 0.06, 0.32, 3880);
        tone(ctx, dest, 'sine', 3400, t + 0.45, 0.03, 0.05, 0.28, 3300);
      },
      // a quick, sweet trill
      (dest, t) => {
        const count = 6 + Math.floor(rand(0, 5));
        for (let i = 0; i < count; i++) tone(ctx, dest, 'sine', 4200, t + i * 0.06, 0.005, 0.035, 0.04, 3000);
      },
      // a cheery phrase of rising-and-falling notes
      (dest, t) => {
        const notes = 3 + Math.floor(rand(0, 2));
        for (let i = 0; i < notes; i++) {
          const f = rand(2000, 2800);
          const s = t + i * 0.22;
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(f, s);
          osc.frequency.linearRampToValueAtTime(f * 1.25, s + 0.06);
          osc.frequency.linearRampToValueAtTime(f * 0.9, s + 0.14);
          const g = envelope(ctx, s, 0.02, 0.04, 0.12);
          osc.connect(g).connect(dest);
          osc.start(s);
          osc.stop(s + 0.2);
        }
      },
      // two tiny, distant chirps
      (dest, t) => {
        tone(ctx, dest, 'sine', 5000, t, 0.004, 0.025, 0.05, 3500);
        tone(ctx, dest, 'sine', 5000, t + 0.13, 0.004, 0.025, 0.05, 3500);
      }
    ];

    // plan the next few moments of sound (called a few times a second while playing)
    function schedule(until) {
      const now = ctx.currentTime;
      if (nextLap < now) nextLap = now + 0.1;
      if (nextGust < now) nextGust = now + 0.1;
      if (nextBird < now) nextBird = now + rand(1.5, 4);

      while (nextLap < until) {
        const s = nextLap;
        lake.gain.setTargetAtTime(rand(0.3, 0.45), s, 0.35);
        lake.gain.setTargetAtTime(0.16, s + rand(0.9, 1.4), 0.6);
        wash.gain.setTargetAtTime(rand(0.05, 0.09), s + 0.25, 0.2);
        wash.gain.setTargetAtTime(0, s + 0.6, 0.35);
        nextLap += rand(2.2, 4.2);
      }
      while (nextGust < until) {
        const s = nextGust;
        const level = rand(0.25, 1);
        wind.gain.setTargetAtTime(0.08 + 0.22 * level, s, 1.5);
        leaves.gain.setTargetAtTime(0.02 + 0.07 * level * level, s + 0.3, 1.2);
        windBand.frequency.setTargetAtTime(380 + 400 * level, s, 2);
        nextGust += rand(3.5, 8);
      }
      while (nextBird < until) {
        const p = panner(ctx, rand(-0.8, 0.8));
        p.connect(birds);
        pickOne(SONGS)(p, nextBird);
        nextBird += golden ? rand(9, 20) : rand(3.5, 10);
      }
      // at the lake: little waves at the dock, and an occasional loon (never on top of a clicked sound,
      // and never close together)
      if (place === 'lake') {
        if (nextLapping < now) nextLapping = now + rand(0.3, 1);
        while (nextLapping < until) {
          lap(nextLapping);
          if (Math.random() < 0.35) lap(nextLapping + rand(0.12, 0.22));
          nextLapping += rand(0.9, 2.8);
        }
        if (nextLoon && nextLoon < until) {
          if (nextLoon < hushUntil) nextLoon = hushUntil + rand(1.5, 3);
          else { loon(Math.max(nextLoon, now + 0.05)); nextLoon = now + rand(golden ? 35 : 45, golden ? 70 : 90); }
        }
      } else nextLoon = 0;
      // crickets only sing in the evening
      chirpers.forEach((c) => {
        if (!golden) { c.next = 0; return; }
        if (c.next < now) c.next = now + rand(0.2, 1.5);
        while (c.next < until) {
          const level = rand(0.35, 0.5);
          for (let p = 0; p < 3; p++) {
            const s = c.next + p * 0.045;
            c.pulse.gain.setValueAtTime(0, s);
            c.pulse.gain.linearRampToValueAtTime(level, s + 0.008);
            c.pulse.gain.linearRampToValueAtTime(0, s + 0.03);
          }
          c.next += Math.random() < 0.2 ? rand(2, 4) : rand(0.7, 1.1);
        }
      });
    }

    // Daytime ↔ Golden Hour: birds grow quieter as the crickets come in
    function setGolden(isGolden, instant) {
      if (isGolden === golden && !instant) return;
      golden = isGolden;
      const now = ctx.currentTime;
      const ease = instant ? 0.01 : 1.4;
      birds.gain.cancelScheduledValues(now);
      crickets.gain.cancelScheduledValues(now);
      birds.gain.setTargetAtTime(isGolden ? 0.45 : 1.5, now, ease);
      crickets.gain.setTargetAtTime(isGolden ? 0.035 : 0, now, ease);
    }

    return { schedule, setGolden, setPlace, hush };
  }

  // ---- The engine -----------------------------------------------------------------
  const button = document.getElementById('sound-toggle');
  const body = document.body;
  const musicDialog = document.getElementById('music-dialog');

  let enabled = false;
  try { enabled = sessionStorage.getItem(KEY) === 'on'; } catch (error) { /* storage blocked */ }

  let ctx = null;
  let master, effects, ambienceBus, indoor, duck, io, ambience;
  let ticker = 0;
  let sleepTimer = 0;
  const busyUntil = {};

  // Build everything the first time sound is wanted (always inside a click or key press)
  function build() {
    if (ctx || !AC) return ctx;
    ctx = new AC();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(limiter).connect(ctx.destination);

    const space = makeSpace(ctx);
    const spaceLevel = ctx.createGain();
    spaceLevel.gain.value = 0.6;
    space.connect(spaceLevel).connect(master);

    effects = ctx.createGain();
    effects.gain.value = EFFECTS_LEVEL;
    effects.connect(master);
    io = { out: effects, space };

    // ambience → muffled indoors → ducked under the music pop-up → master
    ambienceBus = ctx.createGain();
    ambienceBus.gain.value = AMBIENCE_LEVEL;
    indoor = filter(ctx, 'lowpass', 18000, 0.5);
    duck = ctx.createGain();
    ambienceBus.connect(indoor).connect(duck).connect(master);
    ambience = createAmbience(ctx, ambienceBus, space);
    ambience.setGolden(body.classList.contains('mode-golden'), true);
    followRoom(true);
    followMusic();
    return ctx;
  }

  function fadeTo(target, seconds) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(target, now + seconds);
  }

  function tick() {
    if (ctx && ctx.state === 'running') ambience.schedule(ctx.currentTime + 1.5);
  }

  // iPhones and iPads mute web audio while the ring/silent switch is set to silent (as they do
  // ringtones), even with the volume up, unless the page asks to play like a music or video
  // player does. That's only asked once the visitor has turned sound on, and handed back when
  // they turn it off. Other browsers don't have navigator.audioSession and are unaffected.
  // Playing that way pauses other apps' music, so once the visitor has opened the playlist in a
  // music app, the garden plays along underneath it instead (the phone's usual mixing rules).
  let withTheirMusic = false;
  document.addEventListener('click', (event) => {
    if (event.target.closest && event.target.closest('.music-option')) withTheirMusic = true;
  }, true);
  function audioSession(type) {
    try { if (navigator.audioSession && navigator.audioSession.type !== type) navigator.audioSession.type = type; } catch (error) { /* not allowed: carry on */ }
  }

  function wake(fadeSeconds) {
    audioSession(withTheirMusic ? 'auto' : 'playback');
    if (!build()) return;
    window.clearTimeout(sleepTimer);
    const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume();
    // a silent, one-sample sound started right inside the tap: older iPhones only let a page's audio
    // begin once something has actually played during a tap
    const blip = ctx.createBufferSource();
    blip.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    blip.connect(ctx.destination);
    blip.start();
    resumed.then(() => { tick(); fadeTo(VOLUME, fadeSeconds); }).catch(() => { /* the browser said not yet */ });
    if (!ticker) ticker = window.setInterval(tick, 400);
  }

  // fade out, then let the audio rest completely
  function sleep(fadeSeconds) {
    if (!ctx) return;
    window.clearTimeout(sleepTimer);
    fadeTo(0, fadeSeconds);
    window.clearInterval(ticker);
    ticker = 0;
    sleepTimer = window.setTimeout(() => {
      if (ctx.state === 'running') ctx.suspend();
      audioSession('auto');   // resting (turned off, or the page hidden): other apps can play freely
    }, fadeSeconds * 1000 + 120);
  }

  function showButton() {
    const label = enabled ? 'Turn garden sounds off' : 'Turn garden sounds on';
    button.dataset.sound = enabled ? 'on' : 'off';
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  function setEnabled(on) {
    enabled = on;
    try { sessionStorage.setItem(KEY, on ? 'on' : 'off'); } catch (error) { /* ignore */ }
    showButton();
    if (on) wake(1.8);
    else sleep(0.9);
  }

  // Play an effect. Returns true if it will be heard.
  function play(name) {
    if (!enabled || !ctx || document.hidden || !SOUNDS[name]) return false;
    const now = ctx.currentTime;
    if (busyUntil[name] && now < busyUntil[name]) return false;   // never stack the same sound
    const length = SOUNDS[name](ctx, io, now + 0.02);
    busyUntil[name] = now + Math.max(0.12, length * 0.7);
    ambience.hush(now + length + 1.5);   // an occasional call in the background waits its turn
    return true;
  }

  // each place has its own gentle mix, crossfading as you move between them; the greenhouse's glass
  // also muffles the outdoors a little
  function followRoom(instant) {
    if (!ctx) return;
    const inside = body.classList.contains('in-greenhouse');
    indoor.frequency.setTargetAtTime(inside ? 1400 : 18000, ctx.currentTime, instant ? 0.01 : 0.9);
    const place = inside ? 'greenhouse' : body.classList.contains('at-lake') ? 'lake' : body.classList.contains('at-willow') ? 'willow' : 'garden';
    ambience.setPlace(place, instant);
  }

  // the garden steps back politely while the playlist pop-up is open
  function followMusic() {
    if (!ctx) return;
    const open = musicDialog && musicDialog.open;
    duck.gain.setTargetAtTime(open ? 0.3 : 1, ctx.currentTime, 0.4);
  }

  // ---- Wiring --------------------------------------------------------------------------
  if (!AC) {
    // very old browsers: hide the speaker rather than offer a button that does nothing
    if (button) button.hidden = true;
    window.GardenSound = { play: () => false };
    return;
  }

  showButton();
  button.addEventListener('click', () => setEnabled(!enabled));

  // Sound was left on earlier in this visit: browsers only allow audio to start
  // after a click or key press, so it fades back in on the next one.
  function resumeOnGesture(event) {
    if (event.target && event.target.closest && event.target.closest('#sound-toggle')) return;
    if (enabled && (!ctx || ctx.state !== 'running') && !document.hidden) wake(1.8);
  }
  ['pointerup', 'touchend', 'click', 'keydown'].forEach((type) => document.addEventListener(type, resumeOnGesture, true));

  // quiet when the tab is hidden (or a playlist opens in a new tab), back when it returns
  document.addEventListener('visibilitychange', () => {
    if (!enabled || !ctx) return;
    if (document.hidden) sleep(0.25);
    else wake(1.2);
  });

  new MutationObserver(() => {
    if (!ctx) return;
    ambience.setGolden(body.classList.contains('mode-golden'), false);
    followRoom(false);
  }).observe(body, { attributes: true, attributeFilter: ['class'] });

  if (musicDialog) new MutationObserver(followMusic).observe(musicDialog, { attributes: true, attributeFilter: ['open'] });

  window.GardenSound = {
    play,
    get enabled() { return enabled; },
    get state() { return ctx ? ctx.state : 'not started'; },
    // used by the offline sound check (renders each recipe without playing it)
    recipes: SOUNDS,
    createAmbience,
    makeSpace
  };
})();
