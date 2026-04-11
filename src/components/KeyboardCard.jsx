import React from 'react'
import PianoKeyboard from './PianoKeyboard'

export default function KeyboardCard({ onAnswer, pianoFeedback, clef, micActive, micError, toggleMic, lastHeardNote, micMode, setMicMode }) {
  const pianoOctaves    = clef === 'bass' ? [2, 3] : [4, 5]
  const correctPianoKey = pianoFeedback?.isCorrect ? { note: pianoFeedback.note } : null
  const incorrectPianoKey = pianoFeedback && !pianoFeedback.isCorrect ? { note: pianoFeedback.note } : null

  return (
    <div className="card keyboard-card">
      <div className="keyboard-card-header">
        <h2 className="card-label">Click a key · press A–G · or play your piano</h2>
        <div className="mic-controls">
          <select
            className="mic-mode-select"
            aria-label="Microphone sensitivity"
            value={micMode}
            onChange={(e) => setMicMode(e.target.value)}
            disabled={micActive}
            title={micActive ? 'Stop microphone to change sensitivity' : 'Microphone sensitivity profile'}
          >
            <option value="strict">Strict</option>
            <option value="normal">Normal</option>
            <option value="piano">Piano</option>
          </select>
          <button
            className={`mic-btn${micActive ? ' mic-btn-active' : ''}`}
            aria-pressed={micActive}
            onClick={toggleMic}
            title={micActive ? 'Stop microphone' : 'Use microphone / real piano'}
          >
            <span aria-hidden="true">🎙️ </span>{micActive ? 'Listening…' : 'Use Mic'}
          </button>
        </div>
      </div>
      {micError && <div className="mic-error" role="alert">{micError}</div>}
      {micActive && lastHeardNote && (
        <div className="mic-debug" role="status" aria-live="polite" style={{
          padding: '8px 12px',
          background: '#f0f7ff',
          border: '1px solid #4a90e2',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '14px',
          color: '#333'
        }}>
          <span aria-hidden="true">🎵 </span>Hearing: <strong>{lastHeardNote.note}</strong> ({lastHeardNote.freq.toFixed(1)} Hz)
        </div>
      )}
      <PianoKeyboard
        onKeyPress={onAnswer}
        correctKey={correctPianoKey}
        incorrectKey={incorrectPianoKey}
        disabled={false}
        octaves={pianoOctaves}
      />
    </div>
  )
}
