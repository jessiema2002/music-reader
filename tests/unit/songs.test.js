import { describe, it, expect } from 'vitest'
import { ALL_SONGS, SONGS_BY_CLEF, getSongById } from '../../src/data/songs'

describe('songs data', () => {
  describe('ALL_SONGS', () => {
    it('contains songs', () => {
      expect(ALL_SONGS.length).toBeGreaterThan(0)
    })

    it('all songs have required properties', () => {
      ALL_SONGS.forEach((song) => {
        expect(song).toHaveProperty('id')
        expect(song).toHaveProperty('title')
        expect(song).toHaveProperty('clef')
        expect(song).toHaveProperty('notes')
        expect(typeof song.id).toBe('string')
        expect(typeof song.title).toBe('string')
        expect(['treble', 'bass']).toContain(song.clef)
        expect(Array.isArray(song.notes)).toBe(true)
      })
    })

    it('all songs have 16 notes (2 phrases of 8)', () => {
      ALL_SONGS.forEach((song) => {
        expect(song.notes).toHaveLength(16)
      })
    })

    it('all notes are valid natural notes (A-G)', () => {
      const validNotes = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
      ALL_SONGS.forEach((song) => {
        song.notes.forEach((note) => {
          expect(validNotes).toContain(note.note)
          expect(typeof note.octave).toBe('number')
          expect(note.octave).toBeGreaterThanOrEqual(2)
          expect(note.octave).toBeLessThanOrEqual(5)
        })
      })
    })

    it('all notes have vexKey for VexFlow rendering', () => {
      ALL_SONGS.forEach((song) => {
        song.notes.forEach((note) => {
          expect(note).toHaveProperty('vexKey')
          expect(note.vexKey).toMatch(/^[a-g]\/[2-5]$/)
        })
      })
    })

    it('all song IDs are unique', () => {
      const ids = ALL_SONGS.map((s) => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('SONGS_BY_CLEF', () => {
    it('has treble and bass keys', () => {
      expect(SONGS_BY_CLEF).toHaveProperty('treble')
      expect(SONGS_BY_CLEF).toHaveProperty('bass')
    })

    it('treble songs all have clef = treble', () => {
      SONGS_BY_CLEF.treble.forEach((song) => {
        expect(song.clef).toBe('treble')
      })
    })

    it('bass songs all have clef = bass', () => {
      SONGS_BY_CLEF.bass.forEach((song) => {
        expect(song.clef).toBe('bass')
      })
    })

    it('treble songs use octaves 4-5', () => {
      SONGS_BY_CLEF.treble.forEach((song) => {
        song.notes.forEach((note) => {
          expect(note.octave).toBeGreaterThanOrEqual(4)
          expect(note.octave).toBeLessThanOrEqual(5)
        })
      })
    })

    it('bass songs use octaves 2-3', () => {
      SONGS_BY_CLEF.bass.forEach((song) => {
        song.notes.forEach((note) => {
          expect(note.octave).toBeGreaterThanOrEqual(2)
          expect(note.octave).toBeLessThanOrEqual(3)
        })
      })
    })

    it('combined treble + bass equals ALL_SONGS', () => {
      const combined = [...SONGS_BY_CLEF.treble, ...SONGS_BY_CLEF.bass]
      expect(combined).toHaveLength(ALL_SONGS.length)
    })
  })

  describe('getSongById', () => {
    it('returns song when ID exists', () => {
      const song = getSongById('twinkle')
      expect(song).not.toBeNull()
      expect(song.title).toBe('Twinkle Twinkle')
    })

    it('returns null for non-existent ID', () => {
      expect(getSongById('nonexistent')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(getSongById('')).toBeNull()
    })

    it('finds both treble and bass songs', () => {
      expect(getSongById('twinkle')).not.toBeNull() // treble
      expect(getSongById('bass-scale')).not.toBeNull() // bass
    })
  })

  describe('known songs sanity check', () => {
    it('Twinkle Twinkle starts with C C G G', () => {
      const twinkle = getSongById('twinkle')
      expect(twinkle.notes[0].note).toBe('C')
      expect(twinkle.notes[1].note).toBe('C')
      expect(twinkle.notes[2].note).toBe('G')
      expect(twinkle.notes[3].note).toBe('G')
    })

    it('Mary Had a Little Lamb starts with E D C D', () => {
      const mary = getSongById('mary')
      expect(mary.notes[0].note).toBe('E')
      expect(mary.notes[1].note).toBe('D')
      expect(mary.notes[2].note).toBe('C')
      expect(mary.notes[3].note).toBe('D')
    })
  })
})
