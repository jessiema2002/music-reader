import React, { useState } from 'react'
import './App.css'
import ScoreBoard from './components/ScoreBoard'
import HistoryPanel from './components/HistoryPanel'
import SongPicker from './components/SongPicker'
import StaffCard from './components/StaffCard'
import SongResultCard from './components/SongResultCard'
import KeyboardCard from './components/KeyboardCard'
import { useSongGame } from './hooks/useSongGame'
import { useMic } from './hooks/useMic'
import { loadRecords } from './utils/recordUtils'
import { SONGS_BY_CLEF } from './data/songs'

export default function App() {
  const game = useSongGame()
  const { micActive, micError, toggleMic } = useMic(game.handleAnswer, game.songComplete)
  const [records] = useState(() => loadRecords())

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Music Sight Reading</h1>
        <p className="app-subtitle">Read each note left to right — type A–G or click a piano key</p>
        <div className="clef-toggle">
          <button
            className={`clef-btn${game.clef === 'treble' ? ' clef-btn-active' : ''}`}
            onClick={() => game.handleClefChange('treble')}
          >
            🎵 Treble
          </button>
          <button
            className={`clef-btn${game.clef === 'bass' ? ' clef-btn-active' : ''}`}
            onClick={() => game.handleClefChange('bass')}
          >
            🎶 Bass
          </button>
        </div>
      </header>

      <div className="app-body">
        <main className="app-main">
          <ScoreBoard
            score={game.sessionScore}
            streak={game.sessionStreak}
            total={game.sessionTotal}
            elapsedMs={game.elapsedMs}
          />

          <SongPicker
            songs={SONGS_BY_CLEF[game.clef]}
            selectedId={game.selectedSong?.id ?? null}
            onSelect={game.handleSelectSong}
            onRandom={game.handleRandomSong}
          />

          <StaffCard
            songComplete={game.songComplete}
            selectedSong={game.selectedSong}
            currentIndex={game.currentIndex}
            songLength={game.song.length}
            measureLabel={game.measureLabel}
            feedbackMsg={game.feedbackMsg}
            windowStart={game.windowStart}
            windowNotes={game.windowNotes}
            windowIndex={game.windowIndex}
            windowResults={game.windowResults}
            clef={game.clef}
          />

          {game.songComplete ? (
            <SongResultCard
              correctCount={game.results.filter((r) => r === 'correct').length}
              songLength={game.song.length}
              finalMs={game.finalMs}
              onNewSong={game.startNewSong}
            />
          ) : (
            <KeyboardCard
              onAnswer={game.handleAnswer}
              pianoFeedback={game.pianoFeedback}
              clef={game.clef}
              micActive={micActive}
              micError={micError}
              toggleMic={toggleMic}
            />
          )}
        </main>

        <aside className="app-sidebar">
          <HistoryPanel records={records} />
        </aside>
      </div>
    </div>
  )
}

