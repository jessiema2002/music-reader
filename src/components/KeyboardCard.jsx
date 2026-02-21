import React from 'react'
import PianoKeyboard from './PianoKeyboard'

export default function KeyboardCard({ onAnswer, pianoFeedback, clef, micActive, micError, toggleMic }) {
  const pianoOctaves    = clef === 'bass' ? [2, 3] : [4, 5]
  const correctPianoKey = pianoFeedback?.isCorrect ? { note: pianoFeedback.note } : null
  const incorrectPianoKey = pianoFeedback && !pianoFeedback.isCorrect ? { note: pianoFeedback.note } : null

  return (
    <div className="card keyboard-card">
      <div className="keyboard-card-header">
        <span className="card-label">Click a key · press A–G · or play your piano</span>
        <button
          className={`mic-btn${micActive ? ' mic-btn-active' : ''}`}
          onClick={toggleMic}
          title={micActive ? 'Stop microphone' : 'Use microphone / real piano'}
        >
          {micActive ? '🎙️ Listening…' : '🎙️ Use Mic'}
        </button>
      </div>
      {micError && <div className="mic-error">{micError}</div>}
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
