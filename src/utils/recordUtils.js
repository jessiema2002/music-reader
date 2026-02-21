const STORAGE_KEY = 'music-reader-records'
const MAX_RECORDS = 50

/**
 * Load all records from localStorage.
 * @returns {object[]}
 */
export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Save a new record. Keeps the most recent MAX_RECORDS entries.
 * @param {{ elapsedMs: number, score: number, total: number, songLength: number, title?: string }} record
 * @returns {object[]} updated records array
 */
export function saveRecord({ elapsedMs, score, total, songLength, title }) {
  const records = loadRecords()
  const entry = {
    id: Date.now(),
    date: new Date().toISOString(),
    elapsedMs,
    score,
    total,
    songLength,
    title: title || 'Random',
  }
  const updated = [entry, ...records].slice(0, MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // storage full — ignore
  }
  return updated
}

/**
 * Formats milliseconds as "m:ss.t" (e.g. "1:04.3")
 * @param {number} ms
 * @returns {string}
 */
export function formatTime(ms) {
  if (ms == null || isNaN(ms)) return '--'
  const totalSeconds = ms / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = (totalSeconds % 60).toFixed(1).padStart(4, '0')
  return minutes > 0 ? `${minutes}:${seconds}` : `${seconds}s`
}
