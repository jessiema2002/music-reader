import { useState, useEffect, useCallback, useRef } from 'react'
import { startMicListening, stopMicListening } from '../utils/micUtils'

/**
 * Manages microphone listening state.
 * @param {(noteName: string) => void} onNote  forwarded to handleAnswer
 * @param {boolean} songComplete  stops mic automatically when song finishes
 */
export function useMic(onNote, songComplete) {
  const [micActive, setMicActive] = useState(false)
  const [micError, setMicError] = useState(null)
  const [lastHeardNote, setLastHeardNote] = useState(null)
  const [micMode, setMicMode] = useState('normal')

  // Always keep a ref to the latest onNote so the mic loop never holds a stale closure
  const onNoteRef = useRef(onNote)
  onNoteRef.current = onNote

  const toggleMic = useCallback(async () => {
    if (micActive) {
      stopMicListening()
      setMicActive(false)
      setMicError(null)
      setLastHeardNote(null)
    } else {
      // Stable wrapper — delegates to whatever onNote is current at call time
      const err = await startMicListening(
        (noteName, octave) => onNoteRef.current(noteName, octave),
        (noteName, freq) => setLastHeardNote({ note: noteName, freq }),
        { mode: micMode }
      )
      if (err) {
        setMicError(err)
      } else {
        setMicActive(true)
        setMicError(null)
      }
    }
  }, [micActive, micMode])

  // Stop when song ends
  useEffect(() => {
    if (songComplete && micActive) {
      stopMicListening()
      setMicActive(false)
    }
  }, [songComplete])

  // Cleanup on unmount
  useEffect(() => () => stopMicListening(), [])

  return { micActive, micError, toggleMic, lastHeardNote, micMode, setMicMode }
}
