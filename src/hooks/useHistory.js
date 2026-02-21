import { useState, useCallback } from 'react'
import { loadRecords, saveRecord } from '../utils/recordUtils'

/**
 * Manages the persistent history of song runs.
 * Syncs localStorage with React state so the UI updates immediately.
 */
export function useHistory() {
  const [records, setRecords] = useState(() => loadRecords())

  const addRecord = useCallback((data) => {
    const updated = saveRecord(data)
    setRecords(updated)
  }, [])

  return { records, addRecord }
}
