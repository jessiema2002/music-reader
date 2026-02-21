import React, { useEffect, useRef } from 'react'
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow'

// Color palette
const COLOR_CORRECT = '#22c55e'
const COLOR_INCORRECT = '#ef4444'
const COLOR_CURRENT = '#f59e0b'

const SVG_WIDTH = 560
const SVG_HEIGHT = 170

/**
 * Renders a multi-note song on a staff.
 * Props:
 *   song          - array of note objects
 *   currentIndex  - index of the note the user is currently answering
 *   results       - array of 'correct' | 'incorrect' | null for each note
 *   clef          - 'treble' | 'bass'
 */
export default function StaffDisplay({ song, currentIndex, results, clef = 'treble' }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!song || song.length === 0 || !containerRef.current) return

    containerRef.current.innerHTML = ''

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG)
    renderer.resize(SVG_WIDTH, SVG_HEIGHT)
    const context = renderer.getContext()

    // Build a VexFlow StaveNote for each song note with appropriate color
    const makeStaveNote = (noteObj, index) => {
      const sn = new StaveNote({ keys: [noteObj.vexKey], duration: 'q', clef })
      if (index < currentIndex) {
        const color = results[index] === 'correct' ? COLOR_CORRECT : COLOR_INCORRECT
        sn.setStyle({ fillStyle: color, strokeStyle: color })
      } else if (index === currentIndex) {
        sn.setStyle({ fillStyle: COLOR_CURRENT, strokeStyle: COLOR_CURRENT })
      }
      return sn
    }

    // Split into two measures of 4 quarter notes each
    const half = song.length / 2
    const vexNotes1 = song.slice(0, half).map((n, i) => makeStaveNote(n, i))
    const vexNotes2 = song.slice(half).map((n, i) => makeStaveNote(n, i + half))

    // Measure 1: includes clef + time signature
    const stave1 = new Stave(20, 32, 240)
    stave1.addClef(clef).addTimeSignature('4/4')
    stave1.setContext(context).draw()

    // Measure 2: plain
    const stave2 = new Stave(260, 32, 280)
    stave2.setContext(context).draw()

    const voice1 = new Voice({ num_beats: 4, beat_value: 4 })
    voice1.addTickables(vexNotes1)

    const voice2 = new Voice({ num_beats: 4, beat_value: 4 })
    voice2.addTickables(vexNotes2)

    new Formatter().joinVoices([voice1]).format([voice1], 160)
    new Formatter().joinVoices([voice2]).format([voice2], 240)

    voice1.draw(context, stave1)
    voice2.draw(context, stave2)
  }, [song, currentIndex, results, clef])

  return (
    <div className="staff-wrapper">
      <div ref={containerRef} className="staff-container" />
    </div>
  )
}
