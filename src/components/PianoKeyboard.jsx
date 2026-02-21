import React from 'react'

// White key natural notes per octave
const WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

// Black key note names and their positions relative to white keys (left offset in white-key units)
// null means no black key after that white key
const BLACK_KEY_OFFSETS = [
  { note: 'C#', after: 0 },
  { note: 'D#', after: 1 },
  // no black key after E (index 2)
  { note: 'F#', after: 3 },
  { note: 'G#', after: 4 },
  { note: 'A#', after: 5 },
  // no black key after B (index 6)
]

const WHITE_KEY_WIDTH = 40
const WHITE_KEY_HEIGHT = 130
const BLACK_KEY_WIDTH = 26
const BLACK_KEY_HEIGHT = 82

function getKeyColor(noteName, octave, correctKey, incorrectKey, disabled) {
  if (disabled) return null

  // correctKey / incorrectKey are objects: { note, octave } or just a note string
  const isCorrect =
    correctKey &&
    (typeof correctKey === 'string'
      ? correctKey === noteName
      : correctKey.note === noteName && correctKey.octave === octave)

  const isIncorrect =
    incorrectKey &&
    (typeof incorrectKey === 'string'
      ? incorrectKey === noteName
      : incorrectKey.note === noteName && incorrectKey.octave === octave)

  if (isCorrect) return '#22c55e'
  if (isIncorrect) return '#ef4444'
  return null
}

export default function PianoKeyboard({ onKeyPress, correctKey, incorrectKey, disabled, octaves = [4, 5] }) {
  const totalWhite = WHITE_NOTES.length * octaves.length
  const svgWidth = totalWhite * WHITE_KEY_WIDTH + 2
  const svgHeight = WHITE_KEY_HEIGHT + 10

  const whiteKeys = []
  const blackKeys = []

  octaves.forEach((octave, octaveIdx) => {
    const octaveOffset = octaveIdx * WHITE_NOTES.length

    // White keys
    WHITE_NOTES.forEach((noteName, noteIdx) => {
      const x = (octaveOffset + noteIdx) * WHITE_KEY_WIDTH + 1
      const highlight = getKeyColor(noteName, octave, correctKey, incorrectKey, disabled)
      whiteKeys.push(
        <rect
          key={`w-${octave}-${noteName}`}
          x={x}
          y={1}
          width={WHITE_KEY_WIDTH - 2}
          height={WHITE_KEY_HEIGHT - 2}
          rx={3}
          fill={highlight || '#ffffff'}
          stroke="#555"
          strokeWidth={1}
          style={{ cursor: disabled ? 'default' : 'pointer' }}
          onClick={() => !disabled && onKeyPress(noteName, octave)}
        />
      )
    })

    // Black keys
    BLACK_KEY_OFFSETS.forEach(({ note: noteName, after }) => {
      const x = (octaveOffset + after) * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 + 1
      const highlight = getKeyColor(noteName, octave, correctKey, incorrectKey, disabled)
      blackKeys.push(
        <rect
          key={`b-${octave}-${noteName}`}
          x={x}
          y={1}
          width={BLACK_KEY_WIDTH}
          height={BLACK_KEY_HEIGHT}
          rx={3}
          fill={highlight || '#222222'}
          stroke="#000"
          strokeWidth={1}
          style={{ cursor: disabled ? 'default' : 'pointer' }}
          onClick={() => !disabled && onKeyPress(noteName, octave)}
        />
      )
    })
  })

  return (
    <div className="piano-wrapper" style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {/* White keys first (behind black keys) */}
        {whiteKeys}
        {/* Black keys on top */}
        {blackKeys}
      </svg>
    </div>
  )
}
