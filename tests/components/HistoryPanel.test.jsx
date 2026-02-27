import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HistoryPanel from '../../src/components/HistoryPanel'

describe('HistoryPanel', () => {
  const makeRecords = (count) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      date: new Date(2026, 1, 27, 10, i).toISOString(),
      elapsedMs: (i + 1) * 1000,
      score: 8 - (i % 3),
      songLength: 8,
      title: `Song ${i + 1}`,
    }))

  it('renders title', () => {
    render(<HistoryPanel records={[]} />)
    expect(screen.getByText('Past Runs')).toBeInTheDocument()
  })

  it('shows empty message when no records', () => {
    render(<HistoryPanel records={[]} />)
    expect(screen.getByText(/No runs yet/)).toBeInTheDocument()
  })

  it('shows empty message for null records', () => {
    render(<HistoryPanel records={null} />)
    expect(screen.getByText(/No runs yet/)).toBeInTheDocument()
  })

  it('renders records table when records exist', () => {
    const records = makeRecords(3)
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('Song 1')).toBeInTheDocument()
    expect(screen.getByText('Song 2')).toBeInTheDocument()
    expect(screen.getByText('Song 3')).toBeInTheDocument()
  })

  it('shows best time in header', () => {
    const records = makeRecords(3)
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('Best:')).toBeInTheDocument()
    // Best time appears in both header and row, use getAllByText
    const bestTimeElements = screen.getAllByText('01.0s')
    expect(bestTimeElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows crown emoji for best record', () => {
    const records = makeRecords(3)
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('👑')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    const records = makeRecords(1)
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('#')).toBeInTheDocument()
    expect(screen.getByText('Song')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('shows score as fraction', () => {
    const records = [{ id: 1, date: new Date().toISOString(), elapsedMs: 5000, score: 7, songLength: 8, title: 'Test' }]
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('7/8')).toBeInTheDocument()
  })

  it('shows only 8 records initially', () => {
    const records = makeRecords(12)
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('Song 1')).toBeInTheDocument()
    expect(screen.getByText('Song 8')).toBeInTheDocument()
    expect(screen.queryByText('Song 9')).not.toBeInTheDocument()
  })

  it('shows "Show all" button when more than 8 records', () => {
    const records = makeRecords(12)
    render(<HistoryPanel records={records} />)

    expect(screen.getByText('Show all 12')).toBeInTheDocument()
  })

  it('does not show "Show all" button for 8 or fewer records', () => {
    const records = makeRecords(8)
    render(<HistoryPanel records={records} />)

    expect(screen.queryByText(/Show all/)).not.toBeInTheDocument()
  })

  it('expands to show all records when "Show all" is clicked', () => {
    const records = makeRecords(12)
    render(<HistoryPanel records={records} />)

    fireEvent.click(screen.getByText('Show all 12'))

    expect(screen.getByText('Song 9')).toBeInTheDocument()
    expect(screen.getByText('Song 12')).toBeInTheDocument()
  })

  it('shows "Show less" after expanding', () => {
    const records = makeRecords(12)
    render(<HistoryPanel records={records} />)

    fireEvent.click(screen.getByText('Show all 12'))

    expect(screen.getByText('Show less')).toBeInTheDocument()
  })

  it('collapses when "Show less" is clicked', () => {
    const records = makeRecords(12)
    render(<HistoryPanel records={records} />)

    fireEvent.click(screen.getByText('Show all 12'))
    fireEvent.click(screen.getByText('Show less'))

    expect(screen.queryByText('Song 9')).not.toBeInTheDocument()
    expect(screen.getByText('Show all 12')).toBeInTheDocument()
  })
})
