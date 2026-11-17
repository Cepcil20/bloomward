export function createAudio() {
  let ctx = null;
  let muted = false;

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
    return ctx;
  }

  function playTone(freq, type, duration, gainVal = 0.1, rampDown = true) {
    if (muted) return;
    const ac = getContext();
    if (!ac) return;

    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(gainVal, ac.currentTime);
      if (rampDown) {
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
      }
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (e) {
      // ignore audio errors on restricted browsers
    }
  }

  return {
    get muted() { return muted; },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    shoot(kind) {
      if (kind === 'frost') {
        playTone(520, 'sine', 0.15, 0.08);
      } else if (kind === 'thorn') {
        playTone(180, 'sawtooth', 0.25, 0.12);
      } else {
        playTone(440, 'triangle', 0.1, 0.08);
      }
    },
    hit() {
      playTone(220, 'sine', 0.08, 0.06);
    },
    kill() {
      playTone(330, 'square', 0.15, 0.08);
    },
    coin() {
      playTone(880, 'sine', 0.12, 0.08);
    },
    leak() {
      playTone(110, 'sawtooth', 0.3, 0.15);
    },
    waveStart() {
      playTone(600, 'triangle', 0.4, 0.1);
    },
    win() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 'triangle', 0.3, 0.15);
        }, idx * 150);
      });
    },
    lose() {
      if (muted) return;
      const ac = getContext();
      if (!ac) return;
      const notes = [300, 250, 200, 150];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          playTone(freq, 'sawtooth', 0.3, 0.15);
        }, idx * 180);
      });
    },
    click() {
      playTone(700, 'sine', 0.05, 0.05);
    }
  };
}
