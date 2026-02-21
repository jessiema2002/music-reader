/**
 * Microphone pitch detection using the YIN algorithm via pitchfinder.
 * Only fires for natural notes (A B C D E F G) — sharps/flats are skipped
 * so the result always matches the on-screen piano keys.
 */
import { YIN } from 'pitchfinder'

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

/** RMS energy check — skip the YIN call entirely on silent frames for performance. */
function getRms(buf) {
  let sum = 0
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
  return Math.sqrt(sum / buf.length)
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
    // YIN detector — created once per audio context so sampleRate is baked in.
    // threshold: cumulative mean normalised difference threshold (lower = stricter)
    const yinDetect = YIN({ sampleRate: audioCtx.sampleRate, threshold: 0.1 })

    function loop() {
      analyser.getFloatTimeDomainData(buf)
      // Skip YIN on silent frames for performance; null return means no pitch found
      const rms = getRms(buf)
      const rawFreq = rms >= 0.015 ? yinDetect(buf) : null
      const freq = rawFreq ?? -1
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
