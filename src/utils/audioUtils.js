/**
 * Piano-like note synthesis using the Web Audio API.
 * No external dependencies — works in all modern browsers.
 *
 * The AudioContext is created lazily on the first call (browsers require a
 * user gesture before creating audio contexts).
 */

let ctx = null

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  // Resume if the browser suspended it (common on iOS / Chrome autoplay policy)
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Map note letter → semitone offset from C */
const SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

/**
 * Convert a note name + octave to frequency (Hz).
 * Uses equal temperament: f = 440 × 2^((midi − 69) / 12)
 * MIDI: C4 = 60, (octave+1)*12 + semitone
 */
function noteToFreq(note, octave) {
  const semitone = SEMITONES[note.toUpperCase()]
  if (semitone === undefined) return null
  const midi = (octave + 1) * 12 + semitone
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * Play a piano-like note.
 * @param {string} note  - Note letter, e.g. "C", "D", "E"
 * @param {number} octave - Octave number, e.g. 4
 * @param {number} [duration=0.6] - Approximate audible duration in seconds
 */
export function playNote(note, octave, duration = 0.6) {
  const freq = noteToFreq(note, octave)
  if (!freq) return

  try {
    const ac = getCtx()
    const now = ac.currentTime

    // ─── Oscillators ────────────────────────────────────────────────────────
    // Blend a sine (fundamental) with a triangle (adds warmth / overtones)
    const osc1 = ac.createOscillator()
    const osc2 = ac.createOscillator()
    osc1.type = 'triangle'
    osc2.type = 'sine'
    osc1.frequency.value = freq
    osc2.frequency.value = freq * 2   // one octave up — adds brightness

    // ─── Gain / envelope ────────────────────────────────────────────────────
    const gain = ac.createGain()
    const g = gain.gain

    // Attack: 8 ms
    g.setValueAtTime(0, now)
    g.linearRampToValueAtTime(0.45, now + 0.008)

    // Decay to sustain level: ~120 ms
    g.exponentialRampToValueAtTime(0.18, now + 0.12)

    // Release: fade to silence by `duration`
    g.exponentialRampToValueAtTime(0.001, now + duration)

    // ─── Harmonic mix ───────────────────────────────────────────────────────
    const mix1 = ac.createGain()   // fundamental — louder
    const mix2 = ac.createGain()   // octave — quieter
    mix1.gain.value = 1.0
    mix2.gain.value = 0.15

    osc1.connect(mix1).connect(gain)
    osc2.connect(mix2).connect(gain)
    gain.connect(ac.destination)

    // ─── Run ────────────────────────────────────────────────────────────────
    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + duration + 0.05)
    osc2.stop(now + duration + 0.05)
  } catch (err) {
    // Audio errors should never break the game
    console.warn('playNote error:', err)
  }
}
