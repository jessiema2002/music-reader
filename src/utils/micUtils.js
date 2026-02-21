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
let lastNoteName = null
let lastNoteTime = 0
const COOLDOWN_MS = 700   // minimum ms between two note triggers

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
 * Returns the fundamental frequency in Hz, or -1 if signal is too weak / unclear.
 */
function detectPitch(buf, sampleRate) {
  const SIZE = buf.length
  const HALF = Math.floor(SIZE / 2)

  // Signal strength check — ignore silence / background noise
  let rms = 0
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / SIZE)
  if (rms < 0.015) return -1

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
 * @returns {Promise<string|null>}  null on success, error message string on failure
 */
export async function startMicListening(onNote) {
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
      if (freq > 0) {
        const note = freqToNote(freq)
        const now = Date.now()
        if (note && (note.name !== lastNoteName || now - lastNoteTime > COOLDOWN_MS)) {
          lastNoteName = note.name
          lastNoteTime = now
          onNote(note.name, note.octave)
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

/** Stop microphone listening and release all resources. */
export function stopMicListening() {
  if (rafId)   { cancelAnimationFrame(rafId); rafId = null }
  if (source)  { source.disconnect(); source = null }
  analyser = null
  if (audioCtx) { audioCtx.close(); audioCtx = null }
  if (stream)  { stream.getTracks().forEach(t => t.stop()); stream = null }
  lastNoteName = null
  lastNoteTime = 0
}
