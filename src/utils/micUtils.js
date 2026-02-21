/**
 * Microphone pitch detection using autocorrelation.
 * No external dependencies — Web Audio API only.
 *
 * Only fires for natural notes (A B C D E F G) — sharps/flats are skipped
 * so the result always matches the on-screen piano keys.
 */

let audioCtx = null
let analyser = null
let source = null
let stream = null
let rafId = null
let lastFiredNote = null
let lastFiredTime = 0
let suppressUntil = 0        // timestamp until which all mic detection is suppressed
const SAME_NOTE_COOLDOWN_MS = 1500  // same note won't fire again for 1.5s (covers piano sustain)
const ANY_NOTE_COOLDOWN_MS = 100    // any note blocked for 100ms after a fire (handles attack transients)
const STABLE_FRAMES = 3             // consecutive frames a note must hold before firing (~50ms at 60fps)
let stableNote = null       // stores the full note object { name, octave }
let stableCount = 0
const DEBUG = false         // Set to true to see detection logs in console

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Convert a frequency (Hz) to { name, octave }, or null if out of range / a sharp. */
function freqToNote(freq) {
  if (freq < 27 || freq > 4200) return null
  const midi = Math.round(12 * Math.log2(freq / 440) + 69)
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  if (name.includes('#')) return null   // skip accidentals
  const octave = Math.floor(midi / 12) - 1
  return { name, octave }
}

/**
 * Autocorrelation pitch detector.
 * Returns the fundamental frequency in Hz, or -1 if signal is too weak / unclear / noisy.
 */
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length
  const HALF = Math.floor(SIZE / 2)

  // Signal strength check — ignore silence / background noise
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.025) return -1   // raised from 0.015 — filters more ambient noise

  // Build autocorrelation array
  const c = new Float32Array(HALF)
  for (let i = 0; i < HALF; i++) {
    let s = 0
    for (let j = 0; j < HALF; j++) s += buf[j] * buf[j + i]
    c[i] = s
  }

  // Skip the initial peak (lag=0), descend to first valley, then find next peak
  let d = 0
  while (d < HALF - 1 && c[d] > c[d + 1]) d++
  let maxVal = -Infinity, maxPos = -1
  for (let i = d; i < HALF; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i }
  }
  if (maxPos < 2) return -1

  // Clarity check — ratio of detected peak to zero-lag power.
  // Pure tones (piano, voice singing) score > 0.9; speech/noise/claps score low.
  // This is the strongest filter against environmental noise.
  const clarity = c[0] > 0 ? maxVal / c[0] : 0
  if (clarity < 0.9) return -1

  // Parabolic interpolation for sub-sample period accuracy
  const x1 = c[maxPos - 1], x2 = c[maxPos], x3 = c[maxPos + 1]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  const T0 = a ? maxPos - b / (2 * a) : maxPos
  return sampleRate / T0
}

/**
 * Start microphone listening.
 * @param {(noteName: string, octave: number) => void} onNote  called when a stable note is detected
 * @param {(noteName: string, freq: number) => void} onHeard  called every time a note is heard (for debugging)
 * @returns {Promise<string|null>}  null on success, error message string on failure
 */
export async function startMicListening(onNote, onHeard) {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const buf = new Float32Array(analyser.fftSize)

    function loop() {
      analyser.getFloatTimeDomainData(buf)
      const freq = detectPitch(buf, audioCtx.sampleRate)
      const note = freq > 0 ? freqToNote(freq) : null
      const candidateName = note ? note.name : null

      if (DEBUG && freq > 0) {
        console.log(`[MIC] freq=${freq.toFixed(1)}Hz, note=${candidateName || 'null'}, stable=${stableNote?.name}:${stableCount}`)
      }

      // Report what we're hearing to the UI
      if (onHeard && candidateName) {
        onHeard(candidateName, freq)
      }

      if (note && stableNote && note.name === stableNote.name) {
        stableCount++
      } else if (note) {
        // Only reset if we detect a different note, not on silence
        stableNote = note
        stableCount = 1
      }
      // If note is null (silence/sharp), don't reset - just wait

      const now = Date.now()

      // Hard-suppressed: mic is muted externally (e.g. while speaker audio plays back)
      if (now < suppressUntil) {
        stableNote = null
        stableCount = 0
        rafId = requestAnimationFrame(loop)
        return
      }

      if (stableCount >= STABLE_FRAMES && stableNote) {
        const timeSinceLastFire = now - lastFiredTime
        const sameNote = stableNote.name === lastFiredNote
        
        if (timeSinceLastFire < ANY_NOTE_COOLDOWN_MS) {
          // Brief post-fire block — handles pitch wobble on the attack of the next note
        } else if (!sameNote || timeSinceLastFire > SAME_NOTE_COOLDOWN_MS) {
          if (DEBUG) console.log(`[MIC] 🎵 FIRE: ${stableNote.name}`)
          lastFiredNote = stableNote.name
          lastFiredTime = now
          onNote(stableNote.name, stableNote.octave)
          stableNote = null
          stableCount = 0
        }
      }
      rafId = requestAnimationFrame(loop)
    }
    loop()
    return null
  } catch (err) {
    return err.name === 'NotAllowedError'
      ? 'Microphone access denied — allow it in your browser settings and try again.'
      : `Microphone error: ${err.message}`
  }
}

/**
 * Temporarily suppress mic detection (e.g. while speaker audio is playing).
 * @param {number} durationMs  how long to suppress
 */
export function suppressMicListening(durationMs) {
  suppressUntil = Date.now() + durationMs
}

/** Stop microphone listening and release all resources. */
export function stopMicListening() {
  if (rafId)   { cancelAnimationFrame(rafId); rafId = null }
  if (source)  { source.disconnect(); source = null }
  analyser = null
  if (audioCtx) { audioCtx.close(); audioCtx = null }
  if (stream)  { stream.getTracks().forEach(t => t.stop()); stream = null }
  lastFiredNote = null
  lastFiredTime = 0
  suppressUntil = 0
  stableNote = null
  stableCount = 0
}
