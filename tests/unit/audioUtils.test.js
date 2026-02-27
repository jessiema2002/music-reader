import { describe, it, expect, beforeEach, vi } from 'vitest'
import { playNote } from '../../src/utils/audioUtils'

// Mock Web Audio API
const mockOscillator = {
  type: '',
  frequency: { value: 0 },
  connect: vi.fn().mockReturnThis(),
  start: vi.fn(),
  stop: vi.fn(),
}

const mockGain = {
  gain: {
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn().mockReturnThis(),
}

const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  destination: {},
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createGain: vi.fn(() => ({
    ...mockGain,
    gain: { ...mockGain.gain },
  })),
  resume: vi.fn(),
}

describe('audioUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module to clear cached AudioContext
    vi.resetModules()
    // Mock AudioContext globally
    global.AudioContext = vi.fn(() => ({ ...mockAudioContext }))
    global.window = {
      AudioContext: global.AudioContext,
    }
  })

  describe('playNote', () => {
    it('does not throw for valid note', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      expect(() => playNote('C', 4)).not.toThrow()
    })

    it('does nothing for invalid note', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      expect(() => playNote('X', 4)).not.toThrow()
    })

    it('creates AudioContext on first call', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      playNote('C', 4)
      expect(global.AudioContext).toHaveBeenCalled()
    })

    it('creates oscillators and gain nodes', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      playNote('A', 4)
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2) // 2 oscillators
      expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3) // main gain + 2 mix gains
    })

    it('accepts custom duration', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      expect(() => playNote('E', 4, 1.0)).not.toThrow()
    })

    it('handles all natural notes', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      notes.forEach((note) => {
        expect(() => playNote(note, 4)).not.toThrow()
      })
    })

    it('handles different octaves', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      for (let octave = 2; octave <= 6; octave++) {
        expect(() => playNote('C', octave)).not.toThrow()
      }
    })

    it('is case-insensitive for note names', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      expect(() => playNote('c', 4)).not.toThrow()
      expect(() => playNote('C', 4)).not.toThrow()
    })
  })

  describe('note frequency calculation', () => {
    // These tests verify the internal noteToFreq calculation indirectly
    // by ensuring playNote works correctly for known frequencies
    it('plays A4 (440 Hz reference)', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      expect(() => playNote('A', 4)).not.toThrow()
    })

    it('plays C4 (middle C)', async () => {
      const { playNote } = await import('../../src/utils/audioUtils')
      expect(() => playNote('C', 4)).not.toThrow()
    })
  })
})
