// MamaTrack GPS — Emergency alert tone
//
// This replaces a per-call `new AudioContext()`. Browsers cap how many audio
// contexts a page may hold (Chrome allows about six), and the old code created
// one on every alert and never closed it, so after a handful of emergencies the
// tone became unreliable — sometimes truncated, sometimes silent. It also ended
// its fade at a gain of 0.01 rather than at silence, so stopping the oscillator
// cut a still-audible signal and produced an audible click.
//
// One context is created on first use and reused. Because browsers start a
// context suspended until the user has interacted with the page, resume() is
// attempted on each play.

let ctx: AudioContext | null = null;
let busyUntil = 0;

type AudioContextCtor = typeof window.AudioContext;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx && ctx.state !== 'closed') return ctx;

  // Safari still only exposes the prefixed constructor.
  const Ctor: AudioContextCtor | undefined = window.AudioContext
    || (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;

  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

/** One beep: a short tone with a clean attack and a fade that reaches silence. */
function beep(context: AudioContext, startAt: number, frequency: number, duration: number, peak: number) {
  const osc = context.createOscillator();
  const gain = context.createGain();

  osc.type = 'triangle'; // softer than square, more present than sine on phone speakers
  osc.frequency.setValueAtTime(frequency, startAt);

  // Ramp to true zero. exponentialRampToValueAtTime can never reach 0, so the
  // tail is a linear ramp — that is what removes the click at the end.
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peak, startAt + 0.012);
  gain.gain.setValueAtTime(peak, startAt + duration - 0.06);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);

  osc.connect(gain);
  gain.connect(context.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
  osc.onended = () => {
    // Release the nodes; the context itself is kept for reuse.
    osc.disconnect();
    gain.disconnect();
  };
}

/**
 * Two rising beeps, the shape of a dispatch alert rather than a single swoop.
 * Overlapping calls are ignored: a second emergency arriving mid-tone used to
 * layer a second context on top, which is where the dissonance came from.
 */
export function playAlertSound(): void {
  const context = getContext();
  if (!context) return;

  // Autoplay policy leaves the context suspended until a gesture. Resuming is
  // asynchronous, so schedule against currentTime after the attempt.
  if (context.state === 'suspended') {
    context.resume().catch(() => { /* still blocked; nothing more to do */ });
  }

  const now = context.currentTime;
  if (now < busyUntil) return;

  const gap = 0.16;
  const length = 0.14;
  const peak = 0.22;

  try {
    beep(context, now + 0.01, 784, length, peak);        // G5
    beep(context, now + 0.01 + gap, 1047, length, peak); // C6
  } catch {
    return;
  }

  busyUntil = now + gap + length + 0.05;
}

/** Release the audio device, e.g. when the dashboard unmounts. */
export function releaseAlertSound(): void {
  if (ctx && ctx.state !== 'closed') {
    ctx.close().catch(() => { /* already closing */ });
  }
  ctx = null;
  busyUntil = 0;
}
