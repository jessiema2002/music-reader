import { describe, it, expect } from 'vitest'
import { checkAnswer, generateSong } from '../../src/utils/noteUtils'

describe('noteUtils', () => {
  describe('checkAnswer', () => {
    it('returns true when note names match', () => {
      const target = { note: 'C', octave: 4 }
      expect(checkAnswer(target, 'C')).toBe(true)
    })

    it('returns false when note names differ', () => {
      const target = { note: 'C', octave: 4 }
      expect(checkAnswer(target, 'D')).toBe(false)
    })
  })

  describe('generateSong', () => {
    it('generates a song with the requested length', () => {
      const song = generateSong(12, 'treble')
      expect(song).toHaveLength(12)
    })

    it('avoids consecutive duplicates', () => {
      const song = generateSong(50, 'treble')
      for (let i = 1; i < song.length; i++) {
        expect(song[i]).not.toEqual(song[i - 1])
      }
    })
  })
})
