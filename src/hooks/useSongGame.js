import { useState, useRef, useCallback, useEffect } from 'react'
import { generateSong, checkAnswer } from '../utils/noteUtils'
import { playNote } from '../utils/audioUtils'

const WINDOW = 8

/**
 * Encapsulates all song-game state and logic.
 * Returns everything App needs to render and respond to user input.
 * @param {(record: object) => void} onSongComplete  optional callback to save history
 */
export function useSongGame(onSongComplete) {
  // ─── Song / answer state ──────────────────────────────────────────────────
  const [song, setSong] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedSong, setSelectedSong] = useState(null)
  const [results, setResults] = useState([])
  const [hasWrongAttempt, setHasWrongAttempt] = useState(false)
  const [songComplete, setSongComplete] = useState(false)
  const [pianoFeedback, setPianoFeedback] = useState(null)
  const [feedbackMsg, setFeedbackMsg] = useState(null)

  // ─── Timer ────────────────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finalMs, setFinalMs] = useState(null)
  const timerRef = useRef(null)

  // ─── Session stats ────────────────────────────────────────────────────────
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)

  // ─── Clef ─────────────────────────────────────────────────────────────────
  const [clef, setClef] = useState('treble')

  // Cleanup timer on unmount
  useEffect(() => () => clearInterval(timerRef.current), [])

  // Start a random song on initial mount
  useEffect(() => {
    setSong(generateSong(WINDOW, 'treble'))
    setResults(Array(WINDOW).fill(null))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Start a new song ─────────────────────────────────────────────────────
  const startNewSong = useCallback((clefOverride, forcedNotes) => {
    const c = clefOverride ?? clef
    const notes =
      forcedNotes !== undefined
        ? (forcedNotes ?? generateSong(WINDOW, c))
        : (selectedSong ? selectedSong.notes : generateSong(WINDOW, c))
    setSong(notes)
    setCurrentIndex(0)
    setResults(Array(notes.length).fill(null))
    setHasWrongAttempt(false)
    setSongComplete(false)
    setPianoFeedback(null)
    setFeedbackMsg(null)
    clearInterval(timerRef.current)
    setStartTime(null)
    setElapsedMs(0)
    setFinalMs(null)
  }, [clef, selectedSong])

  // ─── Handle an answer ─────────────────────────────────────────────────────
  const handleAnswer = useCallback((noteName) => {
    if (songComplete || !song.length || currentIndex >= song.length) return

    const target = song[currentIndex]
    playNote(noteName, target.octave)
    const isCorrect = checkAnswer(target, noteName)

    // Start timer on first answer
    let t0 = startTime
    if (t0 === null) {
      t0 = Date.now()
      setStartTime(t0)
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - t0), 100)
    }

    const finishSong = (newResults) => {
      const ms = Date.now() - t0
      clearInterval(timerRef.current)
      setFinalMs(ms)
      setElapsedMs(ms)
      const score = newResults.filter((r) => r === 'correct').length
      
      onSongComplete?.({
        elapsedMs: ms,
        score,
        total: song.length,
        songLength: song.length,
        title: selectedSong?.title || 'Random'
      })

      setSongComplete(true)
      return score
    }

    if (isCorrect) {
      const newResults = [...results]
      newResults[currentIndex] = 'correct'
      setResults(newResults)
      setFeedbackMsg(null)
      setPianoFeedback(null)
      setSessionTotal((v) => v + 1)
      if (!hasWrongAttempt) {
        setSessionScore((v) => v + 1)
        setSessionStreak((v) => v + 1)
      } else {
        setSessionStreak(0)
      }
      setHasWrongAttempt(false)

      const next = currentIndex + 1
      if (next >= song.length) finishSong(newResults)
      else setCurrentIndex(next)

    } else if (!hasWrongAttempt) {
      setPianoFeedback({ note: noteName, isCorrect: false })
      setHasWrongAttempt(true)
      setFeedbackMsg({ text: 'Not quite — try again!', type: 'incorrect' })
      setTimeout(() => setPianoFeedback(v => v?.note === noteName ? null : v), 600)

    } else {
      const newResults = [...results]
      newResults[currentIndex] = 'incorrect'
      setResults(newResults)
      setSessionTotal((v) => v + 1)
      setSessionStreak(0)
      setHasWrongAttempt(false)
      setFeedbackMsg({ text: `The note was ${target.note}`, type: 'incorrect' })
      setPianoFeedback(null)

      const next = currentIndex + 1
      if (next >= song.length) finishSong(newResults)
      else setCurrentIndex(next)
    }
  }, [songComplete, song, currentIndex, results, hasWrongAttempt, startTime, selectedSong, onSongComplete])

  // ─── Keyboard listener ────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (key.length === 1 && 'ABCDEFG'.includes(key)) handleAnswer(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleAnswer])

  // ─── Clef / song selection handlers ──────────────────────────────────────
  const handleClefChange = (newClef) => {
    setClef(newClef)
    setSelectedSong(null)
    startNewSong(newClef, null)
  }

  const handleSelectSong = (s) => {
    setSelectedSong(s)
    if (s.clef !== clef) setClef(s.clef)
    startNewSong(s.clef, s.notes)
  }

  const handleRandomSong = () => {
    setSelectedSong(null)
    startNewSong(clef, null)
  }

  // ─── Windowing ────────────────────────────────────────────────────────────
  const windowStart = songComplete
    ? Math.max(0, song.length - WINDOW)
    : Math.floor(currentIndex / WINDOW) * WINDOW

  const windowNotes   = song.slice(windowStart, windowStart + WINDOW)
  const windowResults = results.slice(windowStart, windowStart + WINDOW)
  const windowIndex   = songComplete ? WINDOW : currentIndex - windowStart

  const totalMeasures = song.length / 4
  const firstMeasure  = windowStart / 4 + 1
  const measureLabel  = song.length > WINDOW
    ? ` · Measures ${firstMeasure}–${firstMeasure + 1} of ${totalMeasures}`
    : ''

  return {
    // State
    song, clef, currentIndex, results, songComplete,
    selectedSong, feedbackMsg, pianoFeedback,
    elapsedMs, finalMs,
    sessionScore, sessionStreak, sessionTotal,
    // Windowed view
    windowStart, windowNotes, windowResults, windowIndex, measureLabel,
    // Actions
    startNewSong, handleAnswer,
    handleClefChange, handleSelectSong, handleRandomSong,
  }
}
