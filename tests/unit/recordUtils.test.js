import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadRecords, saveRecord, formatTime } from '../../src/utils/recordUtils'

describe('recordUtils', () => {
  describe('formatTime', () => {
    it('formats milliseconds under a minute correctly', () => {
      expect(formatTime(5000)).toBe('05.0s')
      expect(formatTime(12300)).toBe('12.3s')
    })

    it('formats milliseconds over a minute with m:ss.t format', () => {
      expect(formatTime(60000)).toBe('1:00.0')
      expect(formatTime(65200)).toBe('1:05.2')
      expect(formatTime(125700)).toBe('2:05.7')
    })

    it('handles edge cases', () => {
      expect(formatTime(0)).toBe('00.0s')
      expect(formatTime(100)).toBe('00.1s')
      expect(formatTime(999)).toBe('01.0s') // rounds to 1.0
    })

    it('returns "--" for null or undefined', () => {
      expect(formatTime(null)).toBe('--')
      expect(formatTime(undefined)).toBe('--')
    })

    it('returns "--" for NaN', () => {
      expect(formatTime(NaN)).toBe('--')
    })
  })

  describe('loadRecords', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('returns empty array when no records exist', () => {
      expect(loadRecords()).toEqual([])
    })

    it('returns parsed records from localStorage', () => {
      const records = [
        { id: 1, score: 5, total: 8 },
        { id: 2, score: 8, total: 8 },
      ]
      localStorage.setItem('music-reader-records', JSON.stringify(records))
      expect(loadRecords()).toEqual(records)
    })

    it('returns empty array on parse error', () => {
      localStorage.setItem('music-reader-records', 'invalid json')
      expect(loadRecords()).toEqual([])
    })
  })

  describe('saveRecord', () => {
    beforeEach(() => {
      localStorage.clear()
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-02-27T10:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('saves a new record and returns updated array', () => {
      const result = saveRecord({
        elapsedMs: 5000,
        score: 7,
        total: 8,
        songLength: 8,
        title: 'Test Song',
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        elapsedMs: 5000,
        score: 7,
        total: 8,
        songLength: 8,
        title: 'Test Song',
      })
      expect(result[0].date).toBe('2026-02-27T10:00:00.000Z')
    })

    it('prepends new records to existing ones', () => {
      saveRecord({ elapsedMs: 5000, score: 5, total: 8, songLength: 8, title: 'First' })
      const result = saveRecord({ elapsedMs: 4000, score: 8, total: 8, songLength: 8, title: 'Second' })

      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Second')
      expect(result[1].title).toBe('First')
    })

    it('uses "Random" as default title', () => {
      const result = saveRecord({ elapsedMs: 5000, score: 5, total: 8, songLength: 8 })
      expect(result[0].title).toBe('Random')
    })

    it('limits to 50 records', () => {
      // Save 55 records
      for (let i = 0; i < 55; i++) {
        vi.setSystemTime(new Date(Date.now() + i * 1000))
        saveRecord({ elapsedMs: i * 1000, score: i % 8, total: 8, songLength: 8, title: `Song ${i}` })
      }

      const result = loadRecords()
      expect(result).toHaveLength(50)
      // Most recent should be first
      expect(result[0].title).toBe('Song 54')
    })
  })
})
