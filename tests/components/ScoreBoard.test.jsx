import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ScoreBoard from '../../src/components/ScoreBoard'

describe('ScoreBoard', () => {
  it('renders score correctly', () => {
    render(<ScoreBoard score={5} streak={2} total={8} elapsedMs={5000} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('/8')).toBeInTheDocument()
  })

  it('renders streak', () => {
    render(<ScoreBoard score={5} streak={3} total={8} elapsedMs={5000} />)

    expect(screen.getByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders accuracy when total > 0', () => {
    render(<ScoreBoard score={6} streak={0} total={8} elapsedMs={5000} />)

    expect(screen.getByText('Accuracy')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('hides accuracy when total is 0', () => {
    render(<ScoreBoard score={0} streak={0} total={0} elapsedMs={0} />)

    expect(screen.queryByText('Accuracy')).not.toBeInTheDocument()
  })

  it('renders formatted time', () => {
    render(<ScoreBoard score={5} streak={2} total={8} elapsedMs={65200} />)

    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('1:05.2')).toBeInTheDocument()
  })

  it('renders all labels', () => {
    render(<ScoreBoard score={5} streak={2} total={8} elapsedMs={5000} />)

    expect(screen.getByText('Score')).toBeInTheDocument()
    expect(screen.getByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
  })
})
