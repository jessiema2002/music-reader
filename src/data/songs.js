/**
 * Built-in song library.
 * Each song has exactly 8 quarter notes (2 measures of 4/4) so it fits
 * the existing two-measure staff display without changes.
 * All notes are naturals (A–G) so the piano keyboard can answer them.
 */

const q = (note, octave) => ({
  note,
  octave,
  vexKey: `${note.toLowerCase()}/${octave}`,
  duration: 'q',
})

// ─── Treble clef songs ───────────────────────────────────────────────────────

const TREBLE_SONGS = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle',
    clef: 'treble',
    notes: [
      // Phrase 1 — "Twinkle twinkle little star"
      q('C',4), q('C',4), q('G',4), q('G',4), q('A',4), q('A',4), q('G',4), q('G',4),
      // Phrase 2 — "How I wonder what you are"
      q('F',4), q('F',4), q('E',4), q('E',4), q('D',4), q('D',4), q('C',4), q('C',4),
    ],
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    clef: 'treble',
    notes: [
      // Phrase 1 — "Mary had a little lamb"
      q('E',4), q('D',4), q('C',4), q('D',4), q('E',4), q('E',4), q('E',4), q('E',4),
      // Phrase 2 — "whose fleece was white as snow"
      q('D',4), q('D',4), q('D',4), q('D',4), q('E',4), q('G',4), q('G',4), q('G',4),
    ],
  },
  {
    id: 'ode',
    title: 'Ode to Joy',
    clef: 'treble',
    notes: [
      // Phrase 1
      q('E',4), q('E',4), q('F',4), q('G',4), q('G',4), q('F',4), q('E',4), q('D',4),
      // Phrase 2
      q('C',4), q('C',4), q('D',4), q('E',4), q('E',4), q('D',4), q('D',4), q('D',4),
    ],
  },
  {
    id: 'frere',
    title: 'Frère Jacques',
    clef: 'treble',
    notes: [
      // "Frère Jacques, Frère Jacques"
      q('C',4), q('D',4), q('E',4), q('C',4), q('C',4), q('D',4), q('E',4), q('C',4),
      // "Dormez-vous? Dormez-vous?"
      q('E',4), q('F',4), q('G',4), q('G',4), q('E',4), q('F',4), q('G',4), q('G',4),
    ],
  },
  {
    id: 'london',
    title: 'London Bridge',
    clef: 'treble',
    notes: [
      // Phrase 1
      q('G',4), q('A',4), q('G',4), q('F',4), q('E',4), q('F',4), q('G',4), q('D',4),
      // Phrase 2
      q('E',4), q('F',4), q('G',4), q('G',4), q('A',4), q('G',4), q('F',4), q('E',4),
    ],
  },
  {
    id: 'claire',
    title: 'Au Clair de la Lune',
    clef: 'treble',
    notes: [
      // Phrase 1
      q('C',4), q('C',4), q('C',4), q('D',4), q('E',4), q('D',4), q('C',4), q('E',4),
      // Phrase 2
      q('D',4), q('D',4), q('C',4), q('C',4), q('D',4), q('D',4), q('C',4), q('C',4),
    ],
  },
  {
    id: 'merrily',
    title: 'Merrily We Roll Along',
    clef: 'treble',
    notes: [
      // Phrase 1
      q('E',4), q('D',4), q('C',4), q('D',4), q('E',4), q('E',4), q('E',4), q('E',4),
      // Phrase 2
      q('D',4), q('D',4), q('D',4), q('D',4), q('E',4), q('G',4), q('G',4), q('G',4),
    ],
  },
  {
    id: 'saints',
    title: 'When the Saints',
    clef: 'treble',
    notes: [
      // Phrase 1
      q('C',4), q('E',4), q('F',4), q('G',4), q('C',4), q('E',4), q('F',4), q('G',4),
      // Phrase 2
      q('E',4), q('C',4), q('E',4), q('G',4), q('E',4), q('D',4), q('C',4), q('C',4),
    ],
  },
  {
    id: 'joy',
    title: 'Joy to the World',
    clef: 'treble',
    notes: [
      // Descending phrase
      q('C',5), q('B',4), q('A',4), q('G',4), q('F',4), q('E',4), q('D',4), q('C',4),
      // Second phrase
      q('G',4), q('G',4), q('A',4), q('G',4), q('F',4), q('E',4), q('D',4), q('C',4),
    ],
  },
  {
    id: 'hotcross',
    title: 'Hot Cross Buns',
    clef: 'treble',
    notes: [
      // Phrase 1 (repeated)
      q('E',4), q('D',4), q('C',4), q('C',4), q('E',4), q('D',4), q('C',4), q('C',4),
      // Phrase 2
      q('C',4), q('C',4), q('C',4), q('C',4), q('D',4), q('D',4), q('D',4), q('D',4),
    ],
  },
]

// ─── Bass clef songs ─────────────────────────────────────────────────────────

const BASS_SONGS = [
  {
    id: 'bass-scale',
    title: 'Bass Scale Walk',
    clef: 'bass',
    notes: [
      // Ascending
      q('G',2), q('A',2), q('B',2), q('C',3), q('D',3), q('E',3), q('F',3), q('G',3),
      // Descending
      q('G',3), q('F',3), q('E',3), q('D',3), q('C',3), q('B',2), q('A',2), q('G',2),
    ],
  },
  {
    id: 'bass-ode',
    title: 'Ode to Joy (Bass)',
    clef: 'bass',
    notes: [
      // Phrase 1
      q('E',3), q('E',3), q('F',3), q('G',3), q('G',3), q('F',3), q('E',3), q('D',3),
      // Phrase 2
      q('C',3), q('C',3), q('D',3), q('E',3), q('E',3), q('D',3), q('D',3), q('D',3),
    ],
  },
  {
    id: 'bass-mary',
    title: 'Mary Had a Little Lamb (Bass)',
    clef: 'bass',
    notes: [
      // Phrase 1
      q('E',3), q('D',3), q('C',3), q('D',3), q('E',3), q('E',3), q('E',3), q('E',3),
      // Phrase 2
      q('D',3), q('D',3), q('D',3), q('D',3), q('E',3), q('G',3), q('G',3), q('G',3),
    ],
  },
]

export const ALL_SONGS = [...TREBLE_SONGS, ...BASS_SONGS]

export const SONGS_BY_CLEF = {
  treble: TREBLE_SONGS,
  bass: BASS_SONGS,
}

export function getSongById(id) {
  return ALL_SONGS.find((s) => s.id === id) || null
}
