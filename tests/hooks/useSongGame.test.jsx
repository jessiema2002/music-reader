import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSongGame } from '../../src/hooks/useSongGame'

vi.mock('../../src/utils/audioUtils', () => ({
  playNote: vi.fn(),
}))

describe('useSongGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('starts with a random song of length 8', () => {
    const { result } = renderHook(() => useSongGame())
    expect(result.current.song).toHaveLength(8)
    expect(result.current.currentIndex).toBe(0)
  })

  it('advances current index on correct answer', () => {
    const { result } = renderHook(() => useSongGame())
    const firstNote = result.current.song[0].note

    act(() => {
      result.current.handleAnswer(firstNote)
    })

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.results[0]).toBe('correct')
  })
})
