/**
 * Microphone pitch detection using the McLeod Pitch Method (MPM) via pitchfinder.
 * Only fires for natural notes (A B C D E F G) — sharps/flats are skipped
 * so the result always matches the on-screen piano keys.
 *
 * Why MPM instead of YIN:
 *  - MPM uses normalised squared difference + peak-picking which handles the
 *    rich harmonic spectrum of real acoustic pianos far better than YIN.
 *  - YIN often locks onto a strong 2nd/3rd overtone; MPM's normalisation
 *    keeps the fundamental dominant even when upper partials are louder.
 *
 * Additional real-piano improvements:
 *  - Bandpass filter (high-pass + low-pass) tames overtones and room noise.
 *  - Silence-gap tracking resets the same-note cooldown so repeated strikes
 *    of the same key are detected reliably.
 */
import { Macleod as MPM } from 'pitchfinder'

const MIC_PRESETS = {
  strict: {
    fftSize: 4096, mpmCutoff: 0.93, rmsThreshold: 0.012,
    snapTolerance: 0.35, filterLow: 80, filterHigh: 2000,
  },
  normal: {
    fftSize: 8192, mpmCutoff: 0.90, rmsThreshold: 0.006,
    snapTolerance: 0.45, filterLow: 60, filterHigh: 2500,
  },
  piano: {
    fftSize: 8192, mpmCutoff: 0.85, rmsThreshold: 0.004,
    snapTolerance: 0.50, filterLow: 50, filterHigh: 2000,
  },
}

let audioCtx = null
let analyser = null
let source = null
let filterNodes = []         // high-pass & low-pass biquad filters
let stream = null
let rafId = null
let lastFiredNote = null
let lastFiredTime = 0
let suppressUntil = 0        // timestamp until which all mic detection is suppressed
const SAME_NOTE_COOLDOWN_MS = 700   // same note re-fire cooldown (reduced for real piano practice)
const ANY_NOTE_COOLDOWN_MS = 80     // brief post-fire block (handles attack transients)
const STABLE_FRAMES = 2             // consecutive frames a note must hold before firing (~33ms at 60fps)
const SILENCE_GAP_FRAMES = 4        // ~66ms of silence resets same-note tracking
let stableNote = null       // stores the full note object { name, octave }
let stableCount = 0
let silenceFrames = 0        // consecutive frames below RMS threshold
const DEBUG = false          // Set to true to see detection logs in console

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * Convert frequency to nearest natural note (A-G), tolerant to slight sharp/flat drift.
 * This helps with real piano overtones where detectors may land on nearby accidentals.
 */
function freqToNote(freq, snapTolerance) {
  if (freq < 27 || freq > 4200) return null
  const midiFloat = 12 * Math.log2(freq / 440) + 69

  let bestMidi = null
  let bestDist = Infinity
  const center = Math.round(midiFloat)

  for (let midi = center - 2; midi <= center + 2; midi++) {
    const name = NOTE_NAMES[((midi % 12) + 12) % 12]
    if (name.includes('#')) continue
    const dist = Math.abs(midiFloat - midi)
    if (dist < bestDist) {
      bestDist = dist
      bestMidi = midi
    }
  }

  if (bestMidi === null || bestDist > snapTolerance) return null
  const name = NOTE_NAMES[((bestMidi % 12) + 12) % 12]
  const octave = Math.floor(bestMidi / 12) - 1
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
 * @param {{ mode?: 'strict'|'normal'|'piano' }} options detection profile
 * @returns {Promise<string|null>}  null on success, error message string on failure
 */
export async function startMicListening(onNote, onHeard, options = {}) {
  try {
    const mode = options.mode ?? 'normal'
    const preset = MIC_PRESETS[mode] ?? MIC_PRESETS.normal

    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = preset.fftSize
    source = audioCtx.createMediaStreamSource(stream)

    // ── Bandpass filter chain ─────────────────────────────────────────────
    // High-pass removes low-frequency room rumble / air-conditioning hum.
    // Low-pass tames strong upper harmonics that make YIN latch onto an
    // overtone instead of the fundamental — the #1 cause of missed notes
    // on real acoustic pianos.
    const highpass = audioCtx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = preset.filterLow
    highpass.Q.value = 0.7

    const lowpass = audioCtx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = preset.filterHigh
    lowpass.Q.value = 0.7

    source.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(analyser)
    filterNodes = [highpass, lowpass]

    const buf = new Float32Array(analyser.fftSize)
    // MPM detector — created once per audio context so sampleRate is baked in.
    // cutoff: normalised peak threshold — higher = stricter (0-1)
    const mpmDetect = MPM({ sampleRate: audioCtx.sampleRate, cutoff: preset.mpmCutoff })

    function loop() {
      analyser.getFloatTimeDomainData(buf)
      // Skip pitch detection on silent frames for performance
      const rms = getRms(buf)
      const rawFreq = rms >= preset.rmsThreshold ? mpmDetect(buf) : null
      const freq = rawFreq ?? -1
      const note = freq > 0 ? freqToNote(freq, preset.snapTolerance) : null
      const candidateName = note ? note.name : null

      // ── Silence-gap tracking ──────────────────────────────────────────
      // When we detect a gap of silence (e.g. between two strikes of the
      // same key), reset lastFiredNote so the next note — even if identical —
      // will fire immediately rather than being blocked by the same-note
      // cooldown.  This is critical for real pianos where the player may
      // repeat a note within < 1 second.
      if (rms < preset.rmsThreshold * 1.5) {
        silenceFrames++
        if (silenceFrames >= SILENCE_GAP_FRAMES) {
          lastFiredNote = null        // allow same note to fire again
        }
      } else {
        silenceFrames = 0
      }

      if (DEBUG && freq > 0) {
        console.log(`[MIC] freq=${freq.toFixed(1)}Hz rms=${rms.toFixed(4)} note=${candidateName || 'null'}, stable=${stableNote?.name}:${stableCount}, silence=${silenceFrames}`)
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
  filterNodes.forEach(n => n.disconnect())
  filterNodes = []
  analyser = null
  if (audioCtx) { audioCtx.close(); audioCtx = null }
  if (stream)  { stream.getTracks().forEach(t => t.stop()); stream = null }
  lastFiredNote = null
  lastFiredTime = 0
  suppressUntil = 0
  stableNote = null
  stableCount = 0
  silenceFrames = 0
}
