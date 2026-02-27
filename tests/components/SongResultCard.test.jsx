import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SongResultCard from '../../src/components/SongResultCard'

describe('SongResultCard', () => {
  it('renders song result title', () => {
    render(
      <SongResultCard correctCount={6} songLength={8} finalMs={5000} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('Song Result')).toBeInTheDocument()
  })

  it('renders score with correct count', () => {
    render(
      <SongResultCard correctCount={6} songLength={8} finalMs={5000} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('/ 8')).toBeInTheDocument()
  })

  it('renders formatted time', () => {
    render(
      <SongResultCard correctCount={8} songLength={8} finalMs={65200} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('1:05.2')).toBeInTheDocument()
  })

  it('shows "Perfect! 🎵" when all notes correct', () => {
    render(
      <SongResultCard correctCount={8} songLength={8} finalMs={5000} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('Perfect! 🎵')).toBeInTheDocument()
  })

  it('shows missed notes count for single miss', () => {
    render(
      <SongResultCard correctCount={7} songLength={8} finalMs={5000} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('1 note missed')).toBeInTheDocument()
  })

  it('shows missed notes count for multiple misses', () => {
    render(
      <SongResultCard correctCount={5} songLength={8} finalMs={5000} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('3 notes missed')).toBeInTheDocument()
  })

  it('renders New Song button', () => {
    render(
      <SongResultCard correctCount={6} songLength={8} finalMs={5000} onNewSong={vi.fn()} />
    )

    expect(screen.getByText('New Song')).toBeInTheDocument()
  })

  it('calls onNewSong when button is clicked', () => {
    const onNewSong = vi.fn()
    render(
      <SongResultCard correctCount={6} songLength={8} finalMs={5000} onNewSong={onNewSong} />
    )

    fireEvent.click(screen.getByText('New Song'))
    expect(onNewSong).toHaveBeenCalled()
  })
})
