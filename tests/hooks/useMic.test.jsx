import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMic } from '../../src/hooks/useMic'

// Mock the micUtils module
vi.mock('../../src/utils/micUtils', () => ({
  startMicListening: vi.fn(),
  stopMicListening: vi.fn(),
}))

import { startMicListening, stopMicListening } from '../../src/utils/micUtils'

describe('useMic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    startMicListening.mockResolvedValue(null) // success by default
  })

  it('initializes with mic inactive', () => {
    const { result } = renderHook(() => useMic(vi.fn(), false))

    expect(result.current.micActive).toBe(false)
    expect(result.current.micError).toBeNull()
    expect(result.current.lastHeardNote).toBeNull()
    expect(result.current.micMode).toBe('normal')
  })

  it('starts mic on toggleMic when inactive', async () => {
    const onNote = vi.fn()
    const { result } = renderHook(() => useMic(onNote, false))

    await act(async () => {
      await result.current.toggleMic()
    })

    expect(startMicListening).toHaveBeenCalled()
    expect(result.current.micActive).toBe(true)
  })

  it('stops mic on toggleMic when active', async () => {
    const { result } = renderHook(() => useMic(vi.fn(), false))

    // Start mic
    await act(async () => {
      await result.current.toggleMic()
    })

    // Stop mic
    await act(async () => {
      await result.current.toggleMic()
    })

    expect(stopMicListening).toHaveBeenCalled()
    expect(result.current.micActive).toBe(false)
  })

  it('sets error when startMicListening fails', async () => {
    startMicListening.mockResolvedValue('Microphone access denied')

    const { result } = renderHook(() => useMic(vi.fn(), false))

    await act(async () => {
      await result.current.toggleMic()
    })

    expect(result.current.micError).toBe('Microphone access denied')
    expect(result.current.micActive).toBe(false)
  })

  it('clears error when mic is stopped', async () => {
    startMicListening.mockResolvedValueOnce('Error').mockResolvedValueOnce(null)

    const { result } = renderHook(() => useMic(vi.fn(), false))

    // First attempt fails
    await act(async () => {
      await result.current.toggleMic()
    })
    expect(result.current.micError).toBe('Error')

    // Second attempt (now it succeeds)
    await act(async () => {
      await result.current.toggleMic()
    })
    expect(result.current.micError).toBeNull()
  })

  it('stops mic when song completes', async () => {
    const { result, rerender } = renderHook(
      ({ songComplete }) => useMic(vi.fn(), songComplete),
      { initialProps: { songComplete: false } }
    )

    // Start mic
    await act(async () => {
      await result.current.toggleMic()
    })
    expect(result.current.micActive).toBe(true)

    // Song completes
    rerender({ songComplete: true })

    expect(stopMicListening).toHaveBeenCalled()
    expect(result.current.micActive).toBe(false)
  })

  it('allows changing mic mode', () => {
    const { result } = renderHook(() => useMic(vi.fn(), false))

    act(() => {
      result.current.setMicMode('piano')
    })

    expect(result.current.micMode).toBe('piano')
  })

  it('passes mode to startMicListening', async () => {
    const { result } = renderHook(() => useMic(vi.fn(), false))

    act(() => {
      result.current.setMicMode('piano')
    })

    await act(async () => {
      await result.current.toggleMic()
    })

    expect(startMicListening).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { mode: 'piano' }
    )
  })

  it('calls onNote when note is detected', async () => {
    const onNote = vi.fn()
    let capturedOnNote

    startMicListening.mockImplementation((noteCallback) => {
      capturedOnNote = noteCallback
      return Promise.resolve(null)
    })

    const { result } = renderHook(() => useMic(onNote, false))

    await act(async () => {
      await result.current.toggleMic()
    })

    // Simulate note detection
    act(() => {
      capturedOnNote('C', 4)
    })

    expect(onNote).toHaveBeenCalledWith('C', 4)
  })

  it('updates lastHeardNote when note is heard', async () => {
    let capturedOnHeard

    startMicListening.mockImplementation((_, heardCallback) => {
      capturedOnHeard = heardCallback
      return Promise.resolve(null)
    })

    const { result } = renderHook(() => useMic(vi.fn(), false))

    await act(async () => {
      await result.current.toggleMic()
    })

    // Simulate hearing a note
    act(() => {
      capturedOnHeard('E', 329.63)
    })

    expect(result.current.lastHeardNote).toEqual({ note: 'E', freq: 329.63 })
  })

  it('clears lastHeardNote when mic is stopped', async () => {
    let capturedOnHeard

    startMicListening.mockImplementation((_, heardCallback) => {
      capturedOnHeard = heardCallback
      return Promise.resolve(null)
    })

    const { result } = renderHook(() => useMic(vi.fn(), false))

    await act(async () => {
      await result.current.toggleMic()
    })

    // Simulate hearing a note
    act(() => {
      capturedOnHeard('E', 329.63)
    })
    expect(result.current.lastHeardNote).not.toBeNull()

    // Stop mic
    await act(async () => {
      await result.current.toggleMic()
    })

    expect(result.current.lastHeardNote).toBeNull()
  })

  it('cleans up on unmount', () => {
    const { unmount } = renderHook(() => useMic(vi.fn(), false))

    unmount()

    expect(stopMicListening).toHaveBeenCalled()
  })
})
