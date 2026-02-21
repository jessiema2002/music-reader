import { useState, useEffect, useCallback } from 'react'
import { startMicListening, stopMicListening } from '../utils/micUtils'

/**
 * Manages microphone listening state.
 * @param {(noteName: string) => void} onNote  forwarded to handleAnswer
 * @param {boolean} songComplete  stops mic automatically when song finishes
 */
export function useMic(onNote, songComplete) {
  const [micActive, setMicActive] = useState(false)
  const [micError, setMicError] = useState(null)

  const toggleMic = useCallback(async () => {
    if (micActive) {
      stopMicListening()
      setMicActive(false)
      setMicError(null)
    } else {
      const err = await startMicListening(onNote)
      if (err) {
        setMicError(err)
      } else {
        setMicActive(true)
        setMicError(null)
      }
    }
  }, [micActive, onNote])

  // Stop when song ends
  useEffect(() => {
    if (songComplete && micActive) {
      stopMicListening()
      setMicActive(false)
    }
  }, [songComplete])

  // Cleanup on unmount
  useEffect(() => () => stopMicListening(), [])

  return { micActive, micError, toggleMic }
}
