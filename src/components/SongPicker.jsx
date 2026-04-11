import React from 'react'

/**
 * Compact song selector.
 * Shows a "Random" button + one button per song for the current clef.
 * @param {{ songs: Array, selectedId: string|null, onSelect: Function, onRandom: Function }} props
 */
export default function SongPicker({ songs, selectedId, onSelect, onRandom }) {
  return (
    <div className="song-picker" role="group" aria-label="Song selection">
      <button
        className={`song-btn${selectedId === null ? ' song-btn-active' : ''}`}
        aria-pressed={selectedId === null}
        onClick={onRandom}
        title="Generate a random exercise"
      >
        <span aria-hidden="true">🎲 </span>Random
      </button>
      {songs.map((song) => (
        <button
          key={song.id}
          className={`song-btn${selectedId === song.id ? ' song-btn-active' : ''}`}
          aria-pressed={selectedId === song.id}
          onClick={() => onSelect(song)}
          title={song.title}
        >
          {song.title}
        </button>
      ))}
    </div>
  )
}
