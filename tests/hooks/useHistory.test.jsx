import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHistory } from '../../src/hooks/useHistory'
import * as recordUtils from '../../src/utils/recordUtils'

vi.mock('../../src/utils/recordUtils', () => ({
  loadRecords: vi.fn(),
  saveRecord: vi.fn(),
}))

describe('useHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with records from storage', () => {
    const mockRecords = [{ id: 1, title: 'Test' }]
    vi.mocked(recordUtils.loadRecords).mockReturnValue(mockRecords)

    const { result } = renderHook(() => useHistory())
    expect(result.current.records).toEqual(mockRecords)
  })

  it('updates state when a record is added', () => {
    vi.mocked(recordUtils.loadRecords).mockReturnValue([])
    const newRecord = { id: 2, title: 'New' }
    vi.mocked(recordUtils.saveRecord).mockReturnValue([newRecord])

    const { result } = renderHook(() => useHistory())

    act(() => {
      result.current.addRecord({ title: 'New' })
    })

    expect(recordUtils.saveRecord).toHaveBeenCalled()
    expect(result.current.records).toEqual([newRecord])
  })
})
