import { describe, it, expect } from 'vitest'
import { freqToNote, getRms, MIC_PRESETS } from '../../src/utils/micUtils'

describe('micUtils', () => {
  describe('freqToNote', () => {
    const DEFAULT_SNAP_TOLERANCE = 0.45

    it('detects A4 (440 Hz) correctly', () => {
      const result = freqToNote(440, DEFAULT_SNAP_TOLERANCE)
      expect(result).toEqual({ name: 'A', octave: 4 })
    })

    it('detects C4 (261.63 Hz) correctly', () => {
      const result = freqToNote(261.63, DEFAULT_SNAP_TOLERANCE)
      expect(result).toEqual({ name: 'C', octave: 4 })
    })

    it('detects middle C (C4) at slightly off frequency', () => {
      // C4 is 261.63 Hz, test at 260 Hz (slightly flat)
      const result = freqToNote(260, DEFAULT_SNAP_TOLERANCE)
      expect(result).toEqual({ name: 'C', octave: 4 })
    })

    it('detects G4 (392 Hz) correctly', () => {
      const result = freqToNote(392, DEFAULT_SNAP_TOLERANCE)
      expect(result).toEqual({ name: 'G', octave: 4 })
    })

    // Critical fix: real piano overtones detected as nearby accidentals
    // should snap to nearest natural note when within tolerance
    describe('snaps frequencies to nearest natural note', () => {
      it('rejects C# (277.18 Hz) - too far from C or D', () => {
        // C# is 277.18 Hz, exactly between C (261.63) and D (293.66)
        // C# is 1 semitone from C and 1 semitone from D
        // With tolerance 0.5, C# should be rejected (no natural within tolerance)
        const result = freqToNote(277.18, 0.5)
        expect(result).toBeNull()
      })

      it('snaps slightly sharp C to C', () => {
        // C4 = 261.63 Hz, test at 265 Hz (slightly sharp but still within tolerance)
        const result = freqToNote(265, 0.45)
        expect(result?.name).toBe('C')
      })

      it('snaps slightly flat D to D', () => {
        // D4 = 293.66 Hz, test at 291 Hz (slightly flat)
        const result = freqToNote(291, 0.45)
        expect(result?.name).toBe('D')
      })

      it('rejects note when too far from any natural', () => {
        // With very strict tolerance, some frequencies should be rejected
        const result = freqToNote(277.18, 0.1) // C# with strict tolerance
        expect(result).toBeNull()
      })
    })

    // Edge cases
    describe('edge cases', () => {
      it('returns null for frequency below audible range', () => {
        expect(freqToNote(20, DEFAULT_SNAP_TOLERANCE)).toBeNull()
      })

      it('returns null for frequency above piano range', () => {
        expect(freqToNote(5000, DEFAULT_SNAP_TOLERANCE)).toBeNull()
      })

      it('handles lowest piano note A0 (27.5 Hz)', () => {
        const result = freqToNote(27.5, DEFAULT_SNAP_TOLERANCE)
        expect(result).toEqual({ name: 'A', octave: 0 })
      })

      it('handles C5 (523.25 Hz)', () => {
        const result = freqToNote(523.25, DEFAULT_SNAP_TOLERANCE)
        expect(result).toEqual({ name: 'C', octave: 5 })
      })
    })

    // Different octaves
    describe('different octaves', () => {
      it('distinguishes C4 from C5', () => {
        const c4 = freqToNote(261.63, DEFAULT_SNAP_TOLERANCE)
        const c5 = freqToNote(523.25, DEFAULT_SNAP_TOLERANCE)
        expect(c4?.octave).toBe(4)
        expect(c5?.octave).toBe(5)
      })

      it('detects bass clef notes correctly (G2)', () => {
        const result = freqToNote(98, DEFAULT_SNAP_TOLERANCE) // G2 ≈ 98 Hz
        expect(result).toEqual({ name: 'G', octave: 2 })
      })
    })
  })

  describe('getRms', () => {
    it('returns 0 for silent buffer', () => {
      const silent = new Float32Array(1024).fill(0)
      expect(getRms(silent)).toBe(0)
    })

    it('returns correct RMS for constant signal', () => {
      const constant = new Float32Array(1024).fill(0.5)
      expect(getRms(constant)).toBeCloseTo(0.5, 5)
    })

    it('returns correct RMS for sine wave', () => {
      const samples = new Float32Array(1024)
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.sin((2 * Math.PI * i) / 128) // Sine wave
      }
      // RMS of a sine wave is amplitude / sqrt(2) ≈ 0.707
      expect(getRms(samples)).toBeCloseTo(1 / Math.sqrt(2), 2)
    })

    it('returns lower RMS for quieter signal', () => {
      const loud = new Float32Array(1024)
      const quiet = new Float32Array(1024)
      for (let i = 0; i < 1024; i++) {
        loud[i] = Math.sin((2 * Math.PI * i) / 128)
        quiet[i] = Math.sin((2 * Math.PI * i) / 128) * 0.1
      }
      expect(getRms(quiet)).toBeLessThan(getRms(loud))
    })
  })

  describe('MIC_PRESETS', () => {
    it('has three modes: strict, normal, piano', () => {
      expect(MIC_PRESETS).toHaveProperty('strict')
      expect(MIC_PRESETS).toHaveProperty('normal')
      expect(MIC_PRESETS).toHaveProperty('piano')
    })

    // Critical fix: RMS thresholds were too high for real piano
    describe('RMS thresholds for real piano detection', () => {
      it('normal mode has RMS threshold low enough for acoustic piano', () => {
        // Real piano through air→mic is much quieter than phone speaker
        // Threshold should be ~0.006 or lower
        expect(MIC_PRESETS.normal.rmsThreshold).toBeLessThanOrEqual(0.01)
      })

      it('piano mode has the lowest RMS threshold', () => {
        expect(MIC_PRESETS.piano.rmsThreshold).toBeLessThan(MIC_PRESETS.normal.rmsThreshold)
        expect(MIC_PRESETS.piano.rmsThreshold).toBeLessThan(MIC_PRESETS.strict.rmsThreshold)
      })

      it('piano mode RMS threshold is suitable for quiet acoustic piano', () => {
        // Should be ~0.004 or lower for distant/quiet piano
        expect(MIC_PRESETS.piano.rmsThreshold).toBeLessThanOrEqual(0.005)
      })
    })

    // Critical fix: FFT size affects frequency resolution
    describe('FFT size for frequency resolution', () => {
      it('normal and piano modes use larger FFT for better low-note resolution', () => {
        // 8192 samples at 44.1kHz = ~5.4 Hz resolution
        // 4096 samples = ~10.8 Hz resolution (marginal for low notes)
        expect(MIC_PRESETS.normal.fftSize).toBeGreaterThanOrEqual(8192)
        expect(MIC_PRESETS.piano.fftSize).toBeGreaterThanOrEqual(8192)
      })
    })

    // Critical fix: bandpass filter settings
    describe('bandpass filter configuration', () => {
      it('has high-pass filter to remove room rumble', () => {
        expect(MIC_PRESETS.normal.filterLow).toBeGreaterThan(0)
        expect(MIC_PRESETS.normal.filterLow).toBeLessThan(100)
      })

      it('has low-pass filter to tame overtones', () => {
        // Piano fundamentals go up to ~4186 Hz (C8), but we want to filter
        // strong upper harmonics. 2000-2500 Hz is reasonable.
        expect(MIC_PRESETS.normal.filterHigh).toBeGreaterThan(1500)
        expect(MIC_PRESETS.normal.filterHigh).toBeLessThan(4000)
      })

      it('piano mode has widest frequency range', () => {
        expect(MIC_PRESETS.piano.filterLow).toBeLessThanOrEqual(MIC_PRESETS.normal.filterLow)
      })
    })

    // YIN threshold affects sensitivity
    describe('YIN threshold settings', () => {
      it('piano mode is most permissive (highest threshold)', () => {
        // Higher threshold = more permissive = more detections
        expect(MIC_PRESETS.piano.yinThreshold).toBeGreaterThanOrEqual(MIC_PRESETS.normal.yinThreshold)
      })

      it('strict mode is most strict (lowest threshold)', () => {
        expect(MIC_PRESETS.strict.yinThreshold).toBeLessThanOrEqual(MIC_PRESETS.normal.yinThreshold)
      })
    })

    // Snap tolerance for accidental→natural conversion
    describe('snap tolerance settings', () => {
      it('piano mode has widest snap tolerance for overtone drift', () => {
        expect(MIC_PRESETS.piano.snapTolerance).toBeGreaterThanOrEqual(MIC_PRESETS.normal.snapTolerance)
      })

      it('all modes have reasonable snap tolerance (0.3-0.6 semitones)', () => {
        Object.values(MIC_PRESETS).forEach(preset => {
          expect(preset.snapTolerance).toBeGreaterThan(0.25)
          expect(preset.snapTolerance).toBeLessThan(0.7)
        })
      })
    })
  })
})
