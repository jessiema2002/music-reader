/**
 * Microphone pitch detection using the **pitchy** library (autocorrelation).
 *
 * pitchy provides a clarity score (0-1) with every detection, which is far
 * more reliable than YIN/pitchfinder for real instruments - especially piano
 * where rich harmonics and fast decay confuse simpler algorithms.
 *
 * Only fires for natural notes (A B C D E F G) - sharps/flats are snapped
 * to the nearest natural so the result always matches the on-screen keys.
 *
 * Audio chain: mic -> highpass -> lowpass -> compressor -> analyser
 */
import { PitchDetector } from 'pitchy'

export const MIC_PRESETS = {
  strict: {
    bufSize: 2048, clarityThreshold: 0.90, rmsThreshold: 0.006,
    snapTolerance: 0.40, filterLow: 80, filterHigh: 2000,
    useCompressor: false,
  },
  normal: {
    bufSize: 2048, clarityThreshold: 0.80, rmsThreshold: 0.003,
    snapTolerance: 0.50, filterLow: 55, filterHigh: 3000,
    useCompressor: true,
  },
  piano: {
    bufSize: 2048, clarityThreshold: 0.70, rmsThreshold: 0.002,
    snapTolerance: 0.55, filterLow: 40, filterHigh: 2000,
    useCompressor: true,
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
const SAME_NOTE_COOLDOWN_MS = 450   // same note re-fire cooldown
const ANY_NOTE_COOLDOWN_MS = 40     // brief post-fire block (handles attack transients)
const STABLE_FRAMES = 1             // fire immediately on first detection
const SILENCE_GAP_FRAMES = 2        // ~33ms of silence resets same-note tracking
let stableNote = null       // stores the full note object { name, octave }
let stableCount = 0
let silenceFrames = 0        // consecutive frames below RMS threshold
const DEBUG = true           // Always-on debug logging — check browser console to diagnose mic issues

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/**
 * Convert frequency to nearest natural note (A-G), tolerant to slight sharp/flat drift.
 * This helps with real piano overtones where detectors may land on nearby accidentals.
 * @param {number} freq  frequency in Hz
 * @param {number} snapTolerance  max semitone distance to snap to a natural note
 * @returns {{ name: string, octave: number } | null}
 */
export function freqToNote(freq, snapTolerance) {
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

/** RMS energy check — skip the YIN call entirely on silent frames for performance.
 * @param {Float32Array} buf  audio samples
 * @returns {number}  RMS value
 */
export function getRms(buf) {
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
    // Some browsers suspend AudioContext until explicitly resumed, even after a user gesture.
    // This is the #1 cause of silent mic detection — always resume before processing.
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }
    console.log(`[MIC] AudioContext state: ${audioCtx.state}, sampleRate: ${audioCtx.sampleRate} Hz, mode: ${mode}`)
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = preset.bufSize
    source = audioCtx.createMediaStreamSource(stream)

    // ── Audio processing chain ────────────────────────────────────────────
    // High-pass removes low-frequency room rumble / air-conditioning hum.
    // Low-pass tames strong upper harmonics.
    const highpass = audioCtx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = preset.filterLow
    highpass.Q.value = 0.7

    const lowpass = audioCtx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = preset.filterHigh
    lowpass.Q.value = 0.7

    // Chain: source → highpass → lowpass → [compressor?] → analyser
    source.connect(highpass)
    highpass.connect(lowpass)
    let lastNode = lowpass

    // ── Dynamics compressor (normal & piano modes) ──────────────────────
    // Piano notes have a sharp percussive attack then fast decay.
    // The compressor boosts the quieter sustained body of the note and
    // tames the initial spike, giving the detector more usable frames.
    if (preset.useCompressor) {
      const compressor = audioCtx.createDynamicsCompressor()
      compressor.threshold.value = -40   // start compressing at -40 dB
      compressor.knee.value = 12         // soft knee
      compressor.ratio.value = 8         // 8:1 compression — aggressive for pitch detection
      compressor.attack.value = 0.002    // 2ms — catch the transient quickly
      compressor.release.value = 0.15    // 150ms — hold gain up through the note body
      lastNode.connect(compressor)
      lastNode = compressor
      filterNodes.push(compressor)
    }

    lastNode.connect(analyser)
    filterNodes.push(highpass, lowpass)

    // Some browsers (especially Safari) won't process AnalyserNode data unless
    // the graph ultimately connects to the audio destination.
    // A silent GainNode (gain=0) forces the graph to stay active without
    // causing microphone feedback through the speakers.
    const silentGain = audioCtx.createGain()
    silentGain.gain.value = 0
    analyser.connect(silentGain)
    silentGain.connect(audioCtx.destination)
    filterNodes.push(silentGain)

    const buf = new Float32Array(preset.bufSize)
    const detector = PitchDetector.forFloat32Array(preset.bufSize)
    let diagFrames = 0

    function loop() {
      analyser.getFloatTimeDomainData(buf)
      const rms = getRms(buf)
      if (diagFrames < 10) {
        console.log(`[MIC] frame ${diagFrames}: rms=${rms.toFixed(5)} threshold=${preset.rmsThreshold} ctx=${audioCtx?.state}`)
        diagFrames++
      }

      let freq = -1
      let clarity = 0
      let note = null
      let candidateName = null

      if (rms >= preset.rmsThreshold) {
        const [pitch, cl] = detector.findPitch(buf, audioCtx.sampleRate)
        freq = pitch
        clarity = cl
        if (freq > 0 && clarity >= preset.clarityThreshold) {
          note = freqToNote(freq, preset.snapTolerance)
          candidateName = note ? note.name : null
        }
      }

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

      if (DEBUG && rms >= preset.rmsThreshold) {
        console.log(`[MIC] freq=${freq > 0 ? freq.toFixed(1) : '-'}Hz clarity=${clarity.toFixed(2)} rms=${rms.toFixed(4)} note=${candidateName || '(rejected)'} stable=${stableNote?.name || '-'}:${stableCount} lastFired=${lastFiredNote || '-'}`)
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
          if (DEBUG) console.log(`[MIC] FIRE: ${stableNote.name}${stableNote.octave} (clarity=${clarity.toFixed(2)})`)
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
