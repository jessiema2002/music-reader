import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SongPicker from '../../src/components/SongPicker'

describe('SongPicker', () => {
  const mockSongs = [
    { id: 'twinkle', title: 'Twinkle Twinkle' },
    { id: 'mary', title: 'Mary Had a Little Lamb' },
    { id: 'ode', title: 'Ode to Joy' },
  ]

  it('renders Random button', () => {
    render(
      <SongPicker songs={mockSongs} selectedId={null} onSelect={vi.fn()} onRandom={vi.fn()} />
    )

    expect(screen.getByText('🎲 Random')).toBeInTheDocument()
  })

  it('renders all songs', () => {
    render(
      <SongPicker songs={mockSongs} selectedId={null} onSelect={vi.fn()} onRandom={vi.fn()} />
    )

    expect(screen.getByText('Twinkle Twinkle')).toBeInTheDocument()
    expect(screen.getByText('Mary Had a Little Lamb')).toBeInTheDocument()
    expect(screen.getByText('Ode to Joy')).toBeInTheDocument()
  })

  it('calls onRandom when Random button is clicked', () => {
    const onRandom = vi.fn()
    render(
      <SongPicker songs={mockSongs} selectedId={null} onSelect={vi.fn()} onRandom={onRandom} />
    )

    fireEvent.click(screen.getByText('🎲 Random'))
    expect(onRandom).toHaveBeenCalled()
  })

  it('calls onSelect when a song is clicked', () => {
    const onSelect = vi.fn()
    render(
      <SongPicker songs={mockSongs} selectedId={null} onSelect={onSelect} onRandom={vi.fn()} />
    )

    fireEvent.click(screen.getByText('Twinkle Twinkle'))
    expect(onSelect).toHaveBeenCalledWith(mockSongs[0])
  })

  it('highlights Random button when selectedId is null', () => {
    render(
      <SongPicker songs={mockSongs} selectedId={null} onSelect={vi.fn()} onRandom={vi.fn()} />
    )

    const randomBtn = screen.getByText('🎲 Random')
    expect(randomBtn).toHaveClass('song-btn-active')
  })

  it('highlights selected song', () => {
    render(
      <SongPicker songs={mockSongs} selectedId="mary" onSelect={vi.fn()} onRandom={vi.fn()} />
    )

    const maryBtn = screen.getByText('Mary Had a Little Lamb')
    expect(maryBtn).toHaveClass('song-btn-active')
  })

  it('does not highlight Random when a song is selected', () => {
    render(
      <SongPicker songs={mockSongs} selectedId="mary" onSelect={vi.fn()} onRandom={vi.fn()} />
    )

    const randomBtn = screen.getByText('🎲 Random')
    expect(randomBtn).not.toHaveClass('song-btn-active')
  })

  it('has title attribute for song buttons', () => {
    render(
      <SongPicker songs={mockSongs} selectedId={null} onSelect={vi.fn()} onRandom={vi.fn()} />
    )

    const twinkleBtn = screen.getByText('Twinkle Twinkle')
    expect(twinkleBtn).toHaveAttribute('title', 'Twinkle Twinkle')
  })
})
