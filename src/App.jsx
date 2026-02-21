import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import './App.css'
import StaffDisplay from './components/StaffDisplay'
import PianoKeyboard from './components/PianoKeyboard'
import ScoreBoard from './components/ScoreBoard'
import HistoryPanel from './components/HistoryPanel'
import { generateSong, checkAnswer } from './utils/noteUtils'
import { saveRecord, loadRecords, formatTime } from './utils/recordUtils'
import { playNote } from './utils/audioUtils'
import SongPicker from './components/SongPicker'
import { SONGS_BY_CLEF } from './data/songs'

export default function App() {
  const [song, setSong] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedSong, setSelectedSong] = useState(null)  // null = random
  const [results, setResults] = useState([])
  const [hasWrongAttempt, setHasWrongAttempt] = useState(false)
  const [songComplete, setSongComplete] = useState(false)
  const [pianoFeedback, setPianoFeedback] = useState(null) // { note, isCorrect }
  const [feedbackMsg, setFeedbackMsg] = useState(null)     // { text, type }

  // Timer
  const [startTime, setStartTime] = useState(null)   // Date.now() when song began
  const [elapsedMs, setElapsedMs] = useState(0)       // live-updated ms
  const [finalMs, setFinalMs] = useState(null)        // locked in on complete
  const timerRef = useRef(null)

  // Records
  const [records, setRecords] = useState(() => loadRecords())

  // Session stats (persist across songs)
  const [sessionScore, setSessionScore] = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)

  // Clef selection
  const [clef, setClef] = useState('treble')

  const startNewSong = useCallback((clefOverride, forcedNotes) => {
    const c = clefOverride ?? clef
    // forcedNotes=undefined  → use selectedSong if set, else random
    // forcedNotes=null       → force random (ignore selectedSong)
    // forcedNotes=array      → use that exact array
    const notes =
      forcedNotes !== undefined
        ? (forcedNotes ?? generateSong(8, c))
        : (selectedSong ? selectedSong.notes : generateSong(8, c))
    setSong(notes)
    setCurrentIndex(0)
    setResults(Array(notes.length).fill(null))
    setHasWrongAttempt(false)
    setSongComplete(false)
    setPianoFeedback(null)
    setFeedbackMsg(null)
    // Reset timer — will start on first answer
    clearInterval(timerRef.current)
    setStartTime(null)
    setElapsedMs(0)
    setFinalMs(null)
  }, [clef, selectedSong])
  useEffect(() => () => clearInterval(timerRef.current), [])

  // Generate first song on mount
  useEffect(() => {
    startNewSong()
  }, [])

  const handleAnswer = useCallback(
    (noteName) => {
      if (songComplete || !song.length) return
      if (currentIndex >= song.length) return

      const target = song[currentIndex]

      // Play the note the user pressed (at the target's octave so it's in range)
      playNote(noteName, target.octave)
      const isCorrect = checkAnswer(target, noteName)

      // Start timer on first answer
      let t0 = startTime
      if (t0 === null) {
        t0 = Date.now()
        setStartTime(t0)
        timerRef.current = setInterval(() => setElapsedMs(Date.now() - t0), 100)
      }

      if (isCorrect) {
        // ✅ Correct — mark and advance immediately
        const newResults = [...results]
        newResults[currentIndex] = 'correct'
        setResults(newResults)
        setFeedbackMsg(null)
        setPianoFeedback(null)

        setSessionTotal((t) => t + 1)
        if (!hasWrongAttempt) {
          setSessionScore((s) => s + 1)
          setSessionStreak((st) => st + 1)
        } else {
          setSessionStreak(0)
        }
        setHasWrongAttempt(false)

        const next = currentIndex + 1
        if (next >= song.length) {
          const ms = Date.now() - startTime
          clearInterval(timerRef.current)
          setFinalMs(ms)
          setElapsedMs(ms)
          const finalScore = newResults.filter((r) => r === 'correct').length
          const updated = saveRecord({ elapsedMs: ms, score: finalScore, total: song.length, songLength: song.length, title: selectedSong?.title || 'Random' })
          setRecords(updated)
          setSongComplete(true)
        } else {
          setCurrentIndex(next)
        }
      } else if (!hasWrongAttempt) {
        // ❌ First wrong attempt — flash red, give second chance
        setPianoFeedback({ note: noteName, isCorrect: false })
        setHasWrongAttempt(true)
        setFeedbackMsg({ text: `Not quite — try again!`, type: 'incorrect' })
        setTimeout(() => setPianoFeedback(null), 600)
      } else {
        // ❌❌ Second wrong attempt — mark incorrect and advance immediately
        const newResults = [...results]
        newResults[currentIndex] = 'incorrect'
        setResults(newResults)
        setSessionTotal((t) => t + 1)
        setSessionStreak(0)
        setHasWrongAttempt(false)
        setFeedbackMsg({ text: `The note was ${target.note}`, type: 'incorrect' })
        setPianoFeedback(null)

        const next = currentIndex + 1
        if (next >= song.length) {
          const ms = Date.now() - startTime
          clearInterval(timerRef.current)
          setFinalMs(ms)
          setElapsedMs(ms)
          const finalScore = newResults.filter((r) => r === 'correct').length
          const updated = saveRecord({ elapsedMs: ms, score: finalScore, total: song.length, songLength: song.length, title: selectedSong?.title || 'Random' })
          setRecords(updated)
          setSongComplete(true)
        } else {
          setCurrentIndex(next)
        }
      }
    },
    [songComplete, song, currentIndex, results, hasWrongAttempt, startTime, selectedSong]
  )

  // Keyboard listener: pressing A–G answers the current note
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (key.length === 1 && 'ABCDEFG'.includes(key)) {
        handleAnswer(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleAnswer])

  const handleClefChange = (newClef) => {
    setClef(newClef)
    setSelectedSong(null)
    startNewSong(newClef, null)  // force random for new clef
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

  const pianoOctaves = clef === 'bass' ? [2, 3] : [4, 5]
  const correctPianoKey = pianoFeedback?.isCorrect ? { note: pianoFeedback.note } : null
  const incorrectPianoKey = pianoFeedback && !pianoFeedback.isCorrect ? { note: pianoFeedback.note } : null

  const songCorrectCount = results.filter((r) => r === 'correct').length

  // ─── Windowing: always show 8 notes (2 measures) at a time ───────────────
  const WINDOW = 8
  const windowStart = useMemo(() => {
    if (songComplete) return Math.max(0, song.length - WINDOW)
    return Math.floor(currentIndex / WINDOW) * WINDOW
  }, [songComplete, song.length, currentIndex])

  const windowNotes   = useMemo(() => song.slice(windowStart, windowStart + WINDOW), [song, windowStart])
  const windowResults = useMemo(() => results.slice(windowStart, windowStart + WINDOW), [results, windowStart])
  const windowIndex   = songComplete ? WINDOW : currentIndex - windowStart

  const totalMeasures   = song.length / 4           // 4 quarter-notes per measure
  const firstMeasure    = windowStart / 4 + 1
  const lastMeasure     = firstMeasure + 1
  const multiWindow     = song.length > WINDOW
  const measureLabel    = multiWindow ? ` · Measures ${firstMeasure}–${lastMeasure} of ${totalMeasures}` : ''

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Music Sight Reading</h1>
        <p className="app-subtitle">Read each note left to right — type A–G or click a piano key</p>
        <div className="clef-toggle">
          <button
            className={`clef-btn${clef === 'treble' ? ' clef-btn-active' : ''}`}
            onClick={() => handleClefChange('treble')}
          >
            🎵 Treble
          </button>
          <button
            className={`clef-btn${clef === 'bass' ? ' clef-btn-active' : ''}`}
            onClick={() => handleClefChange('bass')}
          >
            🎶 Bass
          </button>
        </div>
      </header>

      <div className="app-body">
        <main className="app-main">
          <ScoreBoard score={sessionScore} streak={sessionStreak} total={sessionTotal} elapsedMs={elapsedMs} />

          <SongPicker
            songs={SONGS_BY_CLEF[clef]}
            selectedId={selectedSong?.id ?? null}
            onSelect={handleSelectSong}
            onRandom={handleRandomSong}
          />

          <div className="card staff-card">
            <div className="card-label">
              {songComplete
                ? `Complete!${selectedSong ? ` — ${selectedSong.title}` : ''}${measureLabel}`
                : `${selectedSong ? `${selectedSong.title} — ` : ''}Note ${currentIndex + 1} of ${song.length}${measureLabel}`}
            </div>
            <StaffDisplay
              key={windowStart}
              song={windowNotes}
              currentIndex={windowIndex}
              results={windowResults}
              clef={clef}
            />
            {feedbackMsg && (
              <div className={`feedback-message feedback-${feedbackMsg.type}`}>
                {feedbackMsg.text}
              </div>
            )}
          </div>

          {songComplete ? (
            <div className="card song-complete-card">
              <div className="song-complete-title">Song Result</div>
              <div className="song-complete-score">
                <span className="song-complete-num">{songCorrectCount}</span>
                <span className="song-complete-denom">/ {song.length}</span>
              </div>
              <div className="song-complete-time">
                {formatTime(finalMs)}
              </div>
              <div className="song-complete-label">
                {songCorrectCount === song.length
                  ? 'Perfect! 🎵'
                  : `${song.length - songCorrectCount} note${song.length - songCorrectCount > 1 ? 's' : ''} missed`}
              </div>
              <button className="new-song-btn" onClick={startNewSong}>
                New Song
              </button>
            </div>
          ) : (
            <div className="card keyboard-card">
              <div className="card-label">Click a key or press A–G on your keyboard</div>
              <PianoKeyboard
                onKeyPress={(noteName) => handleAnswer(noteName)}
                correctKey={correctPianoKey}
                incorrectKey={incorrectPianoKey}
                disabled={false}
                octaves={pianoOctaves}
              />
            </div>
          )}
        </main>

        <aside className="app-sidebar">
          <HistoryPanel records={records} />
        </aside>
      </div>
    </div>
  )
}
