// All notes on the treble clef staff from C4 to G5 (including ledger lines)
export const TREBLE_NOTES = [
  { note: 'C', octave: 4, vexKey: 'c/4', pianoIndex: 0 },
  { note: 'D', octave: 4, vexKey: 'd/4', pianoIndex: 1 },
  { note: 'E', octave: 4, vexKey: 'e/4', pianoIndex: 2 },
  { note: 'F', octave: 4, vexKey: 'f/4', pianoIndex: 3 },
  { note: 'G', octave: 4, vexKey: 'g/4', pianoIndex: 4 },
  { note: 'A', octave: 4, vexKey: 'a/4', pianoIndex: 5 },
  { note: 'B', octave: 4, vexKey: 'b/4', pianoIndex: 6 },
  { note: 'C', octave: 5, vexKey: 'c/5', pianoIndex: 7 },
  { note: 'D', octave: 5, vexKey: 'd/5', pianoIndex: 8 },
  { note: 'E', octave: 5, vexKey: 'e/5', pianoIndex: 9 },
  { note: 'F', octave: 5, vexKey: 'f/5', pianoIndex: 10 },
  { note: 'G', octave: 5, vexKey: 'g/5', pianoIndex: 11 },
]

// Bass clef staff: G2 (bottom line) → B3 (one above top line)
// Lines: G2 B2 D3 F3 A3 — Spaces: A2 C3 E3 G3
export const BASS_NOTES = [
  { note: 'G', octave: 2, vexKey: 'g/2', pianoIndex: 4 },
  { note: 'A', octave: 2, vexKey: 'a/2', pianoIndex: 5 },
  { note: 'B', octave: 2, vexKey: 'b/2', pianoIndex: 6 },
  { note: 'C', octave: 3, vexKey: 'c/3', pianoIndex: 7 },
  { note: 'D', octave: 3, vexKey: 'd/3', pianoIndex: 8 },
  { note: 'E', octave: 3, vexKey: 'e/3', pianoIndex: 9 },
  { note: 'F', octave: 3, vexKey: 'f/3', pianoIndex: 10 },
  { note: 'G', octave: 3, vexKey: 'g/3', pianoIndex: 11 },
  { note: 'A', octave: 3, vexKey: 'a/3', pianoIndex: 12 },
  { note: 'B', octave: 3, vexKey: 'b/3', pianoIndex: 13 },
]

export const NOTE_POOLS = { treble: TREBLE_NOTES, bass: BASS_NOTES }

/**
 * Returns a random note from the given pool, different from prevNote.
 * @param {object|null} prevNote
 * @param {object[]} pool
 * @returns {object}
 */
export function getRandomNote(prevNote, pool = TREBLE_NOTES) {
  let candidates = pool
  if (prevNote) {
    candidates = pool.filter(
      (n) => !(n.note === prevNote.note && n.octave === prevNote.octave)
    )
  }
  const idx = Math.floor(Math.random() * candidates.length)
  return candidates[idx]
}

/**
 * Checks if the clicked note name matches the target note name (ignores octave).
 * @param {object} targetNote
 * @param {string} clickedNoteName
 * @returns {boolean}
 */
export function checkAnswer(targetNote, clickedNoteName) {
  return targetNote.note === clickedNoteName
}

/**
 * Generates a random sequence of notes for a short song.
 * Avoids consecutive repeated notes.
 * @param {number} length
 * @param {string} clef  'treble' | 'bass'
 * @returns {object[]}
 */
export function generateSong(length = 8, clef = 'treble') {
  const pool = NOTE_POOLS[clef] || TREBLE_NOTES
  const notes = []
  let prev = null
  for (let i = 0; i < length; i++) {
    const next = getRandomNote(prev, pool)
    notes.push(next)
    prev = next
  }
  return notes
}
